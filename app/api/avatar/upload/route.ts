import { put } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { user } from "@/lib/db-schema"
import { getPostHogClient } from "@/lib/posthog-server"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Upload to Vercel Blob (private access)
    const blob = await put(`avatars/${session.user.id}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    })

    // Get old image URL before updating
    const oldImageUrl = session.user.image

    // Update user record with new avatar URL
    await db.update(user).set({ image: blob.url, updatedAt: new Date() }).where(eq(user.id, session.user.id))

    // Delete old avatar if it was a Vercel Blob URL (async, don't block response)
    if (oldImageUrl && oldImageUrl.includes("blob.vercel-storage.com")) {
      import("@vercel/blob").then(({ del }) => {
        del(oldImageUrl).catch((err) => console.error("Failed to delete old avatar:", err))
      })
    }

    // Track analytics
    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: "avatar_uploaded",
          properties: {
            blob_url: blob.url,
            content_type: blob.contentType,
          },
        })
        posthog.shutdown().catch((err) => console.error("PostHog shutdown error:", err))
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error:", analyticsError)
    }

    // Return the download URL for immediate display
    return NextResponse.json({ url: blob.downloadUrl })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

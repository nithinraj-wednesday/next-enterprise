import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { env } from "@/env.mjs"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { getPostHogClient } from "@/lib/posthog-server"
import { resend, SHARE_PLAYLIST_FROM_EMAIL } from "@/lib/resend"
import { createSharePlaylistEmailContent, getEmailDomain } from "@/lib/share-playlist-email"

const sharePlaylistEmailSchema = z.object({
  email: z.string().trim().email(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params

    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsedBody = sharePlaylistEmailSchema.safeParse(requestBody)
    if (!parsedBody.success) {
      return NextResponse.json({ error: "A valid recipient email is required" }, { status: 400 })
    }

    const normalizedRecipientEmail = parsedBody.data.email.trim().toLowerCase()
    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    if (!targetPlaylist.isPublic || !targetPlaylist.shareToken) {
      return NextResponse.json({ error: "Publish this playlist before emailing it" }, { status: 400 })
    }

    const shareUrl = new URL(`/shared/${targetPlaylist.shareToken}`, env.NEXT_PUBLIC_APP_URL).toString()
    const sharerName = session.user.name?.trim() || session.user.email || "A music fan"
    const content = createSharePlaylistEmailContent({
      playlistName: targetPlaylist.name,
      shareUrl,
      sharerName,
    })

    const { error } = await resend.emails.send(
      {
        from: SHARE_PLAYLIST_FROM_EMAIL,
        to: [normalizedRecipientEmail],
        subject: content.subject,
        html: content.html,
        text: content.text,
      },
      {
        idempotencyKey: `playlist-share-email/${targetPlaylist.id}/${normalizedRecipientEmail}/${targetPlaylist.shareToken}`,
      }
    )

    if (error) {
      console.error("Failed to send playlist share email:", error)
      return NextResponse.json({ error: "Failed to send playlist share email" }, { status: 502 })
    }

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: "playlist_share_email_sent",
          properties: {
            playlist_id: targetPlaylist.id,
            playlist_name: targetPlaylist.name,
            recipient_domain: getEmailDomain(normalizedRecipientEmail),
          },
        })
        await posthog.shutdown()
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error during playlist share email:", analyticsError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to send playlist share email:", error)
    return NextResponse.json({ error: "Failed to send playlist share email" }, { status: 500 })
  }
}

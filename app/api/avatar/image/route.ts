import { get } from "@vercel/blob"
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const blobUrl = searchParams.get("url")

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  // Only allow fetching from our blob store
  if (!blobUrl.includes("blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
  }

  try {
    const result = await get(blobUrl, { access: "private" })

    if (!result) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 })
    }

    // Stream the blob content to the client
    return new NextResponse(result.stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=3600, immutable",
      },
    })
  } catch (error) {
    console.error("Error fetching blob:", error)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}

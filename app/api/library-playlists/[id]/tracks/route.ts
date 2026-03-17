import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { getLibraryPlaylistTracksForUser } from "@/lib/playlists"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params
    const result = await getLibraryPlaylistTracksForUser(session.user.id, id)

    if (!result) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ tracks: result.tracks })
  } catch (error) {
    console.error("Failed to fetch library playlist tracks:", error)
    return NextResponse.json({ error: "Failed to fetch library playlist tracks" }, { status: 500 })
  }
}

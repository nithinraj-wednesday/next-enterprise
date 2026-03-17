import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { saveSharedPlaylistForUser } from "@/lib/playlists"
import { getPostHogClient } from "@/lib/posthog-server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await requireServerSession()
    const { token } = await params
    const result = await saveSharedPlaylistForUser(session.user.id, token)

    if (!result) {
      return NextResponse.json({ error: "Shared playlist not found" }, { status: 404 })
    }

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: result.alreadySaved ? "shared_playlist_save_revisited" : "shared_playlist_saved",
          properties: {
            playlist_id: result.playlist.id,
            playlist_name: result.playlist.name,
            shared_by: result.playlist.ownerName,
          },
        })
        await posthog.shutdown()
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error during shared playlist save:", analyticsError)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to save shared playlist:", error)
    return NextResponse.json({ error: "Failed to save shared playlist" }, { status: 500 })
  }
}

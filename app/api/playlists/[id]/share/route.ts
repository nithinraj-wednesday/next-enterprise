import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { getCacheKey } from "@/lib/cache"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { serializePlaylist } from "@/lib/playlists"
import { getPostHogClient } from "@/lib/posthog-server"
import { redis } from "@/lib/redis"

function createShareToken() {
  return crypto.randomUUID()
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    const now = new Date()
    const shareToken = targetPlaylist.shareToken || createShareToken()

    if (!targetPlaylist.isPublic || !targetPlaylist.shareToken) {
      await db
        .update(playlist)
        .set({
          isPublic: true,
          shareToken,
          sharedAt: targetPlaylist.sharedAt ?? now,
          updatedAt: now,
        })
        .where(eq(playlist.id, id))
    }

    const updatedPlaylist = await db.query.playlist.findFirst({
      where: eq(playlist.id, id),
    })

    if (!updatedPlaylist) {
      throw new Error("Playlist was not returned after updating share state")
    }

    const cacheKey = getCacheKey("playlists", session.user.id)
    try {
      if (redis) {
        await redis.del(cacheKey)
      }
    } catch (cacheError) {
      console.error("Redis cache invalidation error:", cacheError)
    }

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: "playlist_share_enabled",
          properties: {
            playlist_id: updatedPlaylist.id,
            playlist_name: updatedPlaylist.name,
            is_public: updatedPlaylist.isPublic,
          },
        })
        await posthog.shutdown()
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error during playlist sharing:", analyticsError)
    }

    return NextResponse.json({ playlist: serializePlaylist(updatedPlaylist) })
  } catch (error) {
    console.error("Failed to update playlist share state:", error)
    return NextResponse.json({ error: "Failed to update playlist share state" }, { status: 500 })
  }
}

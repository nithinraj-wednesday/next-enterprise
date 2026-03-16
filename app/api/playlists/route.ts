/* eslint-disable @typescript-eslint/no-unused-vars */
import { desc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { CACHE_TTL, getCacheKey } from "@/lib/cache"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { getPostHogClient } from "@/lib/posthog-server"
import { redis } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const session = await requireServerSession()

    // Check Redis cache first
    const cacheKey = getCacheKey("playlists", session.user.id)
    try {
      if (redis) {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return NextResponse.json({
            playlists: typeof cached === "string" ? JSON.parse(cached) : cached,
            cached: true,
          })
        }
      }
    } catch (cacheError) {
      console.error("Redis cache read error:", cacheError)
    }

    // Fetch playlists for the user
    const playlists = await db
      .select()
      .from(playlist)
      .where(eq(playlist.userId, session.user.id))
      .orderBy(desc(playlist.createdAt))

    // Cache the results
    try {
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(playlists), { ex: CACHE_TTL.playlists })
      }
    } catch (cacheError) {
      console.error("Redis cache write error:", cacheError)
    }

    return NextResponse.json({ playlists })
  } catch (error) {
    console.error("Failed to fetch playlists:", error)
    return NextResponse.json({ error: "Unauthorized or failed to fetch playlists" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession()
    const { name } = (await request.json()) as { name: string }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const now = new Date()

    await db.insert(playlist).values({
      id,
      name,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    const newPlaylist = await db.query.playlist.findFirst({
      where: eq(playlist.id, id),
    })

    // Invalidate cache
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
          event: "playlist_created",
          properties: { playlist_id: id, playlist_name: name },
        })
        await posthog.shutdown()
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error during playlist creation:", analyticsError)
    }

    return NextResponse.json({ playlist: newPlaylist }, { status: 201 })
  } catch (error) {
    console.error("Failed to create playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}

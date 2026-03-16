import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"
import { favoritePayloadSchema } from "@/lib/favorites"
import { createFavoriteForUser, listFavoritesForUser } from "@/lib/favorites-db"
import { getPostHogClient } from "@/lib/posthog-server"
import { redis } from "@/lib/redis"

const CACHE_TTL = 60 // 1 minute

function getCacheKey(userId: string) {
  return `favorites:${userId}`
}

export async function GET() {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check Redis cache first
  const cacheKey = getCacheKey(session.user.id)
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ favorites: cached, cached: true })
    }
  } catch (cacheError) {
    console.error("Redis cache read error:", cacheError)
  }

  const favorites = await listFavoritesForUser(session.user.id)

  // Cache the results
  try {
    await redis.setex(cacheKey, CACHE_TTL, favorites)
  } catch (cacheError) {
    console.error("Redis cache write error:", cacheError)
  }

  return NextResponse.json({ favorites })
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = favoritePayloadSchema.parse(body)
    const favorite = await createFavoriteForUser(session.user.id, payload)

    // Invalidate cache
    const cacheKey = getCacheKey(session.user.id)
    try {
      await redis.del(cacheKey)
    } catch (cacheError) {
      console.error("Redis cache invalidation error:", cacheError)
    }

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: "track_favorited",
          properties: {
            track_id: payload.trackId,
            track_name: payload.trackName,
            artist_name: payload.artistName,
          },
        })
        posthog.shutdown().catch((err) => console.error("PostHog shutdown error:", err))
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error:", analyticsError)
    }

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    console.error("Failed to create favorite:", error)
    return NextResponse.json({ error: "Invalid favorite payload" }, { status: 400 })
  }
}

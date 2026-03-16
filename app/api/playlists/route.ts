/* eslint-disable @typescript-eslint/no-unused-vars */
import { desc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { getPostHogClient } from "@/lib/posthog-server"

export async function GET(request: NextRequest) {
  try {
    const session = await requireServerSession()

    // Fetch playlists for the user
    const playlists = await db
      .select()
      .from(playlist)
      .where(eq(playlist.userId, session.user.id))
      .orderBy(desc(playlist.createdAt))

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

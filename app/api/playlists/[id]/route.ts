import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { getPostHogClient } from "@/lib/posthog-server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params
    const { name } = (await request.json()) as { name: string }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    await db
      .update(playlist)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(playlist.id, id))

    const updatedPlaylist = await db.query.playlist.findFirst({
      where: eq(playlist.id, id),
    })

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        try {
          posthog.capture({
            distinctId: session.user.id,
            event: "playlist_renamed",
            properties: { playlist_id: id, new_name: name },
          })
        } finally {
          await posthog.shutdown().catch((err) => console.error("PostHog shutdown error:", err))
        }
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error:", analyticsError)
    }

    return NextResponse.json({ playlist: updatedPlaylist })
  } catch (error) {
    console.error("Failed to rename playlist:", error)
    return NextResponse.json({ error: "Failed to rename playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    await db.delete(playlist).where(eq(playlist.id, id))

    try {
      const posthog = getPostHogClient()
      if (posthog) {
        posthog.capture({
          distinctId: session.user.id,
          event: "playlist_deleted",
          properties: { playlist_id: id, playlist_name: targetPlaylist.name },
        })
        await posthog.shutdown()
      }
    } catch (analyticsError) {
      console.error("PostHog analytics error:", analyticsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete playlist:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}

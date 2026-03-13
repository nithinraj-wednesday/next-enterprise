import { and, desc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { favoriteSong, playlist, playlistTrack } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    const tracks = await db
      .select({
        trackId: favoriteSong.trackId,
        trackName: favoriteSong.trackName,
        artistName: favoriteSong.artistName,
        collectionName: favoriteSong.collectionName,
        previewUrl: favoriteSong.previewUrl,
        artworkUrl60: favoriteSong.artworkUrl60,
        artworkUrl100: favoriteSong.artworkUrl100,
        trackTimeMillis: favoriteSong.trackTimeMillis,
        primaryGenreName: favoriteSong.primaryGenreName,
        trackViewUrl: favoriteSong.trackViewUrl,
        addedAt: playlistTrack.addedAt,
      })
      .from(playlistTrack)
      .innerJoin(
        favoriteSong,
        and(eq(playlistTrack.trackId, favoriteSong.trackId), eq(favoriteSong.userId, session.user.id))
      )
      .where(eq(playlistTrack.playlistId, id))
      .orderBy(desc(playlistTrack.addedAt))

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Failed to fetch playlist tracks:", error)
    return NextResponse.json({ error: "Failed to fetch playlist tracks" }, { status: 500 })
  }
}

import { Track } from "@/lib/types"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params
    const trackData = (await request.json()) as Track

    if (!trackData || !trackData.trackId) {
      return NextResponse.json({ error: "Track data is required" }, { status: 400 })
    }

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    // Upsert into favorite_song to ensure track details exist in DB (even if they aren't marked specifically as a standalone favorite)
    // this acts as a track cache
    const existingTrack = await db.query.favoriteSong.findFirst({
      where: and(eq(favoriteSong.userId, session.user.id), eq(favoriteSong.trackId, trackData.trackId)),
    })

    if (!existingTrack) {
      await db.insert(favoriteSong).values({
        userId: session.user.id,
        trackId: trackData.trackId,
        trackName: trackData.trackName,
        artistName: trackData.artistName,
        collectionName: trackData.collectionName,
        previewUrl: trackData.previewUrl,
        artworkUrl60: trackData.artworkUrl60,
        artworkUrl100: trackData.artworkUrl100,
        trackTimeMillis: trackData.trackTimeMillis,
        primaryGenreName: trackData.primaryGenreName,
        trackViewUrl: trackData.trackViewUrl || null,
        createdAt: new Date(),
      })
    }

    const existingPlaylistTrack = await db.query.playlistTrack.findFirst({
      where: and(eq(playlistTrack.playlistId, id), eq(playlistTrack.trackId, trackData.trackId)),
    })

    if (existingPlaylistTrack) {
      return NextResponse.json({ message: "Track already in playlist" }, { status: 200 })
    }

    await db.insert(playlistTrack).values({
      playlistId: id,
      trackId: trackData.trackId,
      addedAt: new Date(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Failed to add track to playlist:", error)
    return NextResponse.json({ error: "Failed to add track to playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireServerSession()
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const trackIdFromQuery = searchParams.get("trackId")
    let trackIdFromBody: number | null = null

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = (await request.json()) as { trackId?: unknown }
      if (typeof body.trackId === "number") {
        trackIdFromBody = body.trackId
      }
    }

    const trackIdCandidate = trackIdFromQuery ?? (trackIdFromBody !== null ? String(trackIdFromBody) : null)

    if (!trackIdCandidate) {
      return NextResponse.json({ error: "trackId is required" }, { status: 400 })
    }

    const trackId = parseInt(trackIdCandidate, 10)

    if (!Number.isInteger(trackId) || trackId <= 0) {
      return NextResponse.json({ error: "trackId must be a positive integer" }, { status: 400 })
    }

    const targetPlaylist = await db.query.playlist.findFirst({
      where: and(eq(playlist.id, id), eq(playlist.userId, session.user.id)),
    })

    if (!targetPlaylist) {
      return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 404 })
    }

    await db.delete(playlistTrack).where(and(eq(playlistTrack.playlistId, id), eq(playlistTrack.trackId, trackId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove track from playlist:", error)
    return NextResponse.json({ error: "Failed to remove track from playlist" }, { status: 500 })
  }
}

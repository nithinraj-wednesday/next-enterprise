import { and, desc, eq } from "drizzle-orm"
import { CACHE_TTL, getCacheKey } from "./cache"
import { db } from "./db"
import { favoriteSong, playlist, playlistTrack, user } from "./db-schema"
import { redis } from "./redis"
import { Playlist, PlaylistTrack, SharedPlaylistView } from "./types"

type CachedSharedPlaylist = {
  playlist: Omit<SharedPlaylistView["playlist"], "isSavedByViewer">
  tracks: PlaylistTrack[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string"
}

function isPlaylistTrack(value: unknown): value is PlaylistTrack {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.trackId === "number" &&
    typeof value.artistName === "string" &&
    typeof value.collectionName === "string" &&
    typeof value.trackName === "string" &&
    typeof value.previewUrl === "string" &&
    typeof value.artworkUrl60 === "string" &&
    typeof value.artworkUrl100 === "string" &&
    typeof value.trackTimeMillis === "number" &&
    typeof value.primaryGenreName === "string" &&
    isOptionalString(value.trackViewUrl) &&
    isOptionalString(value.releaseDate) &&
    typeof value.addedAt === "string"
  )
}

function isCachedSharedPlaylist(value: unknown): value is CachedSharedPlaylist {
  if (!isRecord(value)) {
    return false
  }

  const cachedPlaylist = value.playlist
  const cachedTracks = value.tracks

  if (!isRecord(cachedPlaylist) || !Array.isArray(cachedTracks)) {
    return false
  }

  return (
    typeof cachedPlaylist.id === "string" &&
    typeof cachedPlaylist.name === "string" &&
    typeof cachedPlaylist.ownerId === "string" &&
    typeof cachedPlaylist.isPublic === "boolean" &&
    isOptionalString(cachedPlaylist.ownerName) &&
    isOptionalString(cachedPlaylist.shareUrl) &&
    isOptionalString(cachedPlaylist.sharedAt) &&
    typeof cachedPlaylist.createdAt === "string" &&
    typeof cachedPlaylist.updatedAt === "string" &&
    cachedTracks.every(isPlaylistTrack)
  )
}

function parseCachedSharedPlaylist(value: unknown): CachedSharedPlaylist | null {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return isCachedSharedPlaylist(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return isCachedSharedPlaylist(value) ? value : null
}

export function serializePlaylist(row: typeof playlist.$inferSelect): Playlist {
  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    isPublic: row.isPublic,
    shareUrl: row.isPublic && row.shareToken ? `/shared/${row.shareToken}` : undefined,
    sharedAt: row.sharedAt ? row.sharedAt.toISOString() : undefined,
    ownerName: row.isSavedShared ? row.sourceOwnerName ?? undefined : undefined,
    savedAt: row.isSavedShared ? row.createdAt.toISOString() : undefined,
    isSavedShared: row.isSavedShared || undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function serializePlaylistTrack(
  row: Omit<PlaylistTrack, "addedAt" | "trackViewUrl"> & {
    trackViewUrl: string | null
    addedAt: Date
  }
): PlaylistTrack {
  return {
    ...row,
    trackViewUrl: row.trackViewUrl ?? undefined,
    addedAt: row.addedAt.toISOString(),
  }
}

export async function listPlaylistsForUser(userId: string) {
  const playlists = await db
    .select()
    .from(playlist)
    .where(and(eq(playlist.userId, userId), eq(playlist.isSavedShared, false)))
    .orderBy(desc(playlist.createdAt))

  return playlists.map(serializePlaylist)
}

export async function listSavedSharedPlaylistsForUser(userId: string) {
  const playlists = await db
    .select()
    .from(playlist)
    .where(and(eq(playlist.userId, userId), eq(playlist.isSavedShared, true)))
    .orderBy(desc(playlist.createdAt))

  return playlists.map(serializePlaylist)
}

export async function getPlaylistTracksForUser(userId: string, playlistId: string) {
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
    .innerJoin(playlist, and(eq(playlist.id, playlistTrack.playlistId), eq(playlist.userId, userId)))
    .innerJoin(favoriteSong, and(eq(playlistTrack.trackId, favoriteSong.trackId), eq(favoriteSong.userId, userId)))
    .where(eq(playlistTrack.playlistId, playlistId))
    .orderBy(desc(playlistTrack.addedAt))

  return tracks.map(serializePlaylistTrack)
}

async function getAccessiblePlaylistRecordForUser(userId: string, playlistId: string) {
  const targetPlaylist = await db.query.playlist.findFirst({
    where: and(eq(playlist.id, playlistId), eq(playlist.userId, userId)),
  })

  if (!targetPlaylist) {
    return null
  }

  return {
    ownerId: targetPlaylist.userId,
    playlist: serializePlaylist(targetPlaylist),
  }
}

export async function getLibraryPlaylistForUser(userId: string, playlistId: string) {
  return getAccessiblePlaylistRecordForUser(userId, playlistId)
}

export async function getLibraryPlaylistTracksForUser(userId: string, playlistId: string) {
  const accessiblePlaylist = await getAccessiblePlaylistRecordForUser(userId, playlistId)

  if (!accessiblePlaylist) {
    return null
  }

  const tracks = await getPlaylistTracksForUser(accessiblePlaylist.ownerId, playlistId)

  return {
    playlist: accessiblePlaylist.playlist,
    tracks,
  }
}

export async function getSharedPlaylistByToken(
  token: string,
  viewerUserId?: string
): Promise<SharedPlaylistView | null> {
  const cacheKey = getCacheKey("shared-playlist", token)

  let cachedData: CachedSharedPlaylist | null = null

  try {
    if (redis) {
      const raw = await redis.get(cacheKey)
      const parsed = parseCachedSharedPlaylist(raw)
      if (parsed) {
        cachedData = parsed
      }
    }
  } catch (cacheError) {
    console.error("Redis cache read error (shared playlist):", cacheError)
  }

  let playlistData: CachedSharedPlaylist

  if (cachedData) {
    playlistData = cachedData
  } else {
    const rows = await db
      .select({
        id: playlist.id,
        name: playlist.name,
        userId: playlist.userId,
        isPublic: playlist.isPublic,
        shareToken: playlist.shareToken,
        sharedAt: playlist.sharedAt,
        isSavedShared: playlist.isSavedShared,
        sourcePlaylistId: playlist.sourcePlaylistId,
        sourceOwnerId: playlist.sourceOwnerId,
        sourceOwnerName: playlist.sourceOwnerName,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        ownerName: user.name,
      })
      .from(playlist)
      .innerJoin(user, eq(playlist.userId, user.id))
      .where(and(eq(playlist.shareToken, token), eq(playlist.isPublic, true), eq(playlist.isSavedShared, false)))
      .limit(1)

    const sourcePlaylist = rows[0]

    if (!sourcePlaylist) {
      return null
    }

    const tracks = await getPlaylistTracksForUser(sourcePlaylist.userId, sourcePlaylist.id)

    playlistData = {
      playlist: {
        ...serializePlaylist(sourcePlaylist),
        ownerId: sourcePlaylist.userId,
        ownerName: sourcePlaylist.ownerName,
      },
      tracks,
    }

    // Cache the viewer-independent data
    try {
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(playlistData), { ex: CACHE_TTL.sharedPlaylist })
      }
    } catch (cacheError) {
      console.error("Redis cache write error (shared playlist):", cacheError)
    }
  }

  // Viewer-specific check — always fresh from DB
  let isSavedByViewer = false

  if (viewerUserId && viewerUserId !== playlistData.playlist.ownerId) {
    const existingSnapshot = await db.query.playlist.findFirst({
      where: and(
        eq(playlist.userId, viewerUserId),
        eq(playlist.isSavedShared, true),
        eq(playlist.sourcePlaylistId, playlistData.playlist.id)
      ),
    })

    isSavedByViewer = Boolean(existingSnapshot)
  }

  return {
    playlist: {
      ...playlistData.playlist,
      isSavedByViewer,
    },
    tracks: playlistData.tracks,
  }
}

export async function saveSharedPlaylistForUser(userId: string, token: string) {
  const rows = await db
    .select({
      id: playlist.id,
      name: playlist.name,
      isPublic: playlist.isPublic,
      shareToken: playlist.shareToken,
      sharedAt: playlist.sharedAt,
      isSavedShared: playlist.isSavedShared,
      sourcePlaylistId: playlist.sourcePlaylistId,
      sourceOwnerId: playlist.sourceOwnerId,
      sourceOwnerName: playlist.sourceOwnerName,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
    })
    .from(playlist)
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(and(eq(playlist.shareToken, token), eq(playlist.isPublic, true), eq(playlist.isSavedShared, false)))
    .limit(1)

  const sourcePlaylist = rows[0]

  if (!sourcePlaylist) {
    return null
  }

  if (sourcePlaylist.userId === userId) {
    return {
      playlist: serializePlaylist(sourcePlaylist),
      alreadySaved: true,
    }
  }

  const existingSnapshot = await db.query.playlist.findFirst({
    where: and(
      eq(playlist.userId, userId),
      eq(playlist.isSavedShared, true),
      eq(playlist.sourcePlaylistId, sourcePlaylist.id)
    ),
  })

  if (existingSnapshot) {
    return {
      playlist: serializePlaylist(existingSnapshot),
      alreadySaved: true,
    }
  }

  const sourceTracks = await getPlaylistTracksForUser(sourcePlaylist.userId, sourcePlaylist.id)
  const snapshotId = crypto.randomUUID()
  const now = new Date()

  const persistedSnapshot = await db.transaction(async (tx) => {
    await tx.insert(playlist).values({
      id: snapshotId,
      name: sourcePlaylist.name,
      isPublic: false,
      shareToken: null,
      sharedAt: null,
      isSavedShared: true,
      sourcePlaylistId: sourcePlaylist.id,
      sourceOwnerId: sourcePlaylist.userId,
      sourceOwnerName: sourcePlaylist.ownerName,
      userId,
      createdAt: now,
      updatedAt: now,
    })

    const snapshot = await tx.query.playlist.findFirst({
      where: and(
        eq(playlist.userId, userId),
        eq(playlist.isSavedShared, true),
        eq(playlist.sourcePlaylistId, sourcePlaylist.id)
      ),
    })

    if (!snapshot) {
      throw new Error("Saved shared playlist snapshot was not persisted")
    }

    if (sourceTracks.length > 0) {
      await tx
        .insert(favoriteSong)
        .values(
          sourceTracks.map((track) => ({
            userId,
            trackId: track.trackId,
            trackName: track.trackName,
            artistName: track.artistName,
            collectionName: track.collectionName,
            previewUrl: track.previewUrl,
            artworkUrl60: track.artworkUrl60,
            artworkUrl100: track.artworkUrl100,
            trackTimeMillis: track.trackTimeMillis,
            primaryGenreName: track.primaryGenreName,
            trackViewUrl: track.trackViewUrl ?? null,
            createdAt: now,
          }))
        )
        .onConflictDoNothing({
          target: [favoriteSong.userId, favoriteSong.trackId],
        })

      await tx
        .insert(playlistTrack)
        .values(
          sourceTracks.map((track) => ({
            playlistId: snapshot.id,
            trackId: track.trackId,
            addedAt: new Date(track.addedAt),
          }))
        )
        .onConflictDoNothing({
          target: [playlistTrack.playlistId, playlistTrack.trackId],
        })
    }

    return snapshot
  })

  return {
    playlist: serializePlaylist(persistedSnapshot),
    alreadySaved: false,
  }
}

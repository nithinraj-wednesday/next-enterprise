import { and, desc, eq } from "drizzle-orm"
import { db } from "./db"
import { favoriteSong, playlist, playlistTrack, savedSharedPlaylist, user } from "./db-schema"
import { Playlist, PlaylistTrack, SharedPlaylistView } from "./types"

export function serializePlaylist(row: typeof playlist.$inferSelect): Playlist {
  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    isPublic: row.isPublic,
    shareUrl: row.isPublic && row.shareToken ? `/shared/${row.shareToken}` : undefined,
    sharedAt: row.sharedAt ? row.sharedAt.toISOString() : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function serializeSavedSharedPlaylist(
  row: typeof playlist.$inferSelect & {
    ownerName: string
    savedAt: Date
  }
): Playlist {
  return {
    ...serializePlaylist(row),
    ownerName: row.ownerName,
    savedAt: row.savedAt.toISOString(),
    isSavedShared: true,
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
    .where(eq(playlist.userId, userId))
    .orderBy(desc(playlist.createdAt))
  return playlists.map(serializePlaylist)
}

export async function listSavedSharedPlaylistsForUser(userId: string) {
  const rows = await db
    .select({
      id: playlist.id,
      name: playlist.name,
      isPublic: playlist.isPublic,
      shareToken: playlist.shareToken,
      sharedAt: playlist.sharedAt,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
      savedAt: savedSharedPlaylist.savedAt,
    })
    .from(savedSharedPlaylist)
    .innerJoin(playlist, eq(savedSharedPlaylist.playlistId, playlist.id))
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(and(eq(savedSharedPlaylist.userId, userId), eq(playlist.isPublic, true)))
    .orderBy(desc(savedSharedPlaylist.savedAt))

  return rows.map(serializeSavedSharedPlaylist)
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
  const ownedPlaylist = await db.query.playlist.findFirst({
    where: and(eq(playlist.id, playlistId), eq(playlist.userId, userId)),
  })

  if (ownedPlaylist) {
    return {
      ownerId: ownedPlaylist.userId,
      playlist: serializePlaylist(ownedPlaylist),
    }
  }

  const rows = await db
    .select({
      id: playlist.id,
      name: playlist.name,
      isPublic: playlist.isPublic,
      shareToken: playlist.shareToken,
      sharedAt: playlist.sharedAt,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
      savedAt: savedSharedPlaylist.savedAt,
    })
    .from(savedSharedPlaylist)
    .innerJoin(playlist, eq(savedSharedPlaylist.playlistId, playlist.id))
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(
      and(
        eq(savedSharedPlaylist.userId, userId),
        eq(savedSharedPlaylist.playlistId, playlistId),
        eq(playlist.isPublic, true)
      )
    )
    .limit(1)

  const savedPlaylist = rows[0]

  if (!savedPlaylist) {
    return null
  }

  return {
    ownerId: savedPlaylist.userId,
    playlist: serializeSavedSharedPlaylist(savedPlaylist),
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
  const rows = await db
    .select({
      id: playlist.id,
      name: playlist.name,
      userId: playlist.userId,
      isPublic: playlist.isPublic,
      shareToken: playlist.shareToken,
      sharedAt: playlist.sharedAt,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
    })
    .from(playlist)
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(and(eq(playlist.shareToken, token), eq(playlist.isPublic, true)))
    .limit(1)

  const targetPlaylist = rows[0]

  if (!targetPlaylist) {
    return null
  }

  const tracks = await getPlaylistTracksForUser(targetPlaylist.userId, targetPlaylist.id)
  let isSavedByViewer = false

  if (viewerUserId && viewerUserId !== targetPlaylist.userId) {
    const existingSave = await db.query.savedSharedPlaylist.findFirst({
      where: and(eq(savedSharedPlaylist.userId, viewerUserId), eq(savedSharedPlaylist.playlistId, targetPlaylist.id)),
    })

    isSavedByViewer = Boolean(existingSave)
  }

  return {
    playlist: {
      ...serializePlaylist(targetPlaylist),
      ownerId: targetPlaylist.userId,
      ownerName: targetPlaylist.ownerName,
      isSavedByViewer,
    },
    tracks,
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
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
    })
    .from(playlist)
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(and(eq(playlist.shareToken, token), eq(playlist.isPublic, true)))
    .limit(1)

  const targetPlaylist = rows[0]

  if (!targetPlaylist) {
    return null
  }

  if (targetPlaylist.userId === userId) {
    return {
      playlist: serializePlaylist(targetPlaylist),
      alreadySaved: true,
    }
  }

  const existingSave = await db.query.savedSharedPlaylist.findFirst({
    where: and(eq(savedSharedPlaylist.userId, userId), eq(savedSharedPlaylist.playlistId, targetPlaylist.id)),
  })

  if (existingSave) {
    const savedRows = await db
      .select({
        id: playlist.id,
        name: playlist.name,
        isPublic: playlist.isPublic,
        shareToken: playlist.shareToken,
        sharedAt: playlist.sharedAt,
        userId: playlist.userId,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        ownerName: user.name,
        savedAt: savedSharedPlaylist.savedAt,
      })
      .from(savedSharedPlaylist)
      .innerJoin(playlist, eq(savedSharedPlaylist.playlistId, playlist.id))
      .innerJoin(user, eq(playlist.userId, user.id))
      .where(and(eq(savedSharedPlaylist.userId, userId), eq(savedSharedPlaylist.playlistId, targetPlaylist.id)))
      .limit(1)

    const savedPlaylist = savedRows[0]

    return {
      playlist: savedPlaylist ? serializeSavedSharedPlaylist(savedPlaylist) : serializePlaylist(targetPlaylist),
      alreadySaved: true,
    }
  }

  const now = new Date()

  await db
    .insert(savedSharedPlaylist)
    .values({
      userId,
      playlistId: targetPlaylist.id,
      savedAt: now,
    })
    .onConflictDoNothing({
      target: [savedSharedPlaylist.userId, savedSharedPlaylist.playlistId],
    })

  const savedRows = await db
    .select({
      id: playlist.id,
      name: playlist.name,
      isPublic: playlist.isPublic,
      shareToken: playlist.shareToken,
      sharedAt: playlist.sharedAt,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      ownerName: user.name,
      savedAt: savedSharedPlaylist.savedAt,
    })
    .from(savedSharedPlaylist)
    .innerJoin(playlist, eq(savedSharedPlaylist.playlistId, playlist.id))
    .innerJoin(user, eq(playlist.userId, user.id))
    .where(and(eq(savedSharedPlaylist.userId, userId), eq(savedSharedPlaylist.playlistId, targetPlaylist.id)))
    .limit(1)

  const savedPlaylist = savedRows[0]

  if (!savedPlaylist) {
    return {
      playlist: serializePlaylist(targetPlaylist),
      alreadySaved: false,
    }
  }

  return {
    playlist: serializeSavedSharedPlaylist(savedPlaylist),
    alreadySaved: false,
  }
}

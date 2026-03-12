import { and, desc, eq } from "drizzle-orm"
import { db } from "./db"
import { favoriteSong } from "./db-schema"
import { FavoritePayload, FavoriteSong } from "./types"

function serializeFavorite(row: typeof favoriteSong.$inferSelect): FavoriteSong {
  return {
    trackId: row.trackId,
    trackName: row.trackName,
    artistName: row.artistName,
    collectionName: row.collectionName,
    previewUrl: row.previewUrl,
    artworkUrl60: row.artworkUrl60,
    artworkUrl100: row.artworkUrl100,
    trackTimeMillis: row.trackTimeMillis,
    primaryGenreName: row.primaryGenreName,
    trackViewUrl: row.trackViewUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listFavoritesForUser(userId: string) {
  const favorites = await db
    .select()
    .from(favoriteSong)
    .where(eq(favoriteSong.userId, userId))
    .orderBy(desc(favoriteSong.createdAt))

  return favorites.map(serializeFavorite)
}

export async function createFavoriteForUser(userId: string, payload: FavoritePayload) {
  const now = new Date()

  await db
    .insert(favoriteSong)
    .values({
      userId,
      ...payload,
      createdAt: now,
    })
    .onConflictDoNothing({
      target: [favoriteSong.userId, favoriteSong.trackId],
    })

  const [favorite] = await db
    .select()
    .from(favoriteSong)
    .where(and(eq(favoriteSong.userId, userId), eq(favoriteSong.trackId, payload.trackId)))
    .limit(1)

  if (!favorite) {
    throw new Error("Favorite could not be created")
  }

  return serializeFavorite(favorite)
}

export async function deleteFavoriteForUser(userId: string, trackId: number) {
  const result = await db
    .delete(favoriteSong)
    .where(and(eq(favoriteSong.userId, userId), eq(favoriteSong.trackId, trackId)))
    .returning({ trackId: favoriteSong.trackId })

  return result.length > 0
}

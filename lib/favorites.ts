import { z } from "zod"
import { FavoritePayload, FavoriteSong, Track } from "./types"

export const favoritePayloadSchema = z.object({
  trackId: z.number().int().positive(),
  trackName: z.string().min(1),
  artistName: z.string().min(1),
  collectionName: z.string().min(1),
  previewUrl: z.string().url(),
  artworkUrl60: z.string().url(),
  artworkUrl100: z.string().url(),
  trackTimeMillis: z.number().int().nonnegative(),
  primaryGenreName: z.string().min(1),
  trackViewUrl: z.string().url().optional(),
})

export function trackToFavoritePayload(track: Track): FavoritePayload {
  return {
    trackId: track.trackId,
    trackName: track.trackName,
    artistName: track.artistName,
    collectionName: track.collectionName,
    previewUrl: track.previewUrl,
    artworkUrl60: track.artworkUrl60,
    artworkUrl100: track.artworkUrl100,
    trackTimeMillis: track.trackTimeMillis,
    primaryGenreName: track.primaryGenreName,
    trackViewUrl: track.trackViewUrl,
  }
}

export function createOptimisticFavorite(track: Track): FavoriteSong {
  return {
    ...trackToFavoritePayload(track),
    createdAt: new Date().toISOString(),
  }
}

export function favoriteToTrack(favorite: FavoriteSong): Track {
  return {
    trackId: favorite.trackId,
    trackName: favorite.trackName,
    artistName: favorite.artistName,
    collectionName: favorite.collectionName,
    previewUrl: favorite.previewUrl,
    artworkUrl60: favorite.artworkUrl60,
    artworkUrl100: favorite.artworkUrl100,
    trackTimeMillis: favorite.trackTimeMillis,
    primaryGenreName: favorite.primaryGenreName,
    trackViewUrl: favorite.trackViewUrl,
  }
}

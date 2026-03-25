"use client"

import posthog from "posthog-js"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { createOptimisticFavorite, trackToFavoritePayload } from "@/lib/favorites"
import { FavoriteSong, Playlist, PlaylistsResponse, PlaylistTracksResponse, Track } from "@/lib/types"

export function useMusicManagement() {
  const [favorites, setFavorites] = useState<FavoriteSong[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(true)
  const [playlistTracksMap, setPlaylistTracksMap] = useState<Record<string, Set<number>>>({})

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites")
      if (res.ok) {
        const data = (await res.json()) as { favorites: FavoriteSong[] }
        setFavorites(data.favorites)
        setFavoriteIds(new Set(data.favorites.map((f: FavoriteSong) => f.trackId)))
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err)
    }
  }, [])

  const fetchPlaylists = useCallback(async () => {
    setPlaylistsLoading(true)
    try {
      const res = await fetch("/api/playlists")
      if (res.ok) {
        const data = (await res.json()) as PlaylistsResponse
        setPlaylists(data.playlists)

        // Fetch tracks for each playlist to build the map
        const map: Record<string, Set<number>> = {}
        await Promise.all(
          data.playlists.map(async (playlist) => {
            try {
              const tracksRes = await fetch(`/api/playlists/${playlist.id}/tracks`)
              if (tracksRes.ok) {
                const tracksData = (await tracksRes.json()) as PlaylistTracksResponse
                map[playlist.id] = new Set(tracksData.tracks.map((t) => t.trackId))
              }
            } catch (e) {
              console.error(`Failed to fetch tracks for playlist ${playlist.id}:`, e)
            }
          })
        )
        setPlaylistTracksMap(map)
      }
    } catch (err) {
      console.error("Failed to fetch playlists:", err)
    } finally {
      setPlaylistsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
    fetchPlaylists()
  }, [fetchFavorites, fetchPlaylists])

  const handleToggleFavorite = useCallback(
    async (track: Track) => {
      const isFavorite = favoriteIds.has(track.trackId)
      const optimisticFavorite = createOptimisticFavorite(trackToFavoritePayload(track))

      setPendingFavoriteIds((prev) => [...prev, track.trackId])

      if (isFavorite) {
        setFavorites((prev) => prev.filter((f) => f.trackId !== track.trackId))
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(track.trackId)
          return next
        })
      } else {
        setFavorites((prev) => [optimisticFavorite, ...prev])
        setFavoriteIds((prev) => new Set(prev).add(track.trackId))
      }

      try {
        const res = isFavorite
          ? await fetch(`/api/favorites/${track.trackId}`, {
              method: "DELETE",
            })
          : await fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(trackToFavoritePayload(track)),
            })

        if (!res.ok) throw new Error("Failed to update favorite")

        toast.success(
          isFavorite ? `Removed "${track.trackName}" from favorites` : `Added "${track.trackName}" to favorites`
        )

        posthog.capture(isFavorite ? "favorite_removed" : "favorite_added", {
          track_id: track.trackId,
          track_name: track.trackName,
        })
      } catch (err) {
        console.error("Favorite toggle failed:", err)
        toast.error("Failed to update favorites")
        // Rollback
        fetchFavorites()
      } finally {
        setPendingFavoriteIds((prev) => prev.filter((id) => id !== track.trackId))
      }
    },
    [favoriteIds, fetchFavorites]
  )

  const handleAddToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(track),
      })

      if (!res.ok) throw new Error("Failed to add to playlist")

      setPlaylistTracksMap((prev) => {
        const next = { ...prev }
        if (!next[playlistId]) next[playlistId] = new Set()
        next[playlistId].add(track.trackId)
        return next
      })

      toast.success(`Added to playlist`)
      posthog.capture("track_added_to_playlist", {
        playlist_id: playlistId,
        track_id: track.trackId,
      })
    } catch (err) {
      console.error("Add to playlist failed:", err)
      toast.error("Failed to add to playlist")
    }
  }, [])

  const handleRemoveFromPlaylist = useCallback(async (playlistId: string, trackId: number) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (!res.ok) throw new Error("Failed to remove from playlist")

      setPlaylistTracksMap((prev) => {
        const next = { ...prev }
        if (next[playlistId]) {
          const nextSet = new Set(next[playlistId])
          nextSet.delete(trackId)
          next[playlistId] = nextSet
        }
        return next
      })

      toast.success(`Removed from playlist`)
      posthog.capture("track_removed_from_playlist", {
        playlist_id: playlistId,
        track_id: trackId,
      })
    } catch (err) {
      console.error("Remove from playlist failed:", err)
      toast.error("Failed to remove from playlist")
    }
  }, [])

  return {
    favorites,
    favoriteIds,
    pendingFavoriteIds,
    playlists,
    playlistsLoading,
    playlistTracksMap,
    handleToggleFavorite,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    refreshPlaylists: fetchPlaylists,
    refreshFavorites: fetchFavorites,
  }
}

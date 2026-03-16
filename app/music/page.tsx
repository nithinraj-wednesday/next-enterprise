"use client"

// @ts-expect-error Will fix it
import { GridViewIcon, ListViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import posthog from "posthog-js"
import { useCallback, useEffect, useState } from "react"
import {
  EmptyState,
  MusicAppHeader,
  PlayerBar,
  SearchBar,
  TrackCard,
  TrackGridSkeleton,
  TrackRow,
} from "@/components/music/MusicComponents"
import { useMusic } from "@/hooks/use-music"
import { useSession } from "@/lib/auth-client"
import { createOptimisticFavorite, trackToFavoritePayload } from "@/lib/favorites"
import { FavoriteSong, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ViewMode } from "./constants"

export default function MusicPage() {
  const { data: sessionData } = useSession()
  const {
    tracks,
    loading,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffled,
    repeatMode,
    searchMusic,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    toggleShuffle,
    playPrevious,
    playNext,
    toggleRepeat,
    formatTime,
  } = useMusic()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchTerm, setSearchTerm] = useState("trending")
  const [hasSearched, setHasSearched] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteSong[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([])

  const favoriteIds = new Set(favorites.map((favorite) => favorite.trackId))

  useEffect(() => {
    searchMusic("trending")
    setHasSearched(true)
  }, [searchMusic])

  useEffect(() => {
    let cancelled = false

    const loadFavorites = async () => {
      setFavoritesLoading(true)
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" })

        if (!response.ok) {
          throw new Error(`Favorites request failed: ${response.status}`)
        }

        const data = (await response.json()) as { favorites: FavoriteSong[] }

        if (!cancelled) {
          setFavorites(data.favorites)
        }
      } catch (error) {
        console.error("Failed to load favorites:", error)
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchTerm(query)
      setHasSearched(true)
      searchMusic(query)
      posthog.capture("music_searched", { query })
    },
    [searchMusic]
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      const isEditable = document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable
      const interactiveTags = ["INPUT", "TEXTAREA", "BUTTON", "SELECT"]
      if (e.code === "Space" && tag && !interactiveTags.includes(tag) && !isEditable) {
        e.preventDefault()
        togglePlayPause()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [togglePlayPause])

  const handlePlayTrack = useCallback(
    (track: Track) => {
      playTrack(track)
      posthog.capture("track_played", {
        track_id: track.trackId,
        track_name: track.trackName,
        artist_name: track.artistName,
        genre: track.primaryGenreName,
      })
    },
    [playTrack]
  )

  const handleToggleFavorite = useCallback(
    async (track: Track) => {
      const existingFavorite = favorites.find((favorite) => favorite.trackId === track.trackId)

      if (pendingFavoriteIds.includes(track.trackId)) {
        return
      }

      setFavoriteError(null)
      setPendingFavoriteIds((current) => [...current, track.trackId])

      if (existingFavorite) {
        setFavorites((current) => current.filter((favorite) => favorite.trackId !== track.trackId))
        posthog.capture("track_unfavorited", {
          track_id: track.trackId,
          track_name: track.trackName,
          artist_name: track.artistName,
        })
      } else {
        setFavorites((current) => [
          createOptimisticFavorite(track),
          ...current.filter((favorite) => favorite.trackId !== track.trackId),
        ])
        posthog.capture("track_favorited", {
          track_id: track.trackId,
          track_name: track.trackName,
          artist_name: track.artistName,
          genre: track.primaryGenreName,
        })
      }

      try {
        const response = await fetch(
          existingFavorite ? `/api/favorites/${track.trackId}` : "/api/favorites",
          existingFavorite
            ? { method: "DELETE" }
            : {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(trackToFavoritePayload(track)),
              }
        )

        if (!response.ok) {
          throw new Error(`Favorite mutation failed: ${response.status}`)
        }

        if (!existingFavorite) {
          const savedFavorite = (await response.json()) as FavoriteSong
          setFavorites((current) => [
            savedFavorite,
            ...current.filter((favorite) => favorite.trackId !== savedFavorite.trackId),
          ])
        }
      } catch (error) {
        console.error("Failed to update favorite:", error)
        setFavoriteError("Could not update your favorites. Please try again.")

        if (existingFavorite) {
          setFavorites((current) => [
            existingFavorite,
            ...current.filter((favorite) => favorite.trackId !== existingFavorite.trackId),
          ])
        } else {
          setFavorites((current) => current.filter((favorite) => favorite.trackId !== track.trackId))
        }
      } finally {
        setPendingFavoriteIds((current) => current.filter((id) => id !== track.trackId))
      }
    },
    [favorites, pendingFavoriteIds]
  )

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <header className="hero-gradient relative pt-8 pb-6 sm:pt-12 sm:pb-8">
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6">
          <MusicAppHeader
            activeRoute="music"
            favoriteCount={favorites.length}
            userName={sessionData?.user?.name}
            searchBar={<SearchBar onSearch={handleSearch} loading={loading} className="!px-4 !py-2" />}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-screen-xl px-4 py-2 sm:px-6 sm:py-4">
        {favoriteError ? (
          <div className="animate-fade-up mb-6 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-100">
            {favoriteError}
          </div>
        ) : null}

        {hasSearched && !loading && tracks.length > 0 && (
          <div className="animate-fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-foreground text-lg font-semibold">
                {searchTerm.toLowerCase() === "trending" ? "Trending" : `Results for "${searchTerm}"`}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {tracks.length} tracks found · 30s previews · tap the heart to save for later
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="glass-card flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-[0.18em] uppercase">
                <span className="text-gold">
                  {favoritesLoading ? "..." : String(favorites.length).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground">Saved tracks</span>
              </div>

              <div className="bg-secondary/60 border-border/50 flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => {
                    setViewMode("grid")
                    posthog.capture("view_mode_changed", { view_mode: "grid" })
                  }}
                  className={cn(
                    "rounded-md p-1.5 transition-all",
                    viewMode === "grid" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  id="view-grid-btn"
                >
                  <HugeiconsIcon icon={GridViewIcon} className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setViewMode("list")
                    posthog.capture("view_mode_changed", { view_mode: "list" })
                  }}
                  className={cn(
                    "rounded-md p-1.5 transition-all",
                    viewMode === "list" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  id="view-list-btn"
                >
                  <HugeiconsIcon icon={ListViewIcon} className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <TrackGridSkeleton />}

        {hasSearched && !loading && tracks.length === 0 && (
          <div className="animate-fade-up py-16 text-center">
            <p className="text-muted-foreground text-sm">
              No results found for &ldquo;{searchTerm}&rdquo;. Try a different search term.
            </p>
          </div>
        )}

        {!loading && tracks.length > 0 && viewMode === "grid" && (
          <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tracks.map((track, i) => (
              <TrackCard
                key={track.trackId}
                track={track}
                isActive={currentTrack?.trackId === track.trackId}
                isPlaying={isPlaying}
                onPlay={handlePlayTrack}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favoriteIds.has(track.trackId)}
                isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                index={i}
              />
            ))}
          </div>
        )}

        {!loading && tracks.length > 0 && viewMode === "list" && (
          <div className="mb-12 flex flex-col gap-1">
            <div className="text-muted-foreground border-border/50 mb-1 flex items-center gap-4 border-b px-3 py-2 text-xs tracking-wider uppercase">
              <span className="w-8 text-center">#</span>
              <span className="size-10 shrink-0" />
              <span className="flex-1">Title</span>
              <span className="hidden md:inline-flex">Genre</span>
              <span className="ml-4 shrink-0">Duration</span>
            </div>
            {tracks.map((track, i) => (
              <TrackRow
                key={track.trackId}
                track={track}
                isActive={currentTrack?.trackId === track.trackId}
                isPlaying={isPlaying}
                onPlay={handlePlayTrack}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favoriteIds.has(track.trackId)}
                isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                index={i}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        {!hasSearched && !loading && <EmptyState />}
      </main>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        onTogglePlay={togglePlayPause}
        onSeek={seekTo}
        onVolumeChange={setVolumeLevel}
        onShuffle={toggleShuffle}
        onPrevious={playPrevious}
        onNext={playNext}
        onRepeat={toggleRepeat}
        isShuffled={isShuffled}
        repeatMode={repeatMode}
        formatTime={formatTime}
      />
    </div>
  )
}

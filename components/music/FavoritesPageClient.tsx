"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useDeferredValue, useEffect, useState } from "react"
import { FavoritesEmptyState, MusicAppHeader, PlayerBar, TrackRow } from "@/components/music/MusicComponents"
import { useMusic } from "@/hooks/use-music"
import { favoriteToTrack } from "@/lib/favorites"
import { FavoriteSong, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FavoritesPageClientProps {
  initialFavorites: FavoriteSong[]
  userName?: string
}

type FavoriteSortOrder = "latest" | "oldest"

export function FavoritesPageClient({ initialFavorites, userName }: FavoritesPageClientProps) {
  const [favorites, setFavorites] = useState(initialFavorites)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([])
  const [sortOrder, setSortOrder] = useState<FavoriteSortOrder>("latest")
  const [searchQuery, setSearchQuery] = useState("")
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffled,
    repeatMode,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    toggleShuffle,
    playPrevious,
    playNext,
    toggleRepeat,
    setTrackList,
    formatTime,
  } = useMusic()
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase()
  const sortedFavorites = [...favorites].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime()
    const rightTime = new Date(right.createdAt).getTime()

    return sortOrder === "latest" ? rightTime - leftTime : leftTime - rightTime
  })
  const visibleFavorites = sortedFavorites.filter((favorite) => {
    if (!normalizedSearchQuery) {
      return true
    }

    const haystack = [favorite.trackName, favorite.artistName, favorite.collectionName, favorite.primaryGenreName]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalizedSearchQuery)
  })

  useEffect(() => {
    setTrackList(
      [...favorites]
        .sort((left, right) => {
          const leftTime = new Date(left.createdAt).getTime()
          const rightTime = new Date(right.createdAt).getTime()

          return sortOrder === "latest" ? rightTime - leftTime : leftTime - rightTime
        })
        .filter((favorite) => {
          if (!normalizedSearchQuery) {
            return true
          }

          const haystack = [favorite.trackName, favorite.artistName, favorite.collectionName, favorite.primaryGenreName]
            .join(" ")
            .toLowerCase()

          return haystack.includes(normalizedSearchQuery)
        })
        .map(favoriteToTrack)
    )
  }, [favorites, normalizedSearchQuery, setTrackList, sortOrder])

  const handleToggleFavorite = useCallback(
    async (track: Track) => {
      const favorite = favorites.find((entry) => entry.trackId === track.trackId)

      if (!favorite || pendingFavoriteIds.includes(track.trackId)) {
        return
      }

      setFavoriteError(null)
      setPendingFavoriteIds((current) => [...current, track.trackId])
      setFavorites((current) => current.filter((entry) => entry.trackId !== track.trackId))

      try {
        const response = await fetch(`/api/favorites/${track.trackId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Favorite delete failed: ${response.status}`)
        }
      } catch (error) {
        console.error("Failed to remove favorite:", error)
        setFavoriteError("Could not remove that track right now.")
        setFavorites((current) => [favorite, ...current.filter((entry) => entry.trackId !== favorite.trackId)])
      } finally {
        setPendingFavoriteIds((current) => current.filter((id) => id !== track.trackId))
      }
    },
    [favorites, pendingFavoriteIds]
  )

  const featuredFavorites = sortedFavorites.slice(0, 3)
  const hasVisibleResults = visibleFavorites.length > 0
  const hasSavedSongs = favorites.length > 0

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <header className="hero-gradient relative pt-8 pb-6 sm:pt-12 sm:pb-10">
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6">
          <MusicAppHeader activeRoute="favorites" favoriteCount={favorites.length} userName={userName} />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="border-gold/20 bg-gold/8 text-gold inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] tracking-[0.22em] uppercase">
                Personal library
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-foreground text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl">
                  Your <span className="text-gold italic">afterglow</span> collection
                </h2>
                <p className="text-muted-foreground max-w-xl text-sm leading-relaxed sm:text-base">
                  The songs worth keeping close. Replay previews, trim the list, and keep a sharper shortlist than your
                  search history ever will.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="glass-card rounded-2xl px-4 py-3">
                  <div className="text-gold text-2xl font-semibold tabular-nums">{favorites.length}</div>
                  <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Saved songs</div>
                </div>
                <div className="glass-card rounded-2xl px-4 py-3">
                  <div className="text-foreground text-2xl font-semibold tabular-nums">
                    {favorites.length === 0
                      ? "0m"
                      : `${Math.round(favorites.reduce((sum, item) => sum + item.trackTimeMillis, 0) / 60000)}m`}
                  </div>
                  <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Preview time</div>
                </div>
                <div className="glass-card rounded-2xl px-4 py-3">
                  <div className="text-foreground text-2xl font-semibold tabular-nums">{visibleFavorites.length}</div>
                  <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Visible now</div>
                </div>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.78_0.145_75_/_0.18),transparent_45%)]" />
              <div className="relative flex min-h-[280px] items-end justify-between gap-4">
                <div className="max-w-[12rem] space-y-2">
                  <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Pinned mood</p>
                  <h3 className="font-display text-foreground text-2xl font-semibold">
                    {featuredFavorites[0]?.trackName ?? "Save a few tracks"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {featuredFavorites[0]?.artistName ?? "Your favorites artwork stack will appear here."}
                  </p>
                  <Link
                    href="/music"
                    className="border-gold/20 bg-gold/10 text-gold hover:bg-gold/15 inline-flex rounded-full border px-4 py-2 text-sm transition-colors"
                  >
                    Find more songs
                  </Link>
                </div>

                <div className="relative h-52 w-44 shrink-0">
                  {featuredFavorites.length > 0 ? (
                    featuredFavorites
                      .slice()
                      .reverse()
                      .map((favorite, index) => (
                        <div
                          key={favorite.trackId}
                          className={cn(
                            "absolute top-0 right-0 overflow-hidden rounded-[1.6rem] border border-white/10 shadow-2xl",
                            index === 0 && "rotate-[-9deg]",
                            index === 1 && "translate-x-[-1.25rem] translate-y-4 rotate-[3deg]",
                            index === 2 && "translate-x-[-2.4rem] translate-y-8 rotate-[10deg]"
                          )}
                        >
                          <Image
                            src={favorite.artworkUrl100}
                            alt={`${favorite.trackName} cover`}
                            width={176}
                            height={176}
                            className="h-44 w-44 object-cover"
                          />
                        </div>
                      ))
                  ) : (
                    <div className="from-secondary to-muted text-muted-foreground flex h-44 w-44 items-center justify-center rounded-[1.6rem] border border-white/8 bg-gradient-to-br text-sm">
                      No covers yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10", currentTrack && "pb-28")}>
        {favoriteError ? (
          <div className="animate-fade-up mb-6 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-100">
            {favoriteError}
          </div>
        ) : null}

        {hasSavedSongs ? (
          <div className="glass-card animate-fade-up mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <label
                htmlFor="favorite-search-input"
                className="text-muted-foreground mb-2 block text-xs tracking-[0.18em] uppercase"
              >
                Search saved songs
              </label>
              <div className="bg-secondary/70 border-border/70 focus-within:border-gold/35 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors">
                <div className="text-gold text-sm">/</div>
                <input
                  id="favorite-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Filter by track, artist, album, or genre"
                  className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="sm:min-w-[15rem]">
              <p className="text-muted-foreground mb-2 text-xs tracking-[0.18em] uppercase">Sort order</p>
              <div className="bg-secondary/60 border-border/60 inline-flex rounded-2xl border p-1">
                <button
                  type="button"
                  onClick={() => setSortOrder("latest")}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm transition-colors",
                    sortOrder === "latest" ? "bg-gold/12 text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={sortOrder === "latest"}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder("oldest")}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm transition-colors",
                    sortOrder === "oldest" ? "bg-gold/12 text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={sortOrder === "oldest"}
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!hasSavedSongs ? (
          <FavoritesEmptyState />
        ) : hasVisibleResults ? (
          <div className="glass-card animate-fade-up overflow-hidden rounded-[2rem] border border-white/8 p-3 sm:p-4">
            <div className="text-muted-foreground border-border/50 mb-2 flex items-center gap-4 border-b px-3 py-3 text-xs tracking-[0.18em] uppercase">
              <span className="w-8 text-center">#</span>
              <span className="size-10 shrink-0" />
              <span className="flex-1">Saved track</span>
              <span className="hidden md:inline-flex">Genre</span>
              <span className="ml-4 shrink-0">Duration</span>
            </div>

            <div className="flex flex-col gap-1">
              {visibleFavorites.map((favorite, index) => {
                const track = favoriteToTrack(favorite)

                return (
                  <TrackRow
                    key={favorite.trackId}
                    track={track}
                    isActive={currentTrack?.trackId === favorite.trackId}
                    isPlaying={isPlaying}
                    onPlay={playTrack}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite
                    isFavoritePending={pendingFavoriteIds.includes(favorite.trackId)}
                    index={index}
                    formatTime={formatTime}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className="glass-card animate-fade-up rounded-[2rem] border border-white/8 px-8 py-14 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">No matches</p>
              <h3 className="font-display text-foreground text-2xl font-semibold">Nothing fits that filter</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Try another artist, track title, album, or genre. Your saved songs are still here, just outside the
                current search.
              </p>
            </div>
          </div>
        )}
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

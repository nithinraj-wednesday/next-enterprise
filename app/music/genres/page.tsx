"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "framer-motion"
import { EllipsisVertical } from "lucide-react"
import Link from "next/link"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { FEATURED_SEARCHES, SEARCH_DEFAULTS } from "@/app/music/constants"
import { MusicAppHeader, PlayerBar, TrackGridSkeleton } from "@/components/music/MusicComponents"
import { MusicSidebarLayout } from "@/components/music/MusicSidebar"
import { TrackListLayout } from "@/components/music/TrackListLayout"
import { TrackOptionsMenu } from "@/components/music/TrackOptionsMenu"
import { Button } from "@/components/ui/button"
import { useMusic } from "@/hooks/use-music"
import { useMusicManagement } from "@/hooks/use-music-management"
import { useSession } from "@/lib/auth-client"
import { SearchResponse, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

function toSectionId(query: string) {
  return `genre-${query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`
}

function GenresContent() {
  const { data: sessionData } = useSession()
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
    addToQueue,
    formatTime,
  } = useMusic()

  const {
    favoriteIds,
    pendingFavoriteIds,
    playlists,
    playlistTracksMap,
    handleToggleFavorite,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
  } = useMusicManagement()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categoryTracks, setCategoryTracks] = useState<Record<string, Track[]>>({})
  const [categoryLoadingMap, setCategoryLoadingMap] = useState<Record<string, boolean>>(() =>
    FEATURED_SEARCHES.reduce<Record<string, boolean>>((accumulator, category) => {
      accumulator[category.query] = true
      return accumulator
    }, {})
  )
  const [categoryExpandedMap, setCategoryExpandedMap] = useState<Record<string, boolean>>(() =>
    FEATURED_SEARCHES.reduce<Record<string, boolean>>((accumulator, category) => {
      accumulator[category.query] = false
      return accumulator
    }, {})
  )
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const totalLoadedTracks = useMemo(
    () => Object.values(categoryTracks).reduce((count, tracks) => count + tracks.length, 0),
    [categoryTracks]
  )

  useEffect(() => {
    let cancelled = false

    const loadCategoryTracks = async () => {
      setCategoryLoadError(null)

      const results = await Promise.allSettled(
        FEATURED_SEARCHES.map(async (category) => {
          const response = await fetch(
            `/api/music/search?term=${encodeURIComponent(category.query)}&entity=${SEARCH_DEFAULTS.entity}&limit=${
              SEARCH_DEFAULTS.limit
            }`,
            { cache: "no-store" }
          )

          if (!response.ok) {
            throw new Error(`Category request failed (${category.label}): ${response.status}`)
          }

          const data = (await response.json()) as SearchResponse
          return {
            query: category.query,
            tracks: data.results.filter((track) => track.previewUrl),
          }
        })
      )

      if (cancelled) return

      const nextCategoryTracks: Record<string, Track[]> = {}
      const nextCategoryLoading: Record<string, boolean> = {}
      let hadFailure = false

      for (const result of results) {
        if (result.status === "fulfilled") {
          nextCategoryTracks[result.value.query] = result.value.tracks
          nextCategoryLoading[result.value.query] = false
        } else {
          hadFailure = true
          console.error("Failed to load genre tracks:", result.reason)
        }
      }

      for (const category of FEATURED_SEARCHES) {
        if (!(category.query in nextCategoryLoading)) {
          nextCategoryLoading[category.query] = false
        }
      }

      setCategoryTracks(nextCategoryTracks)
      setCategoryLoadingMap(nextCategoryLoading)

      if (hadFailure) {
        setCategoryLoadError("Some genre collections could not be loaded.")
      }
    }

    void loadCategoryTracks()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeSectionId) return

    const timeoutId = window.setTimeout(() => {
      setActiveSectionId(null)
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeSectionId])

  const handlePlayTrack = useCallback(
    (track: Track, sourceTracks: Track[]) => {
      setTrackList(sourceTracks)
      if (currentTrack?.trackId === track.trackId) {
        togglePlayPause()
      } else {
        playTrack(track)
      }
    },
    [currentTrack, playTrack, setTrackList, togglePlayPause]
  )

  const renderPlaylistMenu = useCallback(
    (track: Track) => (
      <TrackOptionsMenu
        track={track}
        playlists={playlists}
        playlistTracksMap={playlistTracksMap}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onAddToQueue={addToQueue}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        }
      />
    ),
    [playlists, handleAddToPlaylist, handleRemoveFromPlaylist, playlistTracksMap, addToQueue]
  )

  const handleJumpToTracks = useCallback((query: string) => {
    const sectionId = toSectionId(query)
    setActiveSectionId(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [])

  return (
    <MusicSidebarLayout>
      <div className="bg-background relative min-h-screen overflow-hidden">
        <div className="noise-overlay" />

        <header className="relative pt-4 pb-2 sm:pt-6 sm:pb-4">
          <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
            <MusicAppHeader
              playlistCount={playlists.length + 1}
              userName={sessionData?.user?.name || undefined}
              className="mb-4 sm:mb-6"
            />
          </div>
        </header>

        <main
          className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-3 sm:px-6 sm:py-5", currentTrack && "pb-32")}
        >
          <section className="from-secondary/60 via-background to-background border-border/50 mb-8 overflow-hidden rounded-[2rem] border bg-gradient-to-br p-5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.28em] uppercase">
                  Genre Library
                </div>
                <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  View All Genres
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
                  Browse every featured genre lane in one place, jump straight to a section, or open a full search mix
                  to keep digging through the catalog.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/70 rounded-2xl border border-white/8 p-4">
                  <div className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">Genres</div>
                  <div className="text-foreground mt-2 text-2xl font-semibold">{FEATURED_SEARCHES.length}</div>
                </div>
                <div className="bg-secondary/70 rounded-2xl border border-white/8 p-4">
                  <div className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">Tracks Loaded</div>
                  <div className="text-foreground mt-2 text-2xl font-semibold">{totalLoadedTracks}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {FEATURED_SEARCHES.map((genre) => (
                <div
                  key={genre.query}
                  className="from-secondary/85 to-secondary/40 border-border/50 rounded-[1.5rem] border bg-gradient-to-br p-4"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="bg-gold/12 text-gold flex size-10 items-center justify-center rounded-2xl border border-amber-400/15">
                      <HugeiconsIcon icon={genre.icon} strokeWidth={2} className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-base font-semibold">{genre.label}</h3>
                      <p className="text-muted-foreground text-xs">{genre.query}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleJumpToTracks(genre.query)}
                      className="text-foreground hover:text-gold text-left text-sm font-medium transition-colors"
                    >
                      Jump to tracks
                    </motion.button>
                    <Link
                      href={`/music?search=${encodeURIComponent(genre.query)}`}
                      className="text-muted-foreground hover:text-gold text-sm transition-colors"
                    >
                      Open mix
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {categoryLoadError ? (
            <div className="animate-fade-up mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/8 px-4 py-3 text-sm text-yellow-100">
              {categoryLoadError}
            </div>
          ) : null}

          <section className="space-y-10">
            {FEATURED_SEARCHES.map((genre) => {
              const tracks = categoryTracks[genre.query] ?? []
              const sectionId = toSectionId(genre.query)

              return (
                <motion.div
                  key={genre.query}
                  id={sectionId}
                  className="scroll-mt-24 rounded-[1.75rem]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  animate={
                    activeSectionId === sectionId
                      ? {
                          scale: 1.01,
                          boxShadow: "0 0 0 1px rgba(245, 158, 11, 0.18), 0 26px 70px -45px rgba(245, 158, 11, 0.55)",
                        }
                      : {
                          scale: 1,
                          boxShadow: "0 0 0 0 rgba(245, 158, 11, 0)",
                        }
                  }
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <TrackListLayout
                    title={
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={genre.icon} strokeWidth={2} className="text-gold size-6" />
                        {genre.label}
                      </span>
                    }
                    subtitle={`A focused ${genre.label.toLowerCase()} lane pulled from the iTunes catalog.`}
                    tracks={tracks}
                    loading={categoryLoadingMap[genre.query] ?? false}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onPlay={(track) => handlePlayTrack(track, tracks)}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteIds={favoriteIds}
                    pendingFavoriteIds={pendingFavoriteIds}
                    formatTime={formatTime}
                    renderPlaylistMenu={renderPlaylistMenu}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    isExpanded={categoryExpandedMap[genre.query] ?? false}
                    onToggleExpand={() =>
                      setCategoryExpandedMap((current) => ({
                        ...current,
                        [genre.query]: !current[genre.query],
                      }))
                    }
                    hasMore={tracks.length > 6}
                    className="space-y-4"
                  />
                </motion.div>
              )
            })}
          </section>
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
    </MusicSidebarLayout>
  )
}

export default function GenresPage() {
  return (
    <Suspense fallback={<TrackGridSkeleton />}>
      <GenresContent />
    </Suspense>
  )
}

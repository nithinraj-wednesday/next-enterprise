"use client"

// @ts-expect-error Will fix it
import { GridViewIcon, ListViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useState } from "react"
import {
  EmptyState,
  PlayerBar,
  SearchBar,
  TrackCard,
  TrackGridSkeleton,
  TrackRow,
} from "@/components/music/MusicComponents"
import { useMusic } from "@/hooks/use-music"
import { cn } from "@/lib/utils"

import { FEATURED_SEARCHES, ViewMode } from "./constants"

export default function MusicPage() {
  const {
    tracks,
    loading,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    searchMusic,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    formatTime,
  } = useMusic()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchTerm, setSearchTerm] = useState("classical piano")
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    searchMusic("classical piano")
    setHasSearched(true)
  }, [searchMusic])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchTerm(query)
      setHasSearched(true)
      searchMusic(query)
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

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <header className="hero-gradient relative pt-8 pb-6 sm:pt-12 sm:pb-10">
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between sm:mb-12">
            <div className="flex items-center gap-3">
              <div className="relative size-9">
                <div className="from-gold/80 to-gold/40 absolute inset-0 rounded-full bg-gradient-to-br">
                  <div className="bg-background absolute inset-[35%] rounded-full" />
                </div>
              </div>
              <div>
                <h1 className="font-display text-foreground text-xl leading-none font-bold tracking-tight">
                  Obsidian<span className="text-gold">Sound</span>
                </h1>
                <p className="text-muted-foreground font-body mt-0.5 text-[10px] tracking-[0.2em] uppercase">
                  Music Discovery
                </p>
              </div>
            </div>

            {hasSearched && tracks.length > 0 && (
              <div className="bg-secondary/60 border-border/50 flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => setViewMode("grid")}
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
                  onClick={() => setViewMode("list")}
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
            )}
          </div>

          <div className="mb-8 text-center sm:mb-10">
            <h2 className="font-display text-foreground mb-3 text-3xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Feel the <span className="text-gold italic">frequency</span>
            </h2>
            <p className="text-muted-foreground font-body mx-auto max-w-lg text-sm sm:text-base">
              Explore millions of songs. Preview instantly. Discover what moves you.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} loading={loading} />

          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
            {FEATURED_SEARCHES.map((item) => (
              <button
                key={item.label}
                onClick={() => handleSearch(item.query)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-all duration-200",
                  "bg-secondary/50 border-border/50 text-muted-foreground",
                  "hover:border-gold/30 hover:text-foreground hover:bg-secondary/80",
                  searchTerm === item.query && "border-gold/40 text-gold bg-gold/5"
                )}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10", currentTrack && "pb-28")}>
        {hasSearched && !loading && tracks.length > 0 && (
          <div className="animate-fade-up mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-foreground text-lg font-semibold">
                Results for &ldquo;{searchTerm}&rdquo;
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{tracks.length} tracks found · 30s previews</p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tracks.map((track, i) => (
              <TrackCard
                key={track.trackId}
                track={track}
                isActive={currentTrack?.trackId === track.trackId}
                isPlaying={isPlaying}
                onPlay={playTrack}
                index={i}
              />
            ))}
          </div>
        )}

        {!loading && tracks.length > 0 && viewMode === "list" && (
          <div className="flex flex-col gap-1">
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
                onPlay={playTrack}
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
        formatTime={formatTime}
      />
    </div>
  )
}

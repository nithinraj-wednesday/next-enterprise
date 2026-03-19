"use client"

// @ts-expect-error - hugeicons moduleResolution mismatch
import { GridViewIcon, ListViewIcon, MusicNote01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { TrackCard, TrackGridSkeleton, TrackRow } from "@/components/music/MusicComponents"
import { Track } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TrackListLayoutProps {
  title: React.ReactNode
  subtitle?: string
  tracks: Track[]
  loading: boolean
  currentTrack: Track | null
  isPlaying: boolean
  onPlay: (track: Track) => void
  onToggleFavorite: (track: Track) => void
  favoriteIds: Set<number>
  pendingFavoriteIds: number[]
  formatTime: (s: number) => string
  renderPlaylistMenu: (track: Track) => React.ReactNode
  isExpanded?: boolean
  onToggleExpand?: () => void
  hasMore?: boolean
  className?: string
  hideViewToggle?: boolean
  initialViewMode?: "grid" | "list"
  viewMode?: "grid" | "list"
  onViewModeChange?: (mode: "grid" | "list") => void
}

export function TrackListLayout({
  title,
  subtitle,
  tracks,
  loading,
  currentTrack,
  isPlaying,
  onPlay,
  onToggleFavorite,
  favoriteIds,
  pendingFavoriteIds,
  formatTime,
  renderPlaylistMenu,
  isExpanded = true,
  onToggleExpand,
  hasMore = false,
  className,
  hideViewToggle = false,
  initialViewMode = "grid",
  viewMode: controlledViewMode,
  onViewModeChange,
}: TrackListLayoutProps) {
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">(initialViewMode)
  const viewMode = controlledViewMode ?? internalViewMode
  const setViewMode = onViewModeChange ?? setInternalViewMode

  const visibleTracks = isExpanded ? tracks : tracks.slice(0, 6)

  return (
    <section className={cn("animate-fade-up space-y-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-foreground truncate text-2xl font-semibold sm:text-3xl">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>

        {!hideViewToggle && (
          <div className="bg-secondary/60 border-border/50 flex shrink-0 items-center gap-1 rounded-xl border p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "focus-visible:ring-gold rounded-lg p-1.5 transition-all outline-none focus-visible:ring-1",
                viewMode === "grid" ? "bg-gold/15 text-gold shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <HugeiconsIcon icon={GridViewIcon} className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "focus-visible:ring-gold rounded-lg p-1.5 transition-all outline-none focus-visible:ring-1",
                viewMode === "list" ? "bg-gold/15 text-gold shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <HugeiconsIcon icon={ListViewIcon} className="size-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <TrackGridSkeleton />
      ) : tracks.length === 0 ? (
        <div className="bg-secondary/20 border-border/30 flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center">
          <div className="bg-secondary/40 mb-4 flex size-16 items-center justify-center rounded-full">
            <HugeiconsIcon icon={MusicNote01Icon} className="text-muted-foreground/60 size-8" />
          </div>
          <h3 className="text-foreground text-lg font-medium">No tracks found</h3>
          <p className="text-muted-foreground mt-1 max-w-[250px] text-sm">
            {subtitle ? "We couldn't find any tracks in this category." : "Start discovering new music."}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {visibleTracks.map((track, index) => (
                <TrackCard
                  key={track.trackId}
                  track={track}
                  isActive={currentTrack?.trackId === track.trackId}
                  isPlaying={isPlaying}
                  onPlay={onPlay}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={favoriteIds.has(track.trackId)}
                  isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                  optionsMenu={renderPlaylistMenu(track)}
                  index={index}
                  formatTime={formatTime}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground border-border/50 mb-2 flex items-center gap-4 border-b px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase">
                <span className="w-8 text-center">#</span>
                <span className="size-10 shrink-0" />
                <span className="flex-1">Title</span>
                <span className="hidden w-32 md:inline-flex">Genre</span>
                <span className="ml-4 w-16 shrink-0 text-right">Time</span>
              </div>

              <div className="space-y-1">
                {visibleTracks.map((track, index) => (
                  <TrackRow
                    key={track.trackId}
                    track={track}
                    isActive={currentTrack?.trackId === track.trackId}
                    isPlaying={isPlaying}
                    onPlay={onPlay}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favoriteIds.has(track.trackId)}
                    isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                    index={index}
                    formatTime={formatTime}
                    optionsMenu={renderPlaylistMenu(track)}
                  />
                ))}
              </div>
            </div>
          )}

          {hasMore && onToggleExpand && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={onToggleExpand}
                className="text-muted-foreground border-border/60 hover:border-gold/40 hover:text-gold bg-secondary/30 hover:bg-secondary/50 group flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-95"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? "Show less" : `Show all ${tracks.length} tracks`}</span>
                {isExpanded ? (
                  <ChevronUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
                ) : (
                  <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

"use client"

import {
  MusicNote01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  Search01Icon,
  ShuffleIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  // @ts-expect-error - hugeicons moduleResolution mismatch
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState } from "react"
import { getArtworkUrl } from "@/app/music/constants"
import { PlayerBarProps, SearchBarProps, TrackCardProps, TrackRowProps } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !focused) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [focused])

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl px-5 py-3 transition-all duration-300",
        "bg-secondary/80 border-border border",
        focused && "border-gold/40 ring-gold-glow shadow-[0_0_30px_-5px_var(--gold-glow)] ring-2"
      )}
    >
      <HugeiconsIcon
        icon={Search01Icon}
        className={cn(
          "size-5 shrink-0 transition-colors duration-200",
          focused ? "text-gold" : "text-muted-foreground"
        )}
        strokeWidth={2}
      />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search artists, songs, albums..."
        className="text-foreground placeholder:text-muted-foreground font-body flex-1 bg-transparent text-base outline-none"
        id="music-search-input"
      />

      {loading ? (
        <div className="border-gold/30 border-t-gold size-5 animate-spin rounded-full border-2" />
      ) : (
        <kbd className="bg-muted text-muted-foreground hidden items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] sm:inline-flex">
          /
        </kbd>
      )}
    </form>
  )
}

export function TrackCard({ track, isActive, isPlaying, onPlay, index }: TrackCardProps) {
  const artworkUrl = getArtworkUrl(track.artworkUrl100, "medium")

  return (
    <button
      onClick={() => onPlay(track)}
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl text-left transition-all duration-300",
        "hover:bg-secondary/60",
        "animate-fade-up p-2.5",
        isActive && "bg-secondary/80 ring-gold/20 ring-1"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      id={`track-card-${track.trackId}`}
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">
        {artworkUrl ? (
          <>
            <img
              src={artworkUrl}
              alt={`${track.trackName} by ${track.artistName}`}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div
              className="artwork-glow"
              style={{
                background: `url(${artworkUrl})`,
                backgroundSize: "cover",
              }}
            />
          </>
        ) : (
          <div className="bg-muted flex size-full items-center justify-center">
            <HugeiconsIcon icon={MusicNote01Icon} className="text-muted-foreground size-10" strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full shadow-xl transition-transform duration-200",
              "bg-gold text-primary-foreground",
              "scale-75 group-hover:scale-100",
              isActive && isPlaying && "animate-pulse-glow"
            )}
          >
            {isActive && isPlaying ? (
              <div className="flex h-4 items-end gap-[3px]">
                <div className="eq-bar" />
                <div className="eq-bar" />
                <div className="eq-bar" />
                <div className="eq-bar" />
              </div>
            ) : (
              <HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-5" fill="currentColor" />
            )}
          </div>
        </div>

        {isActive && (
          <div className="absolute bottom-2 left-2 z-10 flex h-3 items-end gap-[2px]">
            <div className="eq-bar !w-[2px]" />
            <div className="eq-bar !w-[2px]" />
            <div className="eq-bar !w-[2px]" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span className={cn("truncate text-sm leading-tight font-medium", isActive ? "text-gold" : "text-foreground")}>
          {track.trackName}
        </span>
        <span className="text-muted-foreground truncate text-xs">{track.artistName}</span>
      </div>
    </button>
  )
}

export function TrackRow({ track, isActive, isPlaying, onPlay, index, formatTime }: TrackRowProps) {
  const artworkUrl = getArtworkUrl(track.artworkUrl60, "small")

  return (
    <button
      onClick={() => onPlay(track)}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-4 rounded-xl p-3 text-left transition-all duration-200",
        "hover:bg-secondary/60",
        "animate-fade-up",
        isActive && "bg-secondary/80"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      id={`track-row-${track.trackId}`}
    >
      <div className="w-8 shrink-0 text-center">
        {isActive && isPlaying ? (
          <div className="flex h-4 items-end justify-center gap-[2px]">
            <div className="eq-bar !w-[2px]" />
            <div className="eq-bar !w-[2px]" />
            <div className="eq-bar !w-[2px]" />
          </div>
        ) : (
          <span
            className={cn(
              "text-sm tabular-nums transition-colors",
              isActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
        {artworkUrl ? (
          <img src={artworkUrl} alt={track.trackName} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="bg-muted size-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-medium", isActive ? "text-gold" : "text-foreground")}>
          {track.trackName}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {track.artistName} · {track.collectionName}
        </div>
      </div>

      <span className="text-muted-foreground bg-muted/60 hidden rounded-full px-2 py-0.5 text-xs md:inline-flex">
        {track.primaryGenreName}
      </span>

      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {formatTime(track.trackTimeMillis / 1000)}
      </span>
    </button>
  )
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  progress,
  duration,
  volume,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onShuffle,
  onPrevious,
  onNext,
  onRepeat,
  isShuffled,
  repeatMode,
  formatTime,
}: PlayerBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeBarRef = useRef<HTMLDivElement>(null)

  if (!currentTrack) return null

  const artworkUrl = getArtworkUrl(currentTrack.artworkUrl100, "small")
  const currentTime = (progress / 100) * duration

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    onSeek(Math.max(0, Math.min(100, pct)))
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return
    const rect = volumeBarRef.current.getBoundingClientRect()
    const vol = (e.clientX - rect.left) / rect.width
    onVolumeChange(Math.max(0, Math.min(1, vol)))
  }

  return (
    <div className="player-glass animate-fade-up fixed right-0 bottom-0 left-0 z-50" id="player-bar">
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="progress-track bg-border/30 group absolute top-0 right-0 left-0 h-1 cursor-pointer transition-all hover:h-1.5"
      >
        <div className="bg-gold h-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
        <div
          className="progress-thumb bg-gold absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex max-w-xs min-w-0 flex-1 items-center gap-3">
          <div className="size-12 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/5">
            {artworkUrl ? (
              <img src={artworkUrl} alt={currentTrack.trackName} className="size-full object-cover" />
            ) : (
              <div className="bg-muted size-full" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-medium">{currentTrack.trackName}</div>
            <div className="text-muted-foreground truncate text-xs">{currentTrack.artistName}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onShuffle}
              className={cn(
                "p-1 transition-colors",
                isShuffled ? "text-gold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={isShuffled ? "Shuffle on" : "Shuffle off"}
              aria-pressed={isShuffled}
            >
              <HugeiconsIcon icon={ShuffleIcon} className="size-4" strokeWidth={2} />
            </button>

            <button
              onClick={onPrevious}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label="Previous"
            >
              <HugeiconsIcon icon={PreviousIcon} className="size-5" fill="currentColor" />
            </button>

            <button
              onClick={onTogglePlay}
              className="bg-foreground text-background flex size-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
              id="player-play-pause"
            >
              {isPlaying ? (
                <HugeiconsIcon icon={PauseIcon} className="size-5" fill="currentColor" />
              ) : (
                <HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label="Next"
            >
              <HugeiconsIcon icon={NextIcon} className="size-5" fill="currentColor" />
            </button>

            <button
              onClick={onRepeat}
              className={cn(
                "p-1 transition-colors",
                repeatMode !== "off" ? "text-gold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={`Repeat ${repeatMode}`}
              aria-pressed={repeatMode !== "off"}
            >
              <HugeiconsIcon
                icon={RepeatIcon}
                className={cn("size-4", repeatMode === "one" && "text-xs")}
                strokeWidth={2}
              />
              {repeatMode === "one" && <span className="absolute -mt-1 text-[8px]">1</span>}
            </button>
          </div>

          <div className="text-muted-foreground hidden items-center gap-2 text-[11px] tabular-nums sm:flex">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden max-w-xs flex-1 items-center justify-end gap-2 sm:flex">
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            aria-label="Volume"
          >
            {volume === 0 ? (
              <HugeiconsIcon icon={VolumeMute01Icon} className="size-4" strokeWidth={2} />
            ) : (
              <HugeiconsIcon icon={VolumeHighIcon} className="size-4" strokeWidth={2} />
            )}
          </button>
          <div
            ref={volumeBarRef}
            onClick={handleVolumeClick}
            className="bg-border/50 group relative h-1 w-24 cursor-pointer rounded-full"
          >
            <div className="bg-foreground/70 h-full rounded-full" style={{ width: `${volume * 100}%` }} />
            <div
              className="bg-foreground absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TrackGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-fade-up flex flex-col gap-3 p-2.5" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="skeleton-shimmer aspect-square rounded-lg" />
          <div className="flex flex-col gap-1.5 px-0.5">
            <div className="skeleton-shimmer h-3.5 w-3/4 rounded-md" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative size-32">
        <div className="from-secondary to-muted border-border absolute inset-0 rounded-full border bg-gradient-to-br">
          <div className="bg-background border-border absolute inset-[30%] rounded-full border" />
          <div className="bg-gold/20 absolute inset-[44%] rounded-full" />
          <div className="absolute inset-[15%] rounded-full border border-white/[0.03]" />
          <div className="absolute inset-[20%] rounded-full border border-white/[0.03]" />
          <div className="absolute inset-[25%] rounded-full border border-white/[0.03]" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
      </div>

      <div className="max-w-sm text-center">
        <h3 className="font-display text-foreground mb-2 text-lg font-semibold">Discover Your Sound</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Search for any artist, song, or album to start exploring. We&apos;ll play 30-second previews from the iTunes
          catalog.
        </p>
      </div>
    </div>
  )
}

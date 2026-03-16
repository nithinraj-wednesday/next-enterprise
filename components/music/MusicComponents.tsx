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
import { ChevronDown, ChevronUp, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { getArtworkUrl } from "@/app/music/constants"
import { ProfileDropdown } from "@/components/ProfileDropdown"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PlayerBarProps, SearchBarProps, TrackCardProps, TrackRowProps } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MusicAppHeaderProps {
  activeRoute: "music" | "favorites"
  favoriteCount: number
  userName?: string
  searchBar?: React.ReactNode
}

interface FavoriteButtonProps {
  isFavorite: boolean
  isPending?: boolean
  onClick: () => void
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.7 4.9 13.9a4.8 4.8 0 0 1 0-7 4.95 4.95 0 0 1 7 0l.1.1.1-.1a4.95 4.95 0 0 1 7 7L12 20.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FavoriteButton({ isFavorite, isPending, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border transition-all duration-200",
        "backdrop-blur-sm",
        isFavorite
          ? "border-gold/40 bg-gold/15 text-gold shadow-[0_0_24px_-10px_var(--gold-glow)]"
          : "text-muted-foreground hover:border-gold/30 hover:text-gold border-border bg-background/80 dark:border-white/10 dark:bg-black/35",
        isPending && "cursor-wait opacity-70"
      )}
    >
      {isPending ? (
        <div className="border-gold/30 border-t-gold size-4 animate-spin rounded-full border-2" />
      ) : (
        <HeartIcon filled={isFavorite} />
      )}
    </button>
  )
}

export function MusicAppHeader({ activeRoute, favoriteCount, userName: _userName, searchBar }: MusicAppHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Go to home page">
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
        </Link>

        {searchBar ? (
          <div className="order-3 w-full flex-1 md:order-none md:w-auto md:max-w-md">{searchBar}</div>
        ) : null}

        <div className="order-2 flex shrink-0 items-center gap-3 md:order-none">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/music"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200",
            activeRoute === "music"
              ? "border-gold/40 bg-gold/10 text-gold"
              : "border-border/60 bg-secondary/55 text-muted-foreground hover:text-foreground"
          )}
        >
          Discover
          <span className="bg-foreground/10 rounded-full px-2 py-0.5 text-[10px] tracking-[0.18em] uppercase">
            Live
          </span>
        </Link>
        <Link
          href="/favorites"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200",
            activeRoute === "favorites"
              ? "border-gold/40 bg-gold/10 text-gold"
              : "border-border/60 bg-secondary/55 text-muted-foreground hover:text-foreground"
          )}
        >
          Playlists
          <span className="bg-foreground/10 rounded-full px-2 py-0.5 text-[10px] tabular-nums">{favoriteCount}</span>
        </Link>
      </nav>
    </div>
  )
}

export function SearchBar({ onSearch, loading, className }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSearchedRef = useRef("")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery === lastSearchedRef.current) return

    debounceTimerRef.current = setTimeout(() => {
      onSearch(trimmedQuery, { shouldScroll: false })
      lastSearchedRef.current = trimmedQuery
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [query, onSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      if (trimmedQuery !== lastSearchedRef.current) {
        onSearch(trimmedQuery, { shouldScroll: true })
        lastSearchedRef.current = trimmedQuery
      } else {
        onSearch(trimmedQuery, { shouldScroll: true })
      }
    }
  }

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    setQuery("")
    lastSearchedRef.current = ""
    onSearch("", { shouldScroll: false })
    inputRef.current?.focus()
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
        focused && "border-gold/40 ring-gold-glow shadow-[0_0_30px_-5px_var(--gold-glow)] ring-2",
        className
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

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground animate-in fade-in zoom-in p-1 transition-all duration-200"
          aria-label="Clear search"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      )}

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

export function TrackCard({
  track,
  isActive,
  isPlaying,
  onPlay,
  onToggleFavorite,
  isFavorite = false,
  isFavoritePending = false,
  index,
  formatTime,
  optionsMenu,
}: TrackCardProps) {
  const artworkUrl = getArtworkUrl(track.artworkUrl100, "medium")

  return (
    <div
      className={cn(
        "group animate-fade-up hover:bg-secondary/60 rounded-xl p-2.5 transition-all duration-300",
        "animate-fade-up p-2.5",
        isActive && "bg-secondary/80 ring-gold/20 ring-1"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative">
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
          {optionsMenu}
          <div className="bg-background/80 text-muted-foreground inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] tabular-nums backdrop-blur-sm sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {formatTime(track.trackTimeMillis / 1000)}
          </div>
        </div>

        {onToggleFavorite ? (
          <div className="absolute top-2 right-2 z-20">
            <FavoriteButton
              isFavorite={isFavorite}
              isPending={isFavoritePending}
              onClick={() => onToggleFavorite(track)}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onPlay(track)}
          className="flex w-full cursor-pointer flex-col text-left"
          id={`track-card-${track.trackId}`}
        >
          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg">
            {artworkUrl ? (
              <>
                <Image
                  src={artworkUrl}
                  alt={`${track.trackName} by ${track.artistName}`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
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

            {isActive ? (
              <div className="absolute bottom-2 left-2 z-10 flex h-3 items-end gap-[2px]">
                <div className="eq-bar !w-[2px]" />
                <div className="eq-bar !w-[2px]" />
                <div className="eq-bar !w-[2px]" />
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
            <span
              className={cn("truncate text-sm leading-tight font-medium", isActive ? "text-gold" : "text-foreground")}
            >
              {track.trackName}
            </span>
            <span className="text-muted-foreground truncate text-xs">{track.artistName}</span>
          </div>
        </button>
      </div>
    </div>
  )
}

export function TrackRow({
  track,
  isActive,
  isPlaying,
  onPlay,
  onToggleFavorite,
  isFavorite = false,
  isFavoritePending = false,
  index,
  formatTime,
  optionsMenu,
}: TrackRowProps) {
  const artworkUrl = getArtworkUrl(track.artworkUrl60, "small")

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl p-2 transition-all duration-200",
        "hover:bg-secondary/60",
        "animate-fade-up",
        isActive && "bg-secondary/80"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        type="button"
        onClick={() => onPlay(track)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-lg px-1 py-1 text-left"
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
            <Image src={artworkUrl} alt={track.trackName} className="object-cover" fill sizes="40px" loading="lazy" />
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

      <div className="flex shrink-0 items-center gap-2">
        {optionsMenu}
        {onToggleFavorite ? (
          <FavoriteButton
            isFavorite={isFavorite}
            isPending={isFavoritePending}
            onClick={() => onToggleFavorite(track)}
          />
        ) : null}
      </div>
    </div>
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
  const collapsedProgressBarRef = useRef<HTMLDivElement>(null)
  const expandedProgressBarRef = useRef<HTMLDivElement>(null)
  const volumeBarRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (currentTrack) {
      setIsExpanded(false)
    }
  }, [currentTrack?.trackId])

  if (!currentTrack) return null

  const artworkUrl = getArtworkUrl(currentTrack.artworkUrl100, isExpanded ? "large" : "small")
  const currentTime = (progress / 100) * duration

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>, barRef: React.RefObject<HTMLDivElement | null>) => {
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
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
    <>
      {isExpanded ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsExpanded(false)}
            aria-label="Close expanded player"
          />

          <div
            className="animate-fade-up from-background/95 to-background/90 fixed right-0 bottom-0 left-0 z-50 h-[75vh] min-h-[360px] overflow-hidden rounded-t-[2rem] border-t border-white/10 bg-gradient-to-b shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            id="player-bar"
          >
            <div className="mx-auto flex h-full w-full max-w-screen-md flex-col px-5 pt-4 pb-6 sm:px-8">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="bg-secondary/65 text-muted-foreground hover:text-foreground hover:bg-secondary flex size-9 items-center justify-center rounded-full transition-colors"
                  aria-label="Collapse player"
                  aria-expanded={isExpanded}
                >
                  <ChevronDown className="size-4" />
                </button>
                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Now Playing</p>
                <div className="size-9" />
              </div>

              <div className="relative mx-auto mb-4 aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                {artworkUrl ? (
                  <Image src={artworkUrl} alt={currentTrack.trackName} className="object-cover" fill sizes="220px" />
                ) : (
                  <div className="bg-muted flex size-full items-center justify-center">
                    <HugeiconsIcon icon={MusicNote01Icon} className="text-muted-foreground size-12" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-foreground truncate text-lg font-semibold">{currentTrack.trackName}</div>
                <div className="text-muted-foreground truncate text-sm">{currentTrack.artistName}</div>
              </div>

              <div className="mt-4">
                <div
                  ref={expandedProgressBarRef}
                  onClick={(event) => handleProgressClick(event, expandedProgressBarRef)}
                  className="progress-track bg-border/35 group relative h-1.5 cursor-pointer rounded-full"
                >
                  <div
                    className="bg-gold h-full rounded-full transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="progress-thumb bg-gold absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
                    style={{ left: `${progress}%` }}
                  />
                </div>
                <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
                <button
                  onClick={onShuffle}
                  className={cn(
                    "p-2 transition-colors",
                    isShuffled ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={isShuffled ? "Shuffle on" : "Shuffle off"}
                  aria-pressed={isShuffled}
                >
                  <HugeiconsIcon icon={ShuffleIcon} className="size-5" strokeWidth={2} />
                </button>

                <button
                  onClick={onPrevious}
                  className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                  aria-label="Previous"
                >
                  <HugeiconsIcon icon={PreviousIcon} className="size-6" fill="currentColor" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="bg-foreground text-background flex size-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  id="player-play-pause"
                >
                  {isPlaying ? (
                    <HugeiconsIcon icon={PauseIcon} className="size-7" fill="currentColor" />
                  ) : (
                    <HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-7" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                  aria-label="Next"
                >
                  <HugeiconsIcon icon={NextIcon} className="size-6" fill="currentColor" />
                </button>

                <button
                  onClick={onRepeat}
                  className={cn(
                    "p-2 transition-colors",
                    repeatMode !== "off" ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`Repeat ${repeatMode}`}
                  aria-pressed={repeatMode !== "off"}
                >
                  <HugeiconsIcon
                    icon={RepeatIcon}
                    className={cn("size-5", repeatMode === "one" && "text-xs")}
                    strokeWidth={2}
                  />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
                  className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label="Volume"
                >
                  {volume === 0 ? (
                    <HugeiconsIcon icon={VolumeMute01Icon} className="size-5" strokeWidth={2} />
                  ) : (
                    <HugeiconsIcon icon={VolumeHighIcon} className="size-5" strokeWidth={2} />
                  )}
                </button>

                <div
                  ref={volumeBarRef}
                  onClick={handleVolumeClick}
                  className="bg-border/50 group relative h-1.5 w-36 cursor-pointer rounded-full"
                >
                  <div className="bg-foreground/75 h-full rounded-full" style={{ width: `${volume * 100}%` }} />
                  <div
                    className="bg-foreground absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ left: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="player-glass animate-fade-up fixed right-0 bottom-0 left-0 z-50" id="player-bar">
          <div
            ref={collapsedProgressBarRef}
            onClick={(event) => handleProgressClick(event, collapsedProgressBarRef)}
            className="progress-track bg-border/30 group absolute top-0 right-0 left-0 h-1 cursor-pointer transition-all hover:h-1.5"
          >
            <div className="bg-gold h-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
            <div
              className="progress-thumb bg-gold absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-2.5 sm:px-6">
            <div className="flex max-w-xs min-w-0 flex-1 items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/5">
                {artworkUrl ? (
                  <Image src={artworkUrl} alt={currentTrack.trackName} className="object-cover" fill sizes="48px" />
                ) : (
                  <div className="bg-muted size-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-foreground truncate text-sm font-medium">{currentTrack.trackName}</div>
                <div className="text-muted-foreground flex items-center gap-2 truncate text-xs">
                  <span className="truncate">{currentTrack.artistName}</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap opacity-60">
                    <span className="bg-foreground/10 h-2.5 w-px" />
                    <span className="tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                onClick={onPrevious}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                aria-label="Previous"
              >
                <HugeiconsIcon icon={PreviousIcon} className="size-5" fill="currentColor" />
              </button>

              <button
                onClick={onTogglePlay}
                className="bg-foreground text-background flex size-9 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
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
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border border-transparent transition-colors"
                aria-label="Expand player"
                aria-expanded={isExpanded}
              >
                <ChevronUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

export function FavoritesEmptyState() {
  return (
    <div className="glass-card animate-fade-up mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 rounded-[2rem] px-8 py-16 text-center">
      <div className="border-gold/20 bg-gold/8 text-gold flex size-20 items-center justify-center rounded-full border">
        <HeartIcon filled />
      </div>
      <div className="max-w-md space-y-3">
        <h3 className="font-display text-foreground text-2xl font-semibold">Your saved stack is empty</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Start favoriting tracks from discovery to build a replayable shortlist you can come back to any time.
        </p>
      </div>
      <Link
        href="/music"
        className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/15 rounded-full border px-5 py-2 text-sm transition-colors"
      >
        Browse songs
      </Link>
    </div>
  )
}

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
import { useCallback, useEffect, useRef, useState } from "react"
import { getArtworkUrl } from "@/app/music/constants"
import { RecentlySearchedDropdown } from "@/components/music/RecentlySearchedDropdown"
import { ProfileDropdown } from "@/components/ProfileDropdown"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PlayerBarProps, SearchBarProps, TrackCardProps, TrackRowProps } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MusicAppHeaderProps {
  playlistCount: number
  userName?: string
  searchBar?: React.ReactNode
  className?: string
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

export function MusicAppHeader({
  playlistCount: _playlistCount,
  userName: _userName,
  searchBar,
  className,
}: MusicAppHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-12", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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
        </div>

        {searchBar ? (
          <div className="order-3 w-full flex-1 md:order-none md:w-auto md:max-w-md">{searchBar}</div>
        ) : null}

        <div className="order-2 flex shrink-0 items-center gap-3 md:order-none">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </div>
  )
}

export function SearchBar({
  onSearch,
  loading,
  className,
  recentlySearched,
  onSelectRecentTrack,
  onRemoveRecentTrack,
  onClearRecentSearches,
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSearchedRef = useRef("")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Click-outside to dismiss dropdown
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  // Keyboard shortcuts: "/" to focus, Escape to dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !focused) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && focused) {
        setFocused(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [focused])

  const showDropdown = focused && !query.trim() && recentlySearched && recentlySearched.length > 0

  const handleSelectRecent = useCallback(
    (track: import("@/lib/types").Track) => {
      onSelectRecentTrack?.(track)
      setFocused(false)
      inputRef.current?.blur()
    },
    [onSelectRecentTrack]
  )

  const handleClearRecent = useCallback(() => {
    onClearRecentSearches?.()
    inputRef.current?.focus()
  }, [onClearRecentSearches])

  return (
    <div ref={containerRef} className="relative">
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

      {showDropdown && (
        <RecentlySearchedDropdown
          tracks={recentlySearched}
          onSelect={handleSelectRecent}
          onRemove={(trackId) => onRemoveRecentTrack?.(trackId)}
          onClear={handleClearRecent}
        />
      )}
    </div>
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
          <div className="bg-background/80 text-muted-foreground inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] tabular-nums backdrop-blur-sm sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
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
                  <HugeiconsIcon icon={PauseIcon} className="size-5" fill="currentColor" />
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
        </button>
        <div className="flex min-w-0 items-start gap-2 px-0.5">
          <button type="button" onClick={() => onPlay(track)} className="min-w-0 flex-1 cursor-pointer text-left">
            <div className="flex flex-col gap-0.5">
              <span
                className={cn("truncate text-sm leading-tight font-medium", isActive ? "text-gold" : "text-foreground")}
              >
                {track.trackName}
              </span>
              <span className="text-muted-foreground truncate text-xs">{track.artistName}</span>
            </div>
          </button>
          {optionsMenu && <div className="-mt-1.5 -mr-1.5 shrink-0">{optionsMenu}</div>}
        </div>
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
  onClose,
}: PlayerBarProps) {
  const collapsedProgressBarRef = useRef<HTMLDivElement>(null)
  const expandedProgressBarRef = useRef<HTMLDivElement>(null)
  const volumeBarRef = useRef<HTMLDivElement>(null)
  const collapsedVolumeBarRef = useRef<HTMLDivElement>(null)
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
    e.stopPropagation()
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    onSeek(Math.max(0, Math.min(100, pct)))
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>, barRef: React.RefObject<HTMLDivElement | null>) => {
    e.stopPropagation()
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="bg-secondary/65 text-muted-foreground hover:text-foreground hover:bg-secondary flex size-9 items-center justify-center rounded-full transition-colors"
                      aria-label="Collapse player"
                      aria-expanded={isExpanded}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Collapse</TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top">{isShuffled ? "Shuffle on" : "Shuffle off"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onPrevious}
                      className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                      aria-label="Previous"
                    >
                      <HugeiconsIcon icon={PreviousIcon} className="size-6" fill="currentColor" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Previous</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top">{isPlaying ? "Pause" : "Play"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onNext}
                      className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                      aria-label="Next"
                    >
                      <HugeiconsIcon icon={NextIcon} className="size-6" fill="currentColor" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Next</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top">{`Repeat ${repeatMode}`}</TooltipContent>
                </Tooltip>
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top">{volume === 0 ? "Unmute" : "Mute"}</TooltipContent>
                </Tooltip>

                <div
                  ref={volumeBarRef}
                  onClick={(e) => handleVolumeClick(e, volumeBarRef)}
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
        <div
          className="player-glass animate-fade-up fixed right-0 bottom-0 left-0 z-50 cursor-pointer transition-colors hover:bg-white/[0.03]"
          id="player-bar"
          onClick={() => setIsExpanded(true)}
        >
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
          <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-2.5 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6">
            {/* Left: Track info */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/5">
                {artworkUrl ? (
                  <Image src={artworkUrl} alt={currentTrack.trackName} className="object-cover" fill sizes="48px" />
                ) : (
                  <div className="bg-muted size-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-foreground truncate text-sm font-medium">{currentTrack.trackName}</div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate">{currentTrack.artistName}</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap opacity-60">
                    <span className="bg-foreground/10 h-2.5 w-px" />
                    <span className="font-mono tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Playback controls */}
            <div className="hidden items-center justify-center gap-1 sm:flex sm:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onShuffle()
                    }}
                    className={cn(
                      "p-2 transition-all hover:scale-110",
                      isShuffled
                        ? "text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={isShuffled ? "Shuffle on" : "Shuffle off"}
                    aria-pressed={isShuffled}
                  >
                    <HugeiconsIcon icon={ShuffleIcon} className="size-4.5" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{isShuffled ? "Shuffle on" : "Shuffle off"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPrevious()
                    }}
                    className="text-muted-foreground hover:text-foreground p-2 transition-all hover:scale-110"
                    aria-label="Previous"
                  >
                    <HugeiconsIcon icon={PreviousIcon} className="size-6" fill="currentColor" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Previous</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePlay()
                    }}
                    className="bg-foreground text-background hover:shadow-gold/20 flex size-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    id="player-play-pause"
                  >
                    {isPlaying ? (
                      <HugeiconsIcon icon={PauseIcon} className="size-5" fill="currentColor" />
                    ) : (
                      <HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-5" fill="currentColor" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{isPlaying ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNext()
                    }}
                    className="text-muted-foreground hover:text-foreground p-2 transition-all hover:scale-110"
                    aria-label="Next"
                  >
                    <HugeiconsIcon icon={NextIcon} className="size-6" fill="currentColor" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Next</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRepeat()
                    }}
                    className={cn(
                      "p-2 transition-all hover:scale-110",
                      repeatMode !== "off"
                        ? "text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Repeat ${repeatMode}`}
                    aria-pressed={repeatMode !== "off"}
                  >
                    <HugeiconsIcon icon={RepeatIcon} className="size-4.5" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{`Repeat ${repeatMode}`}</TooltipContent>
              </Tooltip>
            </div>

            {/* Simplified controls for smaller screens (below sm) */}
            <div className="flex items-center justify-center gap-1 sm:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onShuffle()
                    }}
                    className={cn(
                      "p-1.5 transition-colors",
                      isShuffled ? "text-gold" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={isShuffled ? "Shuffle on" : "Shuffle off"}
                    aria-pressed={isShuffled}
                  >
                    <HugeiconsIcon icon={ShuffleIcon} className="size-4" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{isShuffled ? "Shuffle on" : "Shuffle off"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPrevious()
                    }}
                    className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                    aria-label="Previous"
                  >
                    <HugeiconsIcon icon={PreviousIcon} className="size-5" fill="currentColor" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Previous</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePlay()
                    }}
                    className="bg-foreground text-background flex size-9 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <HugeiconsIcon icon={PauseIcon} className="size-5" fill="currentColor" />
                    ) : (
                      <HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-5" fill="currentColor" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{isPlaying ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNext()
                    }}
                    className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                    aria-label="Next"
                  >
                    <HugeiconsIcon icon={NextIcon} className="size-5" fill="currentColor" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Next</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRepeat()
                    }}
                    className={cn(
                      "p-1.5 transition-colors",
                      repeatMode !== "off" ? "text-gold" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Repeat ${repeatMode}`}
                    aria-pressed={repeatMode !== "off"}
                  >
                    <HugeiconsIcon icon={RepeatIcon} className="size-4" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{`Repeat ${repeatMode}`}</TooltipContent>
              </Tooltip>
            </div>

            {/* Right: Volume + Expand */}
            <div className="hidden items-center justify-end gap-3 sm:flex">
              <div className="flex items-center gap-2 pr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onVolumeChange(volume > 0 ? 0 : 0.7)
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label="Volume"
                    >
                      {volume === 0 ? (
                        <HugeiconsIcon icon={VolumeMute01Icon} className="size-4" strokeWidth={2} />
                      ) : (
                        <HugeiconsIcon icon={VolumeHighIcon} className="size-4" strokeWidth={2} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{volume === 0 ? "Unmute" : "Mute"}</TooltipContent>
                </Tooltip>
                <div
                  ref={collapsedVolumeBarRef}
                  onClick={(e) => handleVolumeClick(e, collapsedVolumeBarRef)}
                  className="bg-border/50 group relative h-1.5 w-24 cursor-pointer rounded-full transition-all hover:h-2"
                >
                  <div
                    className="bg-foreground/80 h-full rounded-full transition-all"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div
                    className="bg-foreground absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-lg ring-2 ring-white/10 transition-opacity group-hover:opacity-100"
                    style={{ left: `${volume * 100}%` }}
                  />
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(true)
                    }}
                    className="bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary flex size-9 items-center justify-center rounded-full border border-white/5 shadow-sm transition-all"
                    aria-label="Expand player"
                    aria-expanded={isExpanded}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Expand player</TooltipContent>
              </Tooltip>
              {onClose && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label="Close player"
                    >
                      <X className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Close player</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Expand + Close buttons for small screens */}
            <div className="flex items-center gap-1 sm:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(true)
                    }}
                    className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
                    aria-label="Expand player"
                    aria-expanded={isExpanded}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Expand player</TooltipContent>
              </Tooltip>
              {onClose && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center transition-colors"
                      aria-label="Close player"
                    >
                      <X className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Close player</TooltipContent>
                </Tooltip>
              )}
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

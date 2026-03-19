"use client"

import { Clock, X } from "lucide-react"
import Image from "next/image"
import { getArtworkUrl } from "@/app/music/constants"
import { Track } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RecentlySearchedDropdownProps {
  tracks: Track[]
  onSelect: (track: Track) => void
  onRemove: (trackId: number) => void
  onClear: () => void
}

export function RecentlySearchedDropdown({ tracks, onSelect, onRemove, onClear }: RecentlySearchedDropdownProps) {
  if (tracks.length === 0) return null

  const gridTracks = tracks.slice(0, 4)
  const listTracks = tracks.slice(4, 10)

  return (
    <div
      className={cn(
        "absolute top-full right-0 left-0 z-50 mt-2",
        "border-border/60 rounded-2xl border shadow-2xl",
        "bg-secondary/95 backdrop-blur-xl",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="text-gold size-3.5" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Recent</span>
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Grid section — up to 4 tracks */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4">
        {gridTracks.map((track) => (
          <div key={track.trackId} className="group/card relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(track)}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-xl p-2 transition-all",
                "hover:bg-foreground/5 active:scale-[0.97]"
              )}
            >
              <div className="border-border/40 relative aspect-square w-full overflow-hidden rounded-lg border">
                <Image
                  src={getArtworkUrl(track.artworkUrl100, "small")}
                  alt={track.trackName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  sizes="(max-width: 640px) 40vw, 100px"
                />
              </div>
              <span className="text-foreground w-full truncate text-center text-xs font-medium">{track.trackName}</span>
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(track.trackId)}
              className={cn(
                "absolute top-1 right-1 rounded-full p-0.5 opacity-0 transition-all",
                "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background backdrop-blur-sm",
                "group-hover/card:opacity-100"
              )}
              aria-label={`Remove ${track.trackName}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* List section — next 6 tracks */}
      {listTracks.length > 0 && (
        <>
          <div className="bg-border/40 mx-3 h-px" />
          <div className="px-1.5 py-1.5">
            {listTracks.map((track) => (
              <div
                key={track.trackId}
                className={cn(
                  "group/row flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 transition-all",
                  "hover:bg-foreground/5"
                )}
              >
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(track)}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="border-border/40 relative size-8 shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={getArtworkUrl(track.artworkUrl100, "small")}
                      alt={track.trackName}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-foreground truncate text-sm font-medium">{track.trackName}</p>
                    <p className="text-muted-foreground truncate text-xs">{track.artistName}</p>
                  </div>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onRemove(track.trackId)}
                  className={cn(
                    "shrink-0 rounded-full p-1 opacity-0 transition-all",
                    "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
                    "group-hover/row:opacity-100"
                  )}
                  aria-label={`Remove ${track.trackName}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

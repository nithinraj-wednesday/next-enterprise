"use client"

import { Check, Loader2 } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Playlist, Track } from "@/lib/types"

interface PlaylistDropdownProps {
  track: Track
  playlists: Playlist[]
  playlistTracksMap: Record<string, Set<number>> // Map of PlaylistID -> Set of TrackIDs
  onAddToPlaylist: (playlistId: string, track: Track) => Promise<void>
  onRemoveFromPlaylist: (playlistId: string, trackId: number) => Promise<void>
  trigger: React.ReactNode
}

export function PlaylistDropdown({
  track,
  playlists,
  playlistTracksMap,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  trigger,
}: PlaylistDropdownProps) {
  const [loadingPlaylists, setLoadingPlaylists] = useState<Set<string>>(new Set())

  const handleTogglePlaylist = async (playlistId: string, isInPlaylist: boolean) => {
    setLoadingPlaylists((prev) => new Set(prev).add(playlistId))

    try {
      if (isInPlaylist) {
        await onRemoveFromPlaylist(playlistId, track.trackId)
      } else {
        await onAddToPlaylist(playlistId, track)
      }
    } finally {
      setLoadingPlaylists((prev) => {
        const next = new Set(prev)
        next.delete(playlistId)
        return next
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-secondary/95 border-border/60 text-foreground w-56 rounded-xl p-2 backdrop-blur-md"
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="font-display text-muted-foreground px-2 py-1.5 text-xs tracking-wider uppercase">
          Add to Playlist
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {playlists.length === 0 ? (
          <div className="text-muted-foreground px-2 py-3 text-center text-xs">No playlists yet</div>
        ) : (
          <DropdownMenuGroup className="max-h-[200px] overflow-y-auto pr-1">
            {playlists.map((playlist) => {
              const isInPlaylist = playlistTracksMap[playlist.id]?.has(track.trackId) || false
              const isLoading = loadingPlaylists.has(playlist.id)

              return (
                <DropdownMenuItem
                  key={playlist.id}
                  className="focus:bg-gold/10 focus:text-gold flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors"
                  onSelect={(e) => {
                    e.preventDefault() // Keep open while loading
                    if (!isLoading) {
                      handleTogglePlaylist(playlist.id, isInPlaylist)
                    }
                  }}
                >
                  <span className="truncate pr-4">{playlist.name}</span>
                  {isLoading ? (
                    <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                  ) : isInPlaylist ? (
                    <Check className="text-gold size-3.5" />
                  ) : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

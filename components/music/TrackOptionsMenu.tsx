"use client"

import { Check, ListMusic, ListPlus, Loader2, Share2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Playlist, Track } from "@/lib/types"

interface TrackOptionsMenuProps {
  track: Track
  playlists: Playlist[]
  playlistTracksMap: Record<string, Set<number>>
  onAddToPlaylist: (playlistId: string, track: Track) => Promise<void>
  onRemoveFromPlaylist: (playlistId: string, trackId: number) => Promise<void>
  onAddToQueue: (track: Track) => void
  trigger: React.ReactNode
}

export function TrackOptionsMenu({
  track,
  playlists,
  playlistTracksMap,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onAddToQueue,
  trigger,
}: TrackOptionsMenuProps) {
  const [loadingPlaylists, setLoadingPlaylists] = useState<Set<string>>(new Set())
  const router = useRouter()

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

  const handleGoToArtist = () => {
    router.push(`/music?search=${encodeURIComponent(track.artistName)}`)
  }

  const handleShare = async () => {
    if (!track.trackViewUrl) return
    try {
      await navigator.clipboard.writeText(track.trackViewUrl)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Failed to copy link")
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
        {/* Add to Playlist submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="focus:bg-gold/10 focus:text-gold data-open:bg-gold/10 data-open:text-gold rounded-lg px-2 py-2 transition-colors">
            <ListPlus className="mr-2 size-4" />
            Add to Playlist
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent
              className="bg-secondary/95 border-border/60 text-foreground w-52 rounded-xl p-2 backdrop-blur-md"
              sideOffset={8}
              alignOffset={-4}
              collisionPadding={16}
            >
              <DropdownMenuLabel className="font-display text-muted-foreground px-2 py-1.5 text-xs tracking-wider uppercase">
                Your Playlists
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
                          e.preventDefault()
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
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Add to Queue */}
        <DropdownMenuItem
          className="focus:bg-gold/10 focus:text-gold cursor-pointer rounded-lg px-2 py-2 transition-colors"
          onSelect={() => onAddToQueue(track)}
        >
          <ListMusic className="mr-2 size-4" />
          Add to Queue
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Go to Artist */}
        <DropdownMenuItem
          className="focus:bg-gold/10 focus:text-gold cursor-pointer rounded-lg px-2 py-2 transition-colors"
          onSelect={handleGoToArtist}
        >
          <User className="mr-2 size-4" />
          Go to Artist
        </DropdownMenuItem>

        {/* Share - only show if trackViewUrl exists */}
        {track.trackViewUrl && (
          <>
            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem
              className="focus:bg-gold/10 focus:text-gold cursor-pointer rounded-lg px-2 py-2 transition-colors"
              onSelect={handleShare}
            >
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

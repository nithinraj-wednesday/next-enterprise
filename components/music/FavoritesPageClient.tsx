"use client"

import { EllipsisVertical, Loader2, PencilLine, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import posthog from "posthog-js"
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { MusicAppHeader, PlayerBar, TrackRow } from "@/components/music/MusicComponents"
import { PlaylistDropdown } from "@/components/music/PlaylistDropdown"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMusic } from "@/hooks/use-music"
import { favoriteToTrack } from "@/lib/favorites"
import { FavoriteSong, Playlist, PlaylistResponse, PlaylistTracksResponse, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FavoritesPageClientProps {
  initialFavorites: FavoriteSong[]
  initialPlaylists?: Playlist[]
  initialPlaylistTracksMap?: Record<string, number[]>
  userName?: string
}

const LIKED_PLAYLIST_ID = "__liked_playlist__"
const LIKED_PLAYLIST_NAME = "My Liked Songs"
const EMPTY_TRACKS: Track[] = []

export function FavoritesPageClient({
  initialFavorites,
  initialPlaylists = [],
  initialPlaylistTracksMap = {},
  userName,
}: FavoritesPageClientProps) {
  const [favorites, setFavorites] = useState(initialFavorites)
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists)
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, Track[]>>({})

  const [playlistTracksMap, setPlaylistTracksMap] = useState<Record<string, Set<number>>>(() => {
    const map: Record<string, Set<number>> = {}
    Object.entries(initialPlaylistTracksMap).forEach(([playlistId, tracks]) => {
      map[playlistId] = new Set(tracks)
    })
    return map
  })

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(LIKED_PLAYLIST_ID)
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)

  const [pageError, setPageError] = useState<string | null>(null)
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createPlaylistName, setCreatePlaylistName] = useState("")
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)

  const [playlistToRename, setPlaylistToRename] = useState<Playlist | null>(null)
  const [renamePlaylistName, setRenamePlaylistName] = useState("")
  const [isRenamingPlaylist, setIsRenamingPlaylist] = useState(false)

  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null)
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false)

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

  const likedTracks = useMemo(
    () =>
      [...favorites]
        .sort((left, right) => {
          const leftTime = new Date(left.createdAt).getTime()
          const rightTime = new Date(right.createdAt).getTime()

          return rightTime - leftTime
        })
        .map(favoriteToTrack),
    [favorites]
  )

  const selectedPlaylistName =
    selectedPlaylistId === LIKED_PLAYLIST_ID
      ? LIKED_PLAYLIST_NAME
      : playlists.find((playlist) => playlist.id === selectedPlaylistId)?.name || "Playlist"

  const selectedPlaylistTrackCount =
    selectedPlaylistId === LIKED_PLAYLIST_ID
      ? likedTracks.length
      : playlistTracksMap[selectedPlaylistId]?.size ?? playlistTracks[selectedPlaylistId]?.length ?? 0

  const selectedPlaylistTracks =
    selectedPlaylistId === LIKED_PLAYLIST_ID ? undefined : playlistTracks[selectedPlaylistId]

  const activeTracks = selectedPlaylistId === LIKED_PLAYLIST_ID ? likedTracks : selectedPlaylistTracks ?? EMPTY_TRACKS

  const isActivePlaylistLoading = selectedPlaylistId !== LIKED_PLAYLIST_ID && loadingPlaylistId === selectedPlaylistId

  useEffect(() => {
    setTrackList(activeTracks)
  }, [activeTracks, setTrackList])

  useEffect(() => {
    if (selectedPlaylistId === LIKED_PLAYLIST_ID) {
      return
    }

    if (playlists.some((playlist) => playlist.id === selectedPlaylistId)) {
      return
    }

    setSelectedPlaylistId(LIKED_PLAYLIST_ID)
  }, [playlists, selectedPlaylistId])

  useEffect(() => {
    if (selectedPlaylistId === LIKED_PLAYLIST_ID) {
      return
    }

    if (selectedPlaylistTracks) {
      return
    }

    let isCancelled = false
    const playlistId = selectedPlaylistId

    const loadPlaylistTracks = async () => {
      setLoadingPlaylistId(playlistId)
      setPageError(null)

      try {
        const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to load tracks: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistTracksResponse

        if (!isCancelled) {
          setPlaylistTracks((current) => ({
            ...current,
            [playlistId]: data.tracks,
          }))
        }
      } catch (error) {
        console.error("Failed to load playlist tracks:", error)
        if (!isCancelled) {
          setPageError("Could not load that playlist right now.")
        }
      } finally {
        if (!isCancelled) {
          setLoadingPlaylistId((current) => (current === playlistId ? null : current))
        }
      }
    }

    void loadPlaylistTracks()

    return () => {
      isCancelled = true
    }
  }, [selectedPlaylistId, selectedPlaylistTracks])

  const handleToggleFavorite = useCallback(
    async (track: Track) => {
      const favorite = favorites.find((entry) => entry.trackId === track.trackId)

      if (!favorite || pendingFavoriteIds.includes(track.trackId)) {
        return
      }

      setPageError(null)
      setPendingFavoriteIds((current) => [...current, track.trackId])
      setFavorites((current) => current.filter((entry) => entry.trackId !== track.trackId))

      try {
        const response = await fetch(`/api/favorites/${track.trackId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Favorite delete failed: ${response.status}`)
        }

        posthog.capture("favorite_removed", {
          track_id: track.trackId,
          track_name: track.trackName,
          artist_name: track.artistName,
        })
      } catch (error) {
        posthog.captureException(error)
        console.error("Failed to remove favorite:", error)
        setPageError("Could not remove that track right now.")
        setFavorites((current) => [favorite, ...current.filter((entry) => entry.trackId !== favorite.trackId)])
      } finally {
        setPendingFavoriteIds((current) => current.filter((id) => id !== track.trackId))
      }
    },
    [favorites, pendingFavoriteIds]
  )

  const handleAddToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    try {
      setPageError(null)
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(track),
      })

      if (!response.ok) {
        throw new Error(`Failed to add track to playlist: ${response.status}`)
      }

      posthog.capture("track_added_to_playlist", {
        playlist_id: playlistId,
        track_id: track.trackId,
        track_name: track.trackName,
        artist_name: track.artistName,
      })

      setPlaylistTracksMap((current) => {
        const next = { ...current }
        if (!next[playlistId]) {
          next[playlistId] = new Set()
        }
        next[playlistId].add(track.trackId)
        return next
      })

      setPlaylistTracks((current) => {
        const existingTracks = current[playlistId]
        if (!existingTracks || existingTracks.some((existingTrack) => existingTrack.trackId === track.trackId)) {
          return current
        }

        return {
          ...current,
          [playlistId]: [track, ...existingTracks],
        }
      })
    } catch (error) {
      posthog.captureException(error)
      console.error("Failed to add track to playlist:", error)
      setPageError("Failed to add track to that playlist.")
    }
  }, [])

  const handleRemoveFromPlaylist = useCallback(async (playlistId: string, trackId: number) => {
    try {
      setPageError(null)
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove track from playlist: ${response.status}`)
      }

      posthog.capture("track_removed_from_playlist", { playlist_id: playlistId, track_id: trackId })

      setPlaylistTracksMap((current) => {
        const next = { ...current }
        if (next[playlistId]) {
          next[playlistId].delete(trackId)
        }
        return next
      })

      setPlaylistTracks((current) => {
        const existingTracks = current[playlistId]
        if (!existingTracks) {
          return current
        }

        return {
          ...current,
          [playlistId]: existingTracks.filter((track) => track.trackId !== trackId),
        }
      })
    } catch (error) {
      posthog.captureException(error)
      console.error("Failed to remove track from playlist:", error)
      setPageError("Failed to remove track from that playlist.")
    }
  }, [])

  const handleCreatePlaylist = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedName = createPlaylistName.trim()

      if (!trimmedName) {
        setPageError("Playlist name is required.")
        return
      }

      setIsCreatingPlaylist(true)
      setPageError(null)

      try {
        const response = await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create playlist: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistResponse

        if (!data.playlist) {
          throw new Error("Playlist was not returned by the API")
        }

        posthog.capture("playlist_created", { playlist_id: data.playlist.id, playlist_name: data.playlist.name })
        setPlaylists((current) => [data.playlist, ...current])
        setCreatePlaylistName("")
        setIsCreateDialogOpen(false)
      } catch (error) {
        posthog.captureException(error)
        console.error("Failed to create playlist:", error)
        setPageError("Failed to create playlist.")
      } finally {
        setIsCreatingPlaylist(false)
      }
    },
    [createPlaylistName]
  )

  const handleRenamePlaylist = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!playlistToRename) {
        return
      }

      const trimmedName = renamePlaylistName.trim()

      if (!trimmedName) {
        setPageError("Playlist name is required.")
        return
      }

      setIsRenamingPlaylist(true)
      setPageError(null)

      try {
        const response = await fetch(`/api/playlists/${playlistToRename.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        })

        if (!response.ok) {
          throw new Error(`Failed to rename playlist: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistResponse

        if (!data.playlist) {
          throw new Error("Updated playlist was not returned by the API")
        }

        posthog.capture("playlist_renamed", { playlist_id: data.playlist.id, new_name: data.playlist.name })
        setPlaylists((current) =>
          current.map((playlist) => (playlist.id === data.playlist.id ? data.playlist : playlist))
        )
        setPlaylistToRename(null)
        setRenamePlaylistName("")
      } catch (error) {
        posthog.captureException(error)
        console.error("Failed to rename playlist:", error)
        setPageError("Failed to rename playlist.")
      } finally {
        setIsRenamingPlaylist(false)
      }
    },
    [playlistToRename, renamePlaylistName]
  )

  const handleDeletePlaylist = useCallback(async () => {
    if (!playlistToDelete) {
      return
    }

    setIsDeletingPlaylist(true)
    setPageError(null)

    try {
      const response = await fetch(`/api/playlists/${playlistToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete playlist: ${response.status}`)
      }

      const deletedPlaylistId = playlistToDelete.id

      posthog.capture("playlist_deleted", { playlist_id: deletedPlaylistId, playlist_name: playlistToDelete.name })

      setPlaylists((current) => current.filter((playlist) => playlist.id !== deletedPlaylistId))
      setPlaylistTracksMap((current) => {
        const next = { ...current }
        delete next[deletedPlaylistId]
        return next
      })
      setPlaylistTracks((current) => {
        const next = { ...current }
        delete next[deletedPlaylistId]
        return next
      })

      if (selectedPlaylistId === deletedPlaylistId) {
        setSelectedPlaylistId(LIKED_PLAYLIST_ID)
      }

      setPlaylistToDelete(null)
    } catch (error) {
      posthog.captureException(error)
      console.error("Failed to delete playlist:", error)
      setPageError("Failed to delete playlist.")
    } finally {
      setIsDeletingPlaylist(false)
    }
  }, [playlistToDelete, selectedPlaylistId])

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <header className="relative pt-8 pb-4 sm:pt-12 sm:pb-6">
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6">
          <MusicAppHeader activeRoute="favorites" favoriteCount={favorites.length} userName={userName} />
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10", currentTrack && "pb-28")}>
        {pageError ? (
          <div className="animate-fade-up mb-6 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-100">
            {pageError}
          </div>
        ) : null}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-foreground text-2xl font-semibold">Your Playlists</h2>
            <p className="text-muted-foreground text-sm">My Liked Songs comes first, then your custom playlists.</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/15"
            >
              <Plus data-icon="inline-start" />
              Create Playlist
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create playlist</DialogTitle>
                <DialogDescription>Give your new playlist a name.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-playlist-name">Playlist name</Label>
                  <Input
                    id="create-playlist-name"
                    autoFocus
                    value={createPlaylistName}
                    onChange={(event) => setCreatePlaylistName(event.target.value)}
                    placeholder="Night Drive, Focus Mix..."
                    maxLength={64}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingPlaylist}>
                    {isCreatingPlaylist ? (
                      <>
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="-mx-1 mb-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-2 pb-2">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPlaylistId(LIKED_PLAYLIST_ID)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setSelectedPlaylistId(LIKED_PLAYLIST_ID)
              }
            }}
            className={cn(
              "w-[min(85vw,20rem)] shrink-0 cursor-pointer snap-start transition-all hover:-translate-y-0.5",
              selectedPlaylistId === LIKED_PLAYLIST_ID
                ? "ring-gold/40 bg-gold/8 ring-2"
                : "ring-border/40 hover:ring-border"
            )}
          >
            <CardHeader>
              <CardTitle className="font-display">{LIKED_PLAYLIST_NAME}</CardTitle>
              <CardDescription>Pinned playlist</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-sm">{favorites.length} tracks</p>
            </CardContent>
          </Card>

          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlaylistId(playlist.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedPlaylistId(playlist.id)
                }
              }}
              className={cn(
                "w-[min(85vw,20rem)] shrink-0 cursor-pointer snap-start transition-all hover:-translate-y-0.5",
                selectedPlaylistId === playlist.id
                  ? "ring-gold/40 bg-gold/8 ring-2"
                  : "ring-border/40 hover:ring-border"
              )}
            >
              <CardHeader className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="font-display truncate">{playlist.name}</CardTitle>
                  <CardDescription>{playlistTracksMap[playlist.id]?.size ?? 0} tracks</CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Manage ${playlist.name}`}
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => {
                          setPlaylistToRename(playlist)
                          setRenamePlaylistName(playlist.name)
                        }}
                      >
                        <PencilLine data-icon="inline-start" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setPlaylistToDelete(playlist)
                        }}
                      >
                        <Trash2 data-icon="inline-start" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-border/30 overflow-hidden rounded-[2rem] border">
          <CardHeader className="border-border/50 border-b">
            <CardTitle className="font-display text-foreground text-2xl font-semibold">
              {selectedPlaylistName}
            </CardTitle>
            <CardDescription>{selectedPlaylistTrackCount} tracks</CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            {isActivePlaylistLoading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-10 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading playlist tracks...
              </div>
            ) : activeTracks.length === 0 ? (
              <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {selectedPlaylistId === LIKED_PLAYLIST_ID
                    ? "No liked songs yet. Add songs from Discover to fill this playlist."
                    : "No songs in this playlist yet."}
                </p>
                {selectedPlaylistId === LIKED_PLAYLIST_ID ? (
                  <Button asChild variant="outline">
                    <Link href="/music">Browse songs</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="text-muted-foreground border-border/50 mb-2 flex items-center gap-4 border-b px-3 py-3 text-xs tracking-[0.18em] uppercase">
                  <span className="w-8 text-center">#</span>
                  <span className="size-10 shrink-0" />
                  <span className="flex-1">Track</span>
                  <span className="hidden md:inline-flex">Genre</span>
                  <span className="ml-4 shrink-0">Duration</span>
                </div>

                <div className="flex flex-col gap-1 px-3 pb-3">
                  {activeTracks.map((track, index) => (
                    <TrackRow
                      key={`${selectedPlaylistId}-${track.trackId}`}
                      track={track}
                      isActive={currentTrack?.trackId === track.trackId}
                      isPlaying={isPlaying}
                      onPlay={playTrack}
                      onToggleFavorite={selectedPlaylistId === LIKED_PLAYLIST_ID ? handleToggleFavorite : undefined}
                      isFavorite={selectedPlaylistId === LIKED_PLAYLIST_ID}
                      isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                      index={index}
                      formatTime={formatTime}
                      optionsMenu={
                        <div className="flex items-center gap-1">
                          <PlaylistDropdown
                            track={track}
                            playlists={playlists}
                            playlistTracksMap={playlistTracksMap}
                            onAddToPlaylist={handleAddToPlaylist}
                            onRemoveFromPlaylist={handleRemoveFromPlaylist}
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label="Manage playlist membership">
                                <Plus />
                              </Button>
                            }
                          />

                          {selectedPlaylistId !== LIKED_PLAYLIST_ID ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void handleRemoveFromPlaylist(selectedPlaylistId, track.trackId)}
                              className="text-destructive hover:text-destructive"
                              aria-label="Remove from this playlist"
                            >
                              <Trash2 />
                            </Button>
                          ) : null}
                        </div>
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={playlistToRename !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlaylistToRename(null)
            setRenamePlaylistName("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename playlist</DialogTitle>
            <DialogDescription>Update the playlist name shown in your library.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenamePlaylist} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rename-playlist-name">Playlist name</Label>
              <Input
                id="rename-playlist-name"
                value={renamePlaylistName}
                onChange={(event) => setRenamePlaylistName(event.target.value)}
                maxLength={64}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPlaylistToRename(null)
                  setRenamePlaylistName("")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenamingPlaylist}>
                {isRenamingPlaylist ? (
                  <>
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={playlistToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingPlaylist) {
            setPlaylistToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="text-foreground font-medium">{playlistToDelete?.name ?? "this playlist"}</span> and
              remove all track links inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPlaylist}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingPlaylist}
              onClick={() => void handleDeletePlaylist()}
            >
              {isDeletingPlaylist ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

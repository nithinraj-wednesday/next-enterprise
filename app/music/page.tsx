"use client"

// @ts-expect-error Will fix it
import { GridViewIcon, ListViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDown, ChevronUp, EllipsisVertical, Heart, Loader2, Music, Plus } from "lucide-react"
import posthog from "posthog-js"
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  EmptyState,
  MusicAppHeader,
  PlayerBar,
  SearchBar,
  TrackCard,
  TrackGridSkeleton,
  TrackRow,
} from "@/components/music/MusicComponents"
import { PlaylistDropdown } from "@/components/music/PlaylistDropdown"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMusic } from "@/hooks/use-music"
import { useSession } from "@/lib/auth-client"
import { createOptimisticFavorite, trackToFavoritePayload } from "@/lib/favorites"
import {
  FavoriteSong,
  Playlist,
  PlaylistResponse,
  PlaylistsResponse,
  PlaylistTracksResponse,
  SearchResponse,
  Track,
} from "@/lib/types"
import { cn } from "@/lib/utils"

import { FEATURED_SEARCHES, SEARCH_DEFAULTS, ViewMode } from "./constants"

export default function MusicPage() {
  const { data: sessionData } = useSession()
  const {
    tracks,
    loading,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffled,
    repeatMode,
    searchMusic,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    toggleShuffle,
    playPrevious,
    playNext,
    toggleRepeat,
    formatTime,
  } = useMusic()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchTerm, setSearchTerm] = useState("trending")
  const [hasSearched, setHasSearched] = useState(false)

  const [favorites, setFavorites] = useState<FavoriteSong[]>([])
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([])

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(true)
  const [playlistTracksMap, setPlaylistTracksMap] = useState<Record<string, Set<number>>>({})

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createPlaylistName, setCreatePlaylistName] = useState("")
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [playlistStatus, setPlaylistStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

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
  const [resultsExpanded, setResultsExpanded] = useState(false)

  const resultsSectionRef = useRef<HTMLDivElement>(null)
  const favoriteIds = new Set(favorites.map((favorite) => favorite.trackId))

  useEffect(() => {
    searchMusic("trending")
    setHasSearched(true)
  }, [searchMusic])

  useEffect(() => {
    let cancelled = false

    const loadFavorites = async () => {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" })

        if (!response.ok) {
          throw new Error(`Favorites request failed: ${response.status}`)
        }

        const data = (await response.json()) as { favorites: FavoriteSong[] }

        if (!cancelled) {
          setFavorites(data.favorites)
        }
      } catch (error) {
        console.error("Failed to load favorites:", error)
      }
    }

    void loadFavorites()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPlaylists = async () => {
      setPlaylistsLoading(true)
      try {
        const response = await fetch("/api/playlists", { cache: "no-store" })

        if (!response.ok) {
          throw new Error(`Playlists request failed: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistsResponse

        if (cancelled) {
          return
        }

        setPlaylists(data.playlists)

        if (data.playlists.length === 0) {
          setPlaylistTracksMap({})
          return
        }

        const playlistTrackResults = await Promise.allSettled(
          data.playlists.map(async (playlist) => {
            const tracksResponse = await fetch(`/api/playlists/${playlist.id}/tracks`, { cache: "no-store" })

            if (!tracksResponse.ok) {
              throw new Error(`Playlist tracks request failed (${playlist.id}): ${tracksResponse.status}`)
            }

            const tracksData = (await tracksResponse.json()) as PlaylistTracksResponse
            return {
              playlistId: playlist.id,
              trackIds: new Set(tracksData.tracks.map((track) => track.trackId)),
            }
          })
        )

        if (cancelled) {
          return
        }

        const nextMap: Record<string, Set<number>> = {}
        let hadFailure = false

        for (const result of playlistTrackResults) {
          if (result.status === "fulfilled") {
            nextMap[result.value.playlistId] = result.value.trackIds
          } else {
            hadFailure = true
            console.error("Failed to load playlist tracks map:", result.reason)
          }
        }

        setPlaylistTracksMap(nextMap)

        if (hadFailure) {
          setPlaylistStatus({ type: "error", message: "Some playlist memberships could not be loaded." })
        }
      } catch (error) {
        console.error("Failed to load playlists:", error)
        if (!cancelled) {
          setPlaylistStatus({ type: "error", message: "Could not load playlists." })
        }
      } finally {
        if (!cancelled) {
          setPlaylistsLoading(false)
        }
      }
    }

    void loadPlaylists()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadCategoryTracks = async () => {
      setCategoryLoadError(null)
      setCategoryLoadingMap(
        FEATURED_SEARCHES.reduce<Record<string, boolean>>((accumulator, category) => {
          accumulator[category.query] = true
          return accumulator
        }, {})
      )

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
          const filteredTracks = data.results.filter((track) => track.previewUrl)

          return [category.query, filteredTracks] as const
        })
      )

      if (cancelled) {
        return
      }

      const nextTracks: Record<string, Track[]> = {}
      const nextLoadingMap: Record<string, boolean> = {}
      let hasFailure = false

      results.forEach((result, index) => {
        const query = FEATURED_SEARCHES[index]?.query

        if (!query) {
          return
        }

        nextLoadingMap[query] = false

        if (result.status === "fulfilled") {
          const [resolvedQuery, tracksForCategory] = result.value
          nextTracks[resolvedQuery] = tracksForCategory
        } else {
          hasFailure = true
          nextTracks[query] = []
          console.error(`Failed loading category "${FEATURED_SEARCHES[index]?.label}":`, result.reason)
        }
      })

      setCategoryTracks(nextTracks)
      setCategoryLoadingMap(nextLoadingMap)

      if (hasFailure) {
        setCategoryLoadError("Some categories could not be loaded right now.")
      }
    }

    void loadCategoryTracks()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = useCallback(
    (query: string, options?: { shouldScroll?: boolean }) => {
      setResultsExpanded(false)
      const searchTermToUse = query.trim() || "trending"
      setSearchTerm(searchTermToUse)
      setHasSearched(true)
      searchMusic(searchTermToUse)
      posthog.capture("music_searched", { query })
      const shouldScroll = options?.shouldScroll ?? true
      if (shouldScroll) {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
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

  const handlePlayTrack = useCallback(
    (track: Track) => {
      if (currentTrack?.trackId === track.trackId) {
        togglePlayPause()
      } else {
        playTrack(track)
      }

      posthog.capture("track_played", {
        track_id: track.trackId,
        track_name: track.trackName,
        artist_name: track.artistName,
        genre: track.primaryGenreName,
      })
    },
    [playTrack, currentTrack, togglePlayPause]
  )

  const handleToggleFavorite = useCallback(
    async (track: Track) => {
      const existingFavorite = favorites.find((favorite) => favorite.trackId === track.trackId)

      if (pendingFavoriteIds.includes(track.trackId)) {
        return
      }

      setFavoriteError(null)
      setPendingFavoriteIds((current) => [...current, track.trackId])

      if (existingFavorite) {
        setFavorites((current) => current.filter((favorite) => favorite.trackId !== track.trackId))
      } else {
        setFavorites((current) => [
          createOptimisticFavorite(track),
          ...current.filter((favorite) => favorite.trackId !== track.trackId),
        ])
      }

      try {
        const response = await fetch(
          existingFavorite ? `/api/favorites/${track.trackId}` : "/api/favorites",
          existingFavorite
            ? { method: "DELETE" }
            : {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(trackToFavoritePayload(track)),
              }
        )

        if (!response.ok) {
          throw new Error(`Favorite mutation failed: ${response.status}`)
        }

        if (existingFavorite) {
          posthog.capture("track_unfavorited", {
            track_id: track.trackId,
            track_name: track.trackName,
            artist_name: track.artistName,
          })
        } else {
          posthog.capture("track_favorited", {
            track_id: track.trackId,
            track_name: track.trackName,
            artist_name: track.artistName,
            genre: track.primaryGenreName,
          })
          const savedFavorite = (await response.json()) as FavoriteSong
          setFavorites((current) => [
            savedFavorite,
            ...current.filter((favorite) => favorite.trackId !== savedFavorite.trackId),
          ])
          toast.success(`Added to favorites`, {
            description: track.trackName,
            icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
            duration: 2500,
          })
        }
      } catch (error) {
        console.error("Failed to update favorite:", error)
        toast.error("Could not update your favorites. Please try again.", {
          duration: 4000,
        })

        if (existingFavorite) {
          setFavorites((current) => [
            existingFavorite,
            ...current.filter((favorite) => favorite.trackId !== existingFavorite.trackId),
          ])
        } else {
          setFavorites((current) => current.filter((favorite) => favorite.trackId !== track.trackId))
        }
      } finally {
        setPendingFavoriteIds((current) => current.filter((id) => id !== track.trackId))
      }
    },
    [favorites, pendingFavoriteIds]
  )

  const handleAddToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    setPlaylistStatus(null)
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(track),
      })

      if (!response.ok) {
        throw new Error(`Failed to add track to playlist: ${response.status}`)
      }

      setPlaylistTracksMap((current) => {
        const next = { ...current }
        if (!next[playlistId]) {
          next[playlistId] = new Set()
        }
        next[playlistId].add(track.trackId)
        return next
      })

      posthog.capture("track_added_to_playlist_from_home", {
        playlist_id: playlistId,
        track_id: track.trackId,
        track_name: track.trackName,
      })

      toast.success(`Added to playlist`, {
        description: track.trackName,
        icon: <Music className="h-4 w-4 text-green-500" />,
        duration: 2500,
      })
    } catch (error) {
      console.error("Failed to add track from home:", error)
      toast.error("Could not add that track to playlist.", {
        duration: 4000,
      })
    }
  }, [])

  const handleRemoveFromPlaylist = useCallback(async (playlistId: string, trackId: number) => {
    setPlaylistStatus(null)
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove track from playlist: ${response.status}`)
      }

      setPlaylistTracksMap((current) => {
        const next = { ...current }
        if (next[playlistId]) {
          next[playlistId].delete(trackId)
        }
        return next
      })

      posthog.capture("track_removed_from_playlist_from_home", {
        playlist_id: playlistId,
        track_id: trackId,
      })
    } catch (error) {
      console.error("Failed to remove track from playlist:", error)
      setPlaylistStatus({ type: "error", message: "Could not update playlist membership for this track." })
    }
  }, [])

  const handleCreatePlaylist = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedName = createPlaylistName.trim()

      if (!trimmedName) {
        setPlaylistStatus({ type: "error", message: "Playlist name is required." })
        return
      }

      setIsCreatingPlaylist(true)
      setPlaylistStatus(null)

      try {
        const response = await fetch("/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        })

        if (!response.ok) {
          throw new Error(`Playlist creation failed: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistResponse

        if (!data.playlist) {
          throw new Error("Playlist was not returned by the API")
        }

        posthog.capture("playlist_created_from_home", {
          playlist_id: data.playlist.id,
          playlist_name: data.playlist.name,
        })

        setPlaylists((current) => [data.playlist, ...current])
        setPlaylistTracksMap((current) => ({
          [data.playlist.id]: new Set(),
          ...current,
        }))
        setCreatePlaylistName("")
        setIsCreateDialogOpen(false)
        setPlaylistStatus({ type: "success", message: `Playlist "${data.playlist.name}" created.` })
      } catch (error) {
        console.error("Failed to create playlist from home:", error)
        setPlaylistStatus({ type: "error", message: "Could not create playlist. Please try again." })
      } finally {
        setIsCreatingPlaylist(false)
      }
    },
    [createPlaylistName]
  )

  const renderPlaylistMenu = useCallback(
    (track: Track) => (
      <PlaylistDropdown
        track={track}
        playlists={playlists}
        playlistTracksMap={playlistTracksMap}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
            disabled={playlistsLoading}
            aria-label="Track playlist actions"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        }
      />
    ),
    [handleAddToPlaylist, handleRemoveFromPlaylist, playlistTracksMap, playlists, playlistsLoading]
  )

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <header className="hero-gradient relative pt-8 pb-6 sm:pt-12 sm:pb-8">
        <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
          <MusicAppHeader
            activeRoute="music"
            playlistCount={playlists.length + 1}
            userName={sessionData?.user?.name}
            searchBar={<SearchBar onSearch={handleSearch} loading={loading} className="!px-4 !py-2" />}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-screen-xl px-4 py-2 sm:px-6 sm:py-4">
        {favoriteError ? (
          <div className="animate-fade-up mb-6 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-100">
            {favoriteError}
          </div>
        ) : null}

        {playlistStatus ? (
          <div
            className={cn(
              "animate-fade-up mb-6 rounded-2xl px-4 py-3 text-sm",
              playlistStatus.type === "success"
                ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                : "border border-red-400/20 bg-red-500/8 text-red-100"
            )}
          >
            {playlistStatus.message}
          </div>
        ) : null}

        {categoryLoadError ? (
          <div className="animate-fade-up mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/8 px-4 py-3 text-sm text-yellow-100">
            {categoryLoadError}
          </div>
        ) : null}

        <div className="animate-fade-up mb-6 flex items-center justify-between gap-3">
          <div className="text-muted-foreground text-xs tracking-[0.15em] uppercase">
            {playlistsLoading ? "Loading playlists..." : `${playlists.length + 1} playlists available`}
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="border-gold/30 bg-gold/10 text-gold"
            >
              <Plus data-icon="inline-start" />
              Create Playlist
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create playlist</DialogTitle>
                <DialogDescription>Create a new playlist without leaving Home.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="home-create-playlist-name">Playlist name</Label>
                  <Input
                    id="home-create-playlist-name"
                    autoFocus
                    value={createPlaylistName}
                    onChange={(event) => setCreatePlaylistName(event.target.value)}
                    placeholder="Focus Mix, Night Drive..."
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

        <section ref={resultsSectionRef} className="mb-12">
          {hasSearched && !loading && tracks.length > 0 && (
            <div className="animate-fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-foreground text-lg font-semibold">
                  {searchTerm.toLowerCase() === "trending" ? "Trending" : `Results for "${searchTerm}"`}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {tracks.length} tracks found · 30s previews · tap the heart or use the 3-dot menu to add to playlists
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-secondary/60 border-border/50 flex items-center gap-1 rounded-lg border p-1">
                  <button
                    onClick={() => {
                      setViewMode("grid")
                      posthog.capture("view_mode_changed", { view_mode: "grid" })
                    }}
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
                    onClick={() => {
                      setViewMode("list")
                      posthog.capture("view_mode_changed", { view_mode: "list" })
                    }}
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

          {!loading && tracks.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                  {(resultsExpanded ? tracks : tracks.slice(0, 6)).map((track, index) => (
                    <TrackCard
                      key={track.trackId}
                      track={track}
                      isActive={currentTrack?.trackId === track.trackId}
                      isPlaying={isPlaying}
                      onPlay={handlePlayTrack}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favoriteIds.has(track.trackId)}
                      isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                      optionsMenu={renderPlaylistMenu(track)}
                      index={index}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              ) : (
                <div className="mb-12 flex flex-col gap-1">
                  <div className="text-muted-foreground border-border/50 mb-1 flex items-center gap-4 border-b px-3 py-2 text-xs tracking-wider uppercase">
                    <span className="w-8 text-center">#</span>
                    <span className="size-10 shrink-0" />
                    <span className="flex-1">Title</span>
                    <span className="hidden md:inline-flex">Genre</span>
                    <span className="ml-4 shrink-0">Duration</span>
                  </div>

                  {(resultsExpanded ? tracks : tracks.slice(0, 6)).map((track, index) => (
                    <TrackRow
                      key={track.trackId}
                      track={track}
                      isActive={currentTrack?.trackId === track.trackId}
                      isPlaying={isPlaying}
                      onPlay={handlePlayTrack}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favoriteIds.has(track.trackId)}
                      isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                      index={index}
                      formatTime={formatTime}
                      optionsMenu={renderPlaylistMenu(track)}
                    />
                  ))}
                </div>
              )}

              {tracks.length > 6 && (
                <div className="-mt-8 mb-12 flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResultsExpanded(!resultsExpanded)}
                    className="text-muted-foreground border-border/60 hover:border-gold/40 hover:text-gold bg-secondary/30 inline-flex items-center justify-center rounded-full border p-2 transition-colors"
                    aria-label={resultsExpanded ? "Collapse results" : "Expand results"}
                    aria-expanded={resultsExpanded}
                  >
                    {resultsExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>
              )}
            </>
          )}

          {!hasSearched && !loading && <EmptyState />}
        </section>

        <section className="mb-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-foreground text-xl font-semibold">Browse Categories</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Both modes show 6 songs per category first. Use the arrow to expand that category.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {FEATURED_SEARCHES.map((category) => {
              const tracksForCategory = categoryTracks[category.query] ?? []
              const isCategoryLoading = categoryLoadingMap[category.query] ?? false
              const isCategoryExpanded = categoryExpandedMap[category.query] ?? false
              const visibleCategoryTracks = isCategoryExpanded ? tracksForCategory : tracksForCategory.slice(0, 6)
              const hasMoreCategoryTracks = tracksForCategory.length > 6

              return (
                <section key={category.query} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-foreground text-sm font-semibold tracking-[0.15em] uppercase">
                      <span className="mr-2">{category.emoji}</span>
                      {category.label}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleSearch(category.query)}
                      className="text-muted-foreground hover:text-gold text-xs font-medium transition-colors"
                    >
                      Open category
                    </button>
                  </div>

                  {isCategoryLoading ? (
                    viewMode === "grid" ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="skeleton-shimmer h-56 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="skeleton-shimmer h-14 rounded-xl" />
                        ))}
                      </div>
                    )
                  ) : tracksForCategory.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
                      No tracks available in this category right now.
                    </div>
                  ) : (
                    <>
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                          {visibleCategoryTracks.map((track, index) => (
                            <div key={`${category.query}-${track.trackId}`} className="w-full">
                              <TrackCard
                                track={track}
                                isActive={currentTrack?.trackId === track.trackId}
                                isPlaying={isPlaying}
                                onPlay={handlePlayTrack}
                                onToggleFavorite={handleToggleFavorite}
                                isFavorite={favoriteIds.has(track.trackId)}
                                isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                                optionsMenu={renderPlaylistMenu(track)}
                                index={index}
                                formatTime={formatTime}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-muted-foreground border-border/50 mb-1 flex items-center gap-4 border-b px-3 py-2 text-xs tracking-wider uppercase">
                            <span className="w-8 text-center">#</span>
                            <span className="size-10 shrink-0" />
                            <span className="flex-1">Title</span>
                            <span className="hidden md:inline-flex">Genre</span>
                            <span className="ml-4 shrink-0">Duration</span>
                          </div>

                          {visibleCategoryTracks.map((track, index) => (
                            <TrackRow
                              key={`${category.query}-${track.trackId}`}
                              track={track}
                              isActive={currentTrack?.trackId === track.trackId}
                              isPlaying={isPlaying}
                              onPlay={handlePlayTrack}
                              onToggleFavorite={handleToggleFavorite}
                              isFavorite={favoriteIds.has(track.trackId)}
                              isFavoritePending={pendingFavoriteIds.includes(track.trackId)}
                              index={index}
                              formatTime={formatTime}
                              optionsMenu={renderPlaylistMenu(track)}
                            />
                          ))}
                        </div>
                      )}

                      {hasMoreCategoryTracks ? (
                        <div className="flex justify-center pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryExpandedMap((current) => ({
                                ...current,
                                [category.query]: !isCategoryExpanded,
                              }))
                            }
                            className="text-muted-foreground border-border/60 hover:border-gold/40 hover:text-gold bg-secondary/30 inline-flex items-center justify-center rounded-full border p-2 transition-colors"
                            aria-label={`${isCategoryExpanded ? "Collapse" : "Expand"} ${category.label} songs`}
                            aria-expanded={isCategoryExpanded}
                          >
                            {isCategoryExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              )
            })}
          </div>
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
  )
}

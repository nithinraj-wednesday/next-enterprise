"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { EllipsisVertical, Loader2, Plus } from "lucide-react"
import { useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import { type FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { EmptyState, MusicAppHeader, SearchBar, TrackGridSkeleton } from "@/components/music/MusicComponents"
import { MusicSidebarLayout } from "@/components/music/MusicSidebar"
import { TrackListLayout } from "@/components/music/TrackListLayout"
import { TrackOptionsMenu } from "@/components/music/TrackOptionsMenu"
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
import { useMusicPlayer } from "@/contexts/MusicPlayerContext"
import { useMusicManagement } from "@/hooks/use-music-management"
import { useRecentlySearched } from "@/hooks/use-recently-searched"
import { useSession } from "@/lib/auth-client"
import { PlaylistResponse, SearchResponse, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

import { FEATURED_SEARCHES, SEARCH_DEFAULTS, ViewMode } from "./constants"

function MusicPageContent() {
  const { data: sessionData } = useSession()
  const { tracks, loading, currentTrack, isPlaying, searchMusic, playTrack, togglePlayPause, addToQueue, formatTime } =
    useMusicPlayer()

  const {
    favoriteIds,
    pendingFavoriteIds,
    playlists,
    playlistTracksMap,
    handleToggleFavorite,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    refreshPlaylists,
  } = useMusicManagement()

  const { recentlySearched, addRecentlySearched, removeRecentlySearched, clearRecentlySearched } = useRecentlySearched()

  const searchParams = useSearchParams()
  const querySearch = searchParams.get("search")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchTerm, setSearchTerm] = useState(querySearch || "trending")
  const [hasSearched, setHasSearched] = useState(false)

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

  useEffect(() => {
    const term = querySearch || "trending"
    setSearchTerm(term)
    searchMusic(term)
    setHasSearched(true)
  }, [querySearch, searchMusic])

  useEffect(() => {
    let cancelled = false

    const loadCategoryTracks = async () => {
      setCategoryLoadError(null)
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
          return {
            query: category.query,
            tracks: data.results.filter((track) => track.previewUrl),
          }
        })
      )

      if (cancelled) return

      const nextCategoryTracks: Record<string, Track[]> = {}
      const nextCategoryLoading: Record<string, boolean> = {}
      let hadFailure = false

      for (const result of results) {
        if (result.status === "fulfilled") {
          nextCategoryTracks[result.value.query] = result.value.tracks
          nextCategoryLoading[result.value.query] = false
        } else {
          hadFailure = true
          console.error("Failed to load category tracks:", result.reason)
        }
      }

      setCategoryTracks(nextCategoryTracks)
      setCategoryLoadingMap(nextCategoryLoading)

      if (hadFailure) {
        setCategoryLoadError("Some categories could not be loaded.")
      }
    }

    void loadCategoryTracks()

    return () => {
      cancelled = true
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        })

        if (!response.ok) {
          throw new Error(`Playlist create failed: ${response.status}`)
        }

        const data = (await response.json()) as PlaylistResponse

        if (!data.playlist) {
          throw new Error("Playlist was not returned by the API")
        }

        posthog.capture("playlist_created", { playlist_id: data.playlist.id, playlist_name: data.playlist.name })
        refreshPlaylists()
        setCreatePlaylistName("")
        setIsCreateDialogOpen(false)
        toast.success(`Created playlist "${data.playlist.name}"`)
      } catch (error) {
        posthog.captureException(error)
        console.error("Failed to create playlist:", error)
        setPlaylistStatus({ type: "error", message: "Failed to create playlist." })
      } finally {
        setIsCreatingPlaylist(false)
      }
    },
    [createPlaylistName, refreshPlaylists]
  )

  const handleSearch = useCallback(
    (query?: string) => {
      // Clear search when query is explicitly empty (e.g. clear button)
      if (query !== undefined && !query.trim()) {
        setSearchTerm("trending")
        setHasSearched(false)
        searchMusic("trending")
        const params = new URLSearchParams(searchParams.toString())
        params.delete("search")
        window.history.pushState(null, "", params.toString() ? `?${params.toString()}` : window.location.pathname)
        return
      }

      const term = query || searchTerm
      if (!term.trim()) return

      const params = new URLSearchParams(searchParams.toString())
      params.set("search", term)
      window.history.pushState(null, "", `?${params.toString()}`)

      setSearchTerm(term)
      searchMusic(term)
      setHasSearched(true)
      setResultsExpanded(false)

      posthog.capture("music_search", { term })
    },
    [searchTerm, searchMusic, searchParams]
  )

  const handlePlayTrack = useCallback(
    (track: Track) => {
      if (currentTrack?.trackId === track.trackId) {
        togglePlayPause()
      } else {
        playTrack(track)
      }
      if (hasSearched && tracks.length > 0) {
        addRecentlySearched(track)
      }
    },
    [currentTrack, playTrack, togglePlayPause, hasSearched, tracks, addRecentlySearched]
  )

  const handleSelectRecentTrack = useCallback(
    (track: Track) => {
      if (currentTrack?.trackId === track.trackId) {
        togglePlayPause()
      } else {
        playTrack(track)
      }
    },
    [currentTrack, playTrack, togglePlayPause]
  )

  const renderPlaylistMenu = useCallback(
    (track: Track) => (
      <TrackOptionsMenu
        track={track}
        playlists={playlists}
        playlistTracksMap={playlistTracksMap}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onAddToQueue={addToQueue}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        }
      />
    ),
    [playlists, handleAddToPlaylist, handleRemoveFromPlaylist, playlistTracksMap, addToQueue]
  )

  return (
    <MusicSidebarLayout>
      <div className="bg-background relative min-h-screen overflow-hidden">
        <div className="noise-overlay" />

        <header className="hero-gradient relative pt-8 pb-6 sm:pt-12 sm:pb-8">
          <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
            <MusicAppHeader
              playlistCount={playlists.length + 1}
              userName={sessionData?.user?.name || undefined}
              searchBar={
                <SearchBar
                  onSearch={handleSearch}
                  loading={loading}
                  className="!px-4 !py-2"
                  recentlySearched={recentlySearched}
                  onSelectRecentTrack={handleSelectRecentTrack}
                  onRemoveRecentTrack={removeRecentlySearched}
                  onClearRecentSearches={clearRecentlySearched}
                />
              }
            />
          </div>
        </header>

        <main
          className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-2 sm:px-6 sm:py-4", currentTrack && "pb-32")}
        >
          {playlistStatus ? (
            <div
              className={cn(
                "animate-fade-up mb-6 rounded-2xl border px-4 py-3 text-sm",
                playlistStatus.type === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border-red-400/20 bg-red-500/8 text-red-100"
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

          <div className="mb-12 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-foreground text-2xl font-semibold">Discovery</h2>
              <p className="text-muted-foreground text-sm">
                Explore popular tracks, search the iTunes catalog, and manage your library.
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="border-border/60">
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
            {hasSearched && (
              <TrackListLayout
                title={searchTerm === "trending" ? "Trending Now" : `Results for "${searchTerm}"`}
                tracks={tracks}
                loading={loading}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlay={handlePlayTrack}
                onToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
                pendingFavoriteIds={pendingFavoriteIds}
                formatTime={formatTime}
                renderPlaylistMenu={renderPlaylistMenu}
                viewMode={viewMode}
                onViewModeChange={(mode) => {
                  setViewMode(mode)
                  posthog.capture("view_mode_changed", { view_mode: mode })
                }}
                isExpanded={resultsExpanded}
                onToggleExpand={() => setResultsExpanded(!resultsExpanded)}
                hasMore={tracks.length > 6}
                hideViewToggle={tracks.length === 0 && !loading}
              />
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
              {FEATURED_SEARCHES.map((category) => (
                <TrackListLayout
                  key={category.query}
                  title={
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon icon={category.icon} strokeWidth={2} className="text-gold size-6" />
                      {category.label}
                    </span>
                  }
                  tracks={categoryTracks[category.query] ?? []}
                  loading={categoryLoadingMap[category.query] ?? false}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlay={handlePlayTrack}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteIds={favoriteIds}
                  pendingFavoriteIds={pendingFavoriteIds}
                  formatTime={formatTime}
                  renderPlaylistMenu={renderPlaylistMenu}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  isExpanded={categoryExpandedMap[category.query] ?? false}
                  onToggleExpand={() =>
                    setCategoryExpandedMap((current) => ({
                      ...current,
                      [category.query]: !current[category.query],
                    }))
                  }
                  hasMore={(categoryTracks[category.query] ?? []).length > 6}
                  hideViewToggle
                  className="space-y-4"
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </MusicSidebarLayout>
  )
}

export default function MusicPage() {
  return (
    <Suspense fallback={<TrackGridSkeleton />}>
      <MusicPageContent />
    </Suspense>
  )
}

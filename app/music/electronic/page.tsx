"use client"

import { EllipsisVertical } from "lucide-react"
import { useFeatureFlagVariantKey } from "posthog-js/react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { MusicAppHeader, PlayerBar, TrackGridSkeleton } from "@/components/music/MusicComponents"
import { MusicSidebarLayout } from "@/components/music/MusicSidebar"
import { TrackListLayout } from "@/components/music/TrackListLayout"
import { TrackOptionsMenu } from "@/components/music/TrackOptionsMenu"
import { Button } from "@/components/ui/button"
import { useMusic } from "@/hooks/use-music"
import { useMusicManagement } from "@/hooks/use-music-management"
import { useSession } from "@/lib/auth-client"
import { SearchResponse, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

function ElectronicContent() {
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
    addToQueue,
    formatTime,
  } = useMusic()

  const {
    favoriteIds,
    pendingFavoriteIds,
    playlists,
    playlistTracksMap,
    handleToggleFavorite,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
  } = useMusicManagement()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [popularViewMode, setPopularViewMode] = useState<"grid" | "list">("grid")

  const newMusicVariant = useFeatureFlagVariantKey("new-music-feature")
  const showExtraSections = newMusicVariant === "test"

  const [popularTracks, setPopularTracks] = useState<Track[]>([])
  const [popularLoading, setPopularLoading] = useState(false)
  const [newMusicTracks, setNewMusicTracks] = useState<Track[]>([])
  const [newMusicLoading, setNewMusicLoading] = useState(false)
  const [newMusicViewMode, setNewMusicViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    // Search for electronic music by default
    searchMusic("electronic")
  }, [searchMusic])

  useEffect(() => {
    if (!showExtraSections) return
    async function fetchPopular() {
      setPopularLoading(true)
      try {
        const res = await fetch(`/api/music/search?term=${encodeURIComponent("popular")}&entity=song&limit=25`)
        const data = (await res.json()) as SearchResponse
        setPopularTracks(data.results.filter((t) => t.previewUrl))
      } catch (err) {
        console.error("Popular search failed:", err)
        setPopularTracks([])
      } finally {
        setPopularLoading(false)
      }
    }
    fetchPopular()
  }, [showExtraSections])

  useEffect(() => {
    if (!showExtraSections) return
    async function fetchNewMusic() {
      setNewMusicLoading(true)
      try {
        const res = await fetch(`/api/music/search?term=${encodeURIComponent("new music")}&entity=song&limit=25`)
        const data = (await res.json()) as SearchResponse
        setNewMusicTracks(data.results.filter((t) => t.previewUrl))
      } catch (err) {
        console.error("New music search failed:", err)
        setNewMusicTracks([])
      } finally {
        setNewMusicLoading(false)
      }
    }
    fetchNewMusic()
  }, [newMusicVariant])

  const handlePlayTrack = useCallback(
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

        <header className="relative pt-8 pb-4 sm:pt-12 sm:pb-6">
          <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
            <MusicAppHeader playlistCount={playlists.length + 1} userName={sessionData?.user?.name || undefined} />
          </div>
        </header>

        <main
          className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10", currentTrack && "pb-32")}
        >
          <TrackListLayout
            title="Electronic"
            subtitle="The best of electronic music from the iTunes catalog."
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
            onViewModeChange={setViewMode}
          />

          {showExtraSections && (
            <TrackListLayout
              title="Most Searched"
              subtitle="Popular tracks people are searching for right now."
              tracks={popularTracks}
              loading={popularLoading}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
              pendingFavoriteIds={pendingFavoriteIds}
              formatTime={formatTime}
              renderPlaylistMenu={renderPlaylistMenu}
              viewMode={popularViewMode}
              onViewModeChange={setPopularViewMode}
              className="mt-12"
            />
          )}

          {showExtraSections && (
            <TrackListLayout
              title="New Music"
              subtitle="Fresh tracks and latest hits to discover."
              tracks={newMusicTracks}
              loading={newMusicLoading}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
              pendingFavoriteIds={pendingFavoriteIds}
              formatTime={formatTime}
              renderPlaylistMenu={renderPlaylistMenu}
              viewMode={newMusicViewMode}
              onViewModeChange={setNewMusicViewMode}
              className="mt-12"
            />
          )}
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
    </MusicSidebarLayout>
  )
}

export default function ElectronicPage() {
  return (
    <Suspense fallback={<TrackGridSkeleton />}>
      <ElectronicContent />
    </Suspense>
  )
}

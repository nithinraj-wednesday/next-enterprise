"use client"

import { EllipsisVertical } from "lucide-react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { MusicAppHeader, PlayerBar, TrackGridSkeleton } from "@/components/music/MusicComponents"
import { MusicSidebarLayout } from "@/components/music/MusicSidebar"
import { TrackListLayout } from "@/components/music/TrackListLayout"
import { TrackOptionsMenu } from "@/components/music/TrackOptionsMenu"
import { Button } from "@/components/ui/button"
import { useMusic } from "@/hooks/use-music"
import { useMusicManagement } from "@/hooks/use-music-management"
import { useSession } from "@/lib/auth-client"
import { Track } from "@/lib/types"
import { cn } from "@/lib/utils"

function RecentlyPlayedContent() {
  const { data: sessionData } = useSession()
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

  const [tracks, setTracks] = useState<Track[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const loadRecentlyPlayed = useCallback(() => {
    try {
      const stored = localStorage.getItem("recently-played")
      if (stored) {
        setTracks(JSON.parse(stored) as Track[])
      }
    } catch (e) {
      console.error("Failed to load recently played:", e)
    }
  }, [])

  useEffect(() => {
    loadRecentlyPlayed()
    window.addEventListener("recently-played-updated", loadRecentlyPlayed)
    return () => window.removeEventListener("recently-played-updated", loadRecentlyPlayed)
  }, [loadRecentlyPlayed])

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
      <div className="bg-background relative min-h-screen">
        <div className="noise-overlay" />

        <header className="relative pt-8 pb-4 sm:pt-12 sm:pb-6">
          <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
            <MusicAppHeader playlistCount={playlists.length + 1} userName={sessionData?.user?.name || undefined} />
          </div>
        </header>

        <main
          className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10", currentTrack && "pb-28")}
        >
          <TrackListLayout
            title="Recently Played"
            subtitle="Your latest listening history."
            tracks={tracks}
            loading={false}
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

export default function RecentlyPlayedPage() {
  return (
    <Suspense fallback={<TrackGridSkeleton />}>
      <RecentlyPlayedContent />
    </Suspense>
  )
}

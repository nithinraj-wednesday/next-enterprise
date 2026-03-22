"use client"

import { Globe2, Link2 } from "lucide-react"
import Link from "next/link"
import posthog from "posthog-js"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlayerBar, TrackRow } from "@/components/music/MusicComponents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMusic } from "@/hooks/use-music"
import { useSession } from "@/lib/auth-client"
import { SharedPlaylistView, Track } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SharedPlaylistPageClientProps {
  data: SharedPlaylistView
}

export function SharedPlaylistPageClient({ data }: SharedPlaylistPageClientProps) {
  const { playlist, tracks } = data
  const { data: sessionData } = useSession()
  const [isSavedByViewer, setIsSavedByViewer] = useState(playlist.isSavedByViewer)
  const [isSaving, setIsSaving] = useState(false)
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

  useEffect(() => {
    setTrackList(tracks)
  }, [setTrackList, tracks])

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

  const handleSaveToLibrary = useCallback(async () => {
    if (isSavedByViewer || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const token = playlist.shareUrl?.split("/").pop()

      if (!token) {
        throw new Error("Share token was not available")
      }

      const response = await fetch(`/api/shared-playlists/${token}/save`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to save shared playlist: ${response.status}`)
      }

      setIsSavedByViewer(true)
      toast.success("Playlist saved to your library.")
      posthog.capture("shared_playlist_saved_from_public_page", {
        playlist_id: playlist.id,
        playlist_name: playlist.name,
        shared_by: playlist.ownerName,
      })
    } catch (error) {
      posthog.captureException(error)
      console.error("Failed to save shared playlist:", error)
      toast.error("Could not save this playlist right now.")
    } finally {
      setIsSaving(false)
    }
  }, [isSavedByViewer, isSaving, playlist.id, playlist.name, playlist.ownerName, playlist.shareUrl])

  const isSignedIn = Boolean(sessionData?.user)
  const isOwner = sessionData?.user?.id === playlist.ownerId

  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />
      <div className="hero-gradient pointer-events-none fixed inset-0" />

      <main className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12", currentTrack && "pb-32")}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 text-gold flex size-11 items-center justify-center rounded-2xl border border-white/10">
              <Globe2 className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Shared Playlist</p>
              <h1 className="font-display text-foreground text-3xl font-semibold">{playlist.name}</h1>
              <p className="text-muted-foreground text-sm">
                {playlist.ownerName ? `By ${playlist.ownerName}` : "Public link"} · {tracks.length} tracks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              isOwner ? (
                <Button asChild variant="outline">
                  <Link href="/favorites">Open library</Link>
                </Button>
              ) : isSavedByViewer ? (
                <Button asChild variant="outline">
                  <Link href="/favorites">Saved in Library</Link>
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => void handleSaveToLibrary()} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save to Library"}
                </Button>
              )
            ) : (
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            <Button asChild className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/15">
              <Link href="/music">
                <Link2 data-icon="inline-start" />
                Explore Music
              </Link>
            </Button>
          </div>
        </div>

        <Card className="glass-card border-border/30 overflow-hidden rounded-[2rem] border">
          <CardHeader className="border-border/50 border-b">
            <CardTitle className="font-display text-foreground text-2xl font-semibold">{playlist.name}</CardTitle>
            <CardDescription>
              {isOwner
                ? "This playlist has a public share link. Other users can save it to their own library."
                : "This playlist is shared publicly. You can preview it here and save it to your own library."}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <p className="text-muted-foreground text-sm">This shared playlist does not have any tracks yet.</p>
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
                  {tracks.map((track, index) => (
                    <TrackRow
                      key={`${playlist.id}-${track.trackId}`}
                      track={track}
                      isActive={currentTrack?.trackId === track.trackId}
                      isPlaying={isPlaying}
                      onPlay={handlePlayTrack}
                      index={index}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
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

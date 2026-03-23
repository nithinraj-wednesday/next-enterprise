"use client"

import { PlayerBar } from "@/components/music/MusicComponents"
import { useMusicPlayer } from "@/contexts/MusicPlayerContext"

export function GlobalPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    toggleShuffle,
    playPrevious,
    playNext,
    toggleRepeat,
    formatTime,
    closePlayer,
  } = useMusicPlayer()

  return (
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
      onClose={closePlayer}
    />
  )
}

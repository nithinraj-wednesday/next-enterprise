"use client"

import posthogClient from "posthog-js"
import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import { SEARCH_DEFAULTS, PLAYBACK_INTERVAL_MS } from "@/app/music/constants"
import {
  buildPlaybackSummaryEvent,
  buildTrackPlayedEvent,
  createPlaybackSession,
  getPreviewDurationSeconds,
  recordPlaybackPause,
  recordPlaybackSeek,
  type PlaybackEndReason,
  type PlaybackSession,
  updatePlaybackSession,
} from "@/lib/playback-analytics"
import { Track, SearchResponse } from "@/lib/types"

export function useMusic() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const endedHandlerRef = useRef<(() => void) | null>(null)
  const originalTracksRef = useRef<Track[]>([])
  const queueRef = useRef<Track[]>([])
  const playbackSessionRef = useRef<PlaybackSession | null>(null)

  const clearProgressInterval = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [])

  const syncPlaybackProgress = useCallback((audio: HTMLAudioElement) => {
    const session = playbackSessionRef.current

    if (session) {
      updatePlaybackSession(session, audio.currentTime)
    }

    if (audio.currentTime && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100)
    }
  }, [])

  const startProgressInterval = useCallback(
    (audio: HTMLAudioElement) => {
      clearProgressInterval()
      progressInterval.current = setInterval(() => {
        syncPlaybackProgress(audio)
      }, PLAYBACK_INTERVAL_MS)
    },
    [clearProgressInterval, syncPlaybackProgress]
  )

  const flushPlaybackSession = useCallback((reason: PlaybackEndReason, audio?: HTMLAudioElement | null) => {
    const session = playbackSessionRef.current

    if (!session) return

    if (audio) {
      updatePlaybackSession(session, audio.currentTime)
    }

    const event = buildPlaybackSummaryEvent(
      session,
      reason,
      getPreviewDurationSeconds(session.track, audio?.duration ?? undefined)
    )

    if (event) {
      posthogClient.capture(event.event, event.properties)
    }

    playbackSessionRef.current = null
  }, [])

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      if (endedHandlerRef.current) {
        audioRef.current.removeEventListener("ended", endedHandlerRef.current)
      }
      audioRef.current.pause()
      audioRef.current = null
    }

    endedHandlerRef.current = null
    clearProgressInterval()
  }, [clearProgressInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      flushPlaybackSession("unmounted", audioRef.current)
      cleanupAudio()
    }
  }, [cleanupAudio, flushPlaybackSession])

  const searchMusic = useCallback(
    async (query: string, entity = SEARCH_DEFAULTS.entity, limit = SEARCH_DEFAULTS.limit) => {
      if (!query.trim()) return
      setLoading(true)
      try {
        const res = await fetch(`/api/music/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=${limit}`)
        const data = (await res.json()) as SearchResponse
        const filteredTracks = data.results.filter((t) => t.previewUrl)
        setTracks(filteredTracks)
        originalTracksRef.current = filteredTracks
      } catch (err) {
        console.error("Search failed:", err)
        setTracks([])
        originalTracksRef.current = []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const playTrack = useCallback(
    (track: Track) => {
      if (!track.previewUrl) return

      // Save to Recently Played
      try {
        const stored = localStorage.getItem("recently-played")
        const recentlyPlayed: Track[] = stored ? (JSON.parse(stored) as Track[]) : []
        const updated = [track, ...recentlyPlayed.filter((t: Track) => t.trackId !== track.trackId)].slice(0, 50)
        localStorage.setItem("recently-played", JSON.stringify(updated))
        window.dispatchEvent(new Event("recently-played-updated"))
      } catch (e) {
        console.warn("Failed to update recently played:", e)
      }

      if (audioRef.current) {
        flushPlaybackSession("switched_track", audioRef.current)
        cleanupAudio()
      }

      const audio = new Audio(track.previewUrl)
      audio.volume = volume
      audioRef.current = audio
      setDuration(0)

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })

      const endedHandler = () => {
        clearProgressInterval()
        flushPlaybackSession("ended", audio)

        if (repeatMode === "one") {
          audio.currentTime = 0
          const nextSession = createPlaybackSession(track)
          const event = buildTrackPlayedEvent(track, nextSession.sessionId)
          playbackSessionRef.current = nextSession
          audio
            .play()
            .then(() => {
              posthogClient.capture(event.event, event.properties)
              startProgressInterval(audio)
              setCurrentTrack(track)
              setProgress(0)
              setIsPlaying(true)
            })
            .catch((err) => {
              console.error("Playback failed:", err)
              playbackSessionRef.current = null
              setIsPlaying(false)
            })
          return
        }

        cleanupAudio()

        if (queueRef.current.length > 0) {
          const nextFromQueue = queueRef.current.shift()!
          playTrack(nextFromQueue)
          return
        }
        if (repeatMode === "all") {
          const currentTracks = originalTracksRef.current
          const currentIndex = currentTracks.findIndex((t) => t.trackId === track.trackId)
          const nextIndex = currentIndex < currentTracks.length - 1 ? currentIndex + 1 : 0
          if (currentTracks[nextIndex]) {
            playTrack(currentTracks[nextIndex])
            return
          }
        }
        setIsPlaying(false)
        setProgress(0)
        setDuration(0)
      }
      audio.addEventListener("ended", endedHandler)
      endedHandlerRef.current = endedHandler

      audio
        .play()
        .then(() => {
          const session = createPlaybackSession(track)
          playbackSessionRef.current = session
          const event = buildTrackPlayedEvent(track, session.sessionId)
          posthogClient.capture(event.event, event.properties)
          setCurrentTrack(track)
          setIsPlaying(true)
          setProgress(0)
          startProgressInterval(audio)
        })
        .catch((err) => {
          console.error("Playback failed:", err)
          cleanupAudio()
          playbackSessionRef.current = null
          setCurrentTrack(null)
          setIsPlaying(false)
          setProgress(0)
          setDuration(0)
        })
    },
    [cleanupAudio, clearProgressInterval, flushPlaybackSession, repeatMode, startProgressInterval, volume]
  )

  // Listen for play-track events from sidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const track = (e as CustomEvent<Track>).detail
      if (track?.previewUrl) playTrack(track)
    }
    window.addEventListener("play-track", handler)
    return () => window.removeEventListener("play-track", handler)
  }, [playTrack])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      syncPlaybackProgress(audio)
      if (playbackSessionRef.current) {
        recordPlaybackPause(playbackSessionRef.current)
      }
      audio.pause()
      clearProgressInterval()
      setIsPlaying(false)
    } else {
      let nextSession: PlaybackSession | null = null
      let nextEvent: ReturnType<typeof buildTrackPlayedEvent> | null = null

      if (playbackSessionRef.current) {
        playbackSessionRef.current.lastKnownTime = audio.currentTime
      } else if (currentTrack) {
        nextSession = createPlaybackSession(currentTrack)
        nextEvent = buildTrackPlayedEvent(currentTrack, nextSession.sessionId)
        playbackSessionRef.current = nextSession
      }

      audio
        .play()
        .then(() => {
          if (nextEvent) {
            posthogClient.capture(nextEvent.event, nextEvent.properties)
          }
          startProgressInterval(audio)
          setIsPlaying(true)
        })
        .catch((err) => {
          console.error("Playback failed:", err)
          if (nextSession) {
            playbackSessionRef.current = null
          }
          setIsPlaying(false)
        })
    }
  }, [clearProgressInterval, currentTrack, isPlaying, startProgressInterval, syncPlaybackProgress])

  const seekTo = useCallback(
    (percentage: number) => {
      if (!audioRef.current || !duration) return
      const time = (percentage / 100) * duration
      audioRef.current.currentTime = time
      if (playbackSessionRef.current) {
        recordPlaybackSeek(playbackSessionRef.current, time)
      }
      setProgress(percentage)
    },
    [duration]
  )

  const setVolumeLevel = useCallback((level: number) => {
    setVolume(level)
    if (audioRef.current) {
      audioRef.current.volume = level
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      if (!prev) {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5)
        setTracks(shuffled)
      } else {
        setTracks(originalTracksRef.current)
      }
      return !prev
    })
  }, [tracks])

  const playPrevious = useCallback(() => {
    if (tracks.length === 0) return
    const currentIndex = tracks.findIndex((t) => t.trackId === currentTrack?.trackId)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
    const prevTrack = tracks[prevIndex]
    if (prevTrack) playTrack(prevTrack)
  }, [tracks, currentTrack, playTrack])

  const playNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const nextFromQueue = queueRef.current.shift()!
      playTrack(nextFromQueue)
      return
    }
    if (tracks.length === 0) return
    const currentIndex = tracks.findIndex((t) => t.trackId === currentTrack?.trackId)
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
    const nextTrack = tracks[nextIndex]
    if (nextTrack) playTrack(nextTrack)
  }, [tracks, currentTrack, playTrack])

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all"
      if (prev === "all") return "one"
      return "off"
    })
  }, [])

  const setTrackList = useCallback((nextTracks: Track[]) => {
    setTracks(nextTracks)
    originalTracksRef.current = nextTracks
  }, [])

  const addToQueue = useCallback((track: Track) => {
    queueRef.current.push(track)
    toast.success(`Added "${track.trackName}" to queue`)
  }, [])

  const stopPlayback = useCallback(() => {
    flushPlaybackSession("stopped", audioRef.current)
    cleanupAudio()
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setDuration(0)
  }, [cleanupAudio, flushPlaybackSession])

  return {
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
    setTrackList,
    addToQueue,
    formatTime,
    stopPlayback,
  }
}

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Track, SearchResponse } from "@/lib/types"
import { SEARCH_DEFAULTS, PLAYBACK_INTERVAL_MS } from "@/app/music/constants"

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        if (endedHandlerRef.current) {
          audioRef.current.removeEventListener("ended", endedHandlerRef.current)
        }
        audioRef.current.pause()
        audioRef.current = null
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [])

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
        audioRef.current.pause()
        if (endedHandlerRef.current) {
          audioRef.current.removeEventListener("ended", endedHandlerRef.current)
        }
      }

      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      const audio = new Audio(track.previewUrl)
      audio.volume = volume
      audioRef.current = audio

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })

      const endedHandler = () => {
        if (repeatMode === "one") {
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(console.error)
          }
          return
        }

        if (queueRef.current.length > 0) {
          const nextFromQueue = queueRef.current.shift()!
          playTrack(nextFromQueue)
          return
        }
        if (repeatMode === "all") {
          const currentIndex = tracks.findIndex((t) => t.trackId === track.trackId)
          const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
          if (tracks[nextIndex]) {
            playTrack(tracks[nextIndex])
            return
          }
        }
        setIsPlaying(false)
        setProgress(0)
        if (progressInterval.current) clearInterval(progressInterval.current)
      }
      audio.addEventListener("ended", endedHandler)
      endedHandlerRef.current = endedHandler

      audio
        .play()
        .then(() => {
          setCurrentTrack(track)
          setIsPlaying(true)
          setProgress(0)
        })
        .catch((err) => {
          console.error("Playback failed:", err)
          setCurrentTrack(null)
          setIsPlaying(false)
          setProgress(0)
        })

      progressInterval.current = setInterval(() => {
        if (audio.currentTime && audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      }, PLAYBACK_INTERVAL_MS)
    },
    [volume]
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
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      if (progressInterval.current) clearInterval(progressInterval.current)
    } else {
      audioRef.current.play()
      progressInterval.current = setInterval(() => {
        if (audioRef.current && audioRef.current.currentTime && audioRef.current.duration) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
      }, PLAYBACK_INTERVAL_MS)
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const seekTo = useCallback(
    (percentage: number) => {
      if (!audioRef.current || !duration) return
      const time = (percentage / 100) * duration
      audioRef.current.currentTime = time
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
    if (audioRef.current) {
      if (endedHandlerRef.current) {
        audioRef.current.removeEventListener("ended", endedHandlerRef.current)
      }
      audioRef.current.pause()
      audioRef.current = null
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setDuration(0)
  }, [])

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

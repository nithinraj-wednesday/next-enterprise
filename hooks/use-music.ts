"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const endedHandlerRef = useRef<(() => void) | null>(null)

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
        setTracks(data.results.filter((t) => t.previewUrl))
      } catch (err) {
        console.error("Search failed:", err)
        setTracks([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const playTrack = useCallback(
    (track: Track) => {
      if (!track.previewUrl) return

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

  return {
    tracks,
    loading,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    searchMusic,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    formatTime,
  }
}

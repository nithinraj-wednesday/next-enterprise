"use client"

import { useCallback, useEffect, useState } from "react"
import { Track } from "@/lib/types"

const STORAGE_KEY = "recently-searched"
const EVENT_NAME = "recently-searched-updated"
const MAX_ITEMS = 10

export function useRecentlySearched() {
  const [recentlySearched, setRecentlySearched] = useState<Track[]>([])

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const tracks: Track[] = stored ? (JSON.parse(stored) as Track[]) : []
      setRecentlySearched(tracks)
    } catch (e) {
      console.warn("Failed to load recently searched:", e)
    }
  }, [])

  useEffect(() => {
    loadFromStorage()
    const handleUpdate = () => loadFromStorage()
    window.addEventListener(EVENT_NAME, handleUpdate)
    return () => window.removeEventListener(EVENT_NAME, handleUpdate)
  }, [loadFromStorage])

  const addRecentlySearched = useCallback((track: Track) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const current: Track[] = stored ? (JSON.parse(stored) as Track[]) : []
      const updated = [track, ...current.filter((t: Track) => t.trackId !== track.trackId)].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch (e) {
      console.warn("Failed to update recently searched:", e)
    }
  }, [])

  const removeRecentlySearched = useCallback((trackId: number) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const current: Track[] = stored ? (JSON.parse(stored) as Track[]) : []
      const updated = current.filter((t: Track) => t.trackId !== trackId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch (e) {
      console.warn("Failed to remove recently searched:", e)
    }
  }, [])

  const clearRecentlySearched = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new Event(EVENT_NAME))
    } catch (e) {
      console.warn("Failed to clear recently searched:", e)
    }
  }, [])

  return { recentlySearched, addRecentlySearched, removeRecentlySearched, clearRecentlySearched }
}

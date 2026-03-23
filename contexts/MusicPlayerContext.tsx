"use client"

import { type ReactNode, createContext, useCallback, useContext } from "react"
import { useMusic } from "@/hooks/use-music"

type MusicPlayerContextValue = ReturnType<typeof useMusic> & {
  closePlayer: () => void
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const music = useMusic()

  const closePlayer = useCallback(() => {
    music.stopPlayback()
  }, [music.stopPlayback])

  return <MusicPlayerContext.Provider value={{ ...music, closePlayer }}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider")
  }
  return ctx
}

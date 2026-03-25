export type ViewMode = "grid" | "list"

// Search API defaults
export const SEARCH_DEFAULTS = {
  entity: "song",
  limit: "24",
  country: "US",
} as const

export const PLAYBACK_INTERVAL_MS = 100

export const ARTWORK_SIZES = {
  small: "100x100",
  medium: "400x400",
  large: "600x600",
} as const

import {
  AudioWave01Icon,
  CrownIcon,
  FavouriteCircleIcon,
  HeadphonesIcon,
  Mic01Icon,
  MusicNote01Icon,
  MusicNote02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export const FEATURED_SEARCHES: {
  label: string
  query: string
  icon: IconSvgElement
}[] = [
  { label: "Classical", query: "classical piano", icon: MusicNote01Icon },
  { label: "Chill Vibes", query: "chill lofi", icon: HeadphonesIcon },
  { label: "Hip Hop", query: "hip hop 2025", icon: Mic01Icon },
  { label: "Indie", query: "indie rock", icon: MusicNote02Icon },
  { label: "Electronic", query: "electronic dance", icon: AudioWave01Icon },
  { label: "R&B Soul", query: "rnb soul", icon: FavouriteCircleIcon },
  { label: "Pop", query: "pop hits", icon: SparklesIcon },
  { label: "Top Hits", query: "top hits 2025", icon: CrownIcon },
]

export function getArtworkUrl(url: string | undefined, size: keyof typeof ARTWORK_SIZES = "medium"): string {
  if (!url) return ""
  const sizeStr = ARTWORK_SIZES[size]
  return url.replace("100x100", sizeStr)
}

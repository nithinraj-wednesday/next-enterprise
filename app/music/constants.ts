export type ViewMode = "grid" | "list"

// Search API defaults
export const SEARCH_DEFAULTS = {
  entity: "song",
  limit: "25",
  country: "US",
} as const

export const PLAYBACK_INTERVAL_MS = 100

export const ARTWORK_SIZES = {
  small: "100x100",
  medium: "400x400",
  large: "600x600",
} as const

export const FEATURED_SEARCHES = [
  { label: "Classical", query: "classical piano", emoji: "🎹" },
  { label: "Chill Vibes", query: "chill lofi", emoji: "🌊" },
  { label: "Hip Hop", query: "hip hop 2025", emoji: "🎤" },
  { label: "Indie", query: "indie rock", emoji: "🎸" },
  { label: "Electronic", query: "electronic dance", emoji: "⚡" },
  { label: "R&B Soul", query: "rnb soul", emoji: "💜" },
  { label: "Pop", query: "pop hits", emoji: "✨" },
  { label: "Top Hits", query: "top hits 2025", emoji: "🔥" },
]

export function getArtworkUrl(url: string | undefined, size: keyof typeof ARTWORK_SIZES = "medium"): string {
  if (!url) return ""
  const sizeStr = ARTWORK_SIZES[size]
  return url.replace("100x100", sizeStr)
}

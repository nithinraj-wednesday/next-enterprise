export const CACHE_TTL = {
  playlists: 60, // 1 minute
  favorites: 60, // 1 minute
  search: 300, // 5 minutes
  sharedPlaylist: 600, // 10 minutes
} as const

export function getCacheKey(namespace: string, ...parts: (string | number | undefined | null)[]): string {
  const normalizedParts = parts.map((part) => {
    if (part === null || part === undefined) return ""
    return String(part).trim().toLowerCase()
  })

  return [namespace, ...normalizedParts].filter(Boolean).join(":")
}

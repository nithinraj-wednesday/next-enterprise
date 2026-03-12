export interface Track {
  trackId: number
  artistName: string
  collectionName: string
  trackName: string
  previewUrl: string
  artworkUrl60: string
  artworkUrl100: string
  trackTimeMillis: number
  primaryGenreName: string
  trackViewUrl?: string
  releaseDate?: string
}

export interface SearchResponse {
  resultCount: number
  results: Track[]
}

export interface FavoritePayload {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  previewUrl: string
  artworkUrl60: string
  artworkUrl100: string
  trackTimeMillis: number
  primaryGenreName: string
  trackViewUrl?: string
}

export interface FavoriteSong extends FavoritePayload {
  createdAt: string
}

export interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
}

export interface TrackCardProps {
  track: Track
  isActive: boolean
  isPlaying: boolean
  onPlay: (track: Track) => void
  onToggleFavorite?: (track: Track) => void
  isFavorite?: boolean
  isFavoritePending?: boolean
  index: number
}

export interface TrackRowProps {
  track: Track
  isActive: boolean
  isPlaying: boolean
  onPlay: (track: Track) => void
  onToggleFavorite?: (track: Track) => void
  isFavorite?: boolean
  isFavoritePending?: boolean
  index: number
  formatTime: (ms: number) => string
}

export interface PlayerBarProps {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  onTogglePlay: () => void
  onSeek: (pct: number) => void
  onVolumeChange: (vol: number) => void
  onShuffle: () => void
  onPrevious: () => void
  onNext: () => void
  onRepeat: () => void
  isShuffled: boolean
  repeatMode: "off" | "all" | "one"
  formatTime: (s: number) => string
}

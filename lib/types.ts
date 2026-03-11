export interface Track {
  wrapperType: string
  kind: string
  artistId: number
  collectionId: number
  trackId: number
  artistName: string
  collectionName: string
  trackName: string
  collectionCensoredName: string
  trackCensoredName: string
  artistViewUrl: string
  collectionViewUrl: string
  trackViewUrl: string
  previewUrl: string
  artworkUrl30: string
  artworkUrl60: string
  artworkUrl100: string
  collectionPrice: number
  trackPrice: number
  releaseDate: string
  collectionExplicitness: string
  trackExplicitness: string
  discCount: number
  discNumber: number
  trackCount: number
  trackNumber: number
  trackTimeMillis: number
  country: string
  currency: string
  primaryGenreName: string
}

export interface SearchResponse {
  resultCount: number
  results: Track[]
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
  index: number
}

export interface TrackRowProps {
  track: Track
  isActive: boolean
  isPlaying: boolean
  onPlay: (track: Track) => void
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
  formatTime: (s: number) => string
}

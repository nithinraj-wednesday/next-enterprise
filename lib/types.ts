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
  onSearch: (query: string, options?: { shouldScroll?: boolean }) => void
  loading: boolean
  className?: string
  recentlySearched?: Track[]
  onSelectRecentTrack?: (track: Track) => void
  onRemoveRecentTrack?: (trackId: number) => void
  onClearRecentSearches?: () => void
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
  formatTime: (s: number) => string
  optionsMenu?: React.ReactNode
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
  optionsMenu?: React.ReactNode
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
  onClose?: () => void
  isFavorite?: boolean
  isFavoritePending?: boolean
  onToggleFavorite?: () => void
}

export interface Playlist {
  id: string
  name: string
  userId: string
  isPublic: boolean
  shareUrl?: string
  sharedAt?: string
  ownerName?: string
  savedAt?: string
  isSavedShared?: boolean
  createdAt: string
  updatedAt: string
}

export interface PlaylistTrack extends Track {
  addedAt: string
}

export interface PlaylistsResponse {
  playlists: Playlist[]
}

export interface PlaylistResponse {
  playlist: Playlist
}

export interface PlaylistTracksResponse {
  tracks: PlaylistTrack[]
}

export interface SharedPlaylist {
  id: string
  name: string
  ownerId: string
  ownerName?: string
  isPublic: boolean
  shareUrl?: string
  sharedAt?: string
  isSavedByViewer: boolean
  createdAt: string
  updatedAt: string
}

export interface SharedPlaylistView {
  playlist: SharedPlaylist
  tracks: PlaylistTrack[]
}

export interface SharedPlaylistSaveResponse {
  playlist: Playlist
  alreadySaved: boolean
}

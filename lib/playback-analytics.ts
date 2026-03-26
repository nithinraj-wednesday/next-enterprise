import { Track } from "./types"

export type PlaybackEndReason = "ended" | "stopped" | "switched_track" | "unmounted"

export interface PlaybackSession {
  sessionId: string
  track: Track
  listenedSeconds: number
  lastKnownTime: number
  pauseCount: number
  seekCount: number
  startedAt: string
}

interface TrackPlaybackEvent {
  event: "track_played"
  properties: Record<string, number | string | boolean | undefined>
}

interface PlaybackSummaryEvent {
  event: "track_playback_session_ended"
  properties: Record<string, number | string | boolean | undefined>
}

const MIN_LISTEN_SECONDS_TO_CAPTURE = 1

function getTrackProperties(track: Track) {
  return {
    track_id: track.trackId,
    track_name: track.trackName,
    artist_name: track.artistName,
    collection_name: track.collectionName,
    primary_genre_name: track.primaryGenreName,
    preview_url: track.previewUrl,
    track_view_url: track.trackViewUrl,
    full_track_duration_seconds:
      track.trackTimeMillis > 0 ? Number((track.trackTimeMillis / 1000).toFixed(2)) : undefined,
  }
}

export function createPlaybackSessionId(trackId: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${trackId}-${Date.now()}`
}

export function createPlaybackSession(
  track: Track,
  sessionId = createPlaybackSessionId(track.trackId)
): PlaybackSession {
  return {
    sessionId,
    track,
    listenedSeconds: 0,
    lastKnownTime: 0,
    pauseCount: 0,
    seekCount: 0,
    startedAt: new Date().toISOString(),
  }
}

export function updatePlaybackSession(session: PlaybackSession, currentTimeSeconds: number): PlaybackSession {
  const safeCurrentTime = Number.isFinite(currentTimeSeconds) ? Math.max(0, currentTimeSeconds) : session.lastKnownTime
  const delta = safeCurrentTime - session.lastKnownTime

  if (delta > 0) {
    session.listenedSeconds += delta
  }

  session.lastKnownTime = safeCurrentTime
  return session
}

export function recordPlaybackPause(session: PlaybackSession): PlaybackSession {
  session.pauseCount += 1
  return session
}

export function recordPlaybackSeek(session: PlaybackSession, nextTimeSeconds: number): PlaybackSession {
  session.seekCount += 1
  session.lastKnownTime = Math.max(0, nextTimeSeconds)
  return session
}

export function getPreviewDurationSeconds(track: Track, audioDurationSeconds?: number): number {
  if (audioDurationSeconds && Number.isFinite(audioDurationSeconds) && audioDurationSeconds > 0) {
    return Number(audioDurationSeconds.toFixed(2))
  }

  if (track.trackTimeMillis > 0) {
    return Number((track.trackTimeMillis / 1000).toFixed(2))
  }

  return 0
}

export function buildTrackPlayedEvent(track: Track, sessionId: string): TrackPlaybackEvent {
  return {
    event: "track_played",
    properties: {
      ...getTrackProperties(track),
      playback_source: "preview_player",
      session_id: sessionId,
    },
  }
}

export function buildPlaybackSummaryEvent(
  session: PlaybackSession,
  reason: PlaybackEndReason,
  previewDurationSeconds: number
): PlaybackSummaryEvent | null {
  const listenedSeconds = Number(session.listenedSeconds.toFixed(2))

  if (listenedSeconds < MIN_LISTEN_SECONDS_TO_CAPTURE) {
    return null
  }

  const safePreviewDuration = previewDurationSeconds > 0 ? previewDurationSeconds : 0
  const boundedListenedSeconds =
    safePreviewDuration > 0 ? Math.min(listenedSeconds, safePreviewDuration) : listenedSeconds
  const listenedPercent =
    safePreviewDuration > 0 ? Number(((boundedListenedSeconds / safePreviewDuration) * 100).toFixed(2)) : 0

  return {
    event: "track_playback_session_ended",
    properties: {
      ...getTrackProperties(session.track),
      playback_source: "preview_player",
      session_id: session.sessionId,
      playback_end_reason: reason,
      started_at: session.startedAt,
      preview_duration_seconds: safePreviewDuration,
      listened_seconds: boundedListenedSeconds,
      listened_percent: listenedPercent,
      pause_count: session.pauseCount,
      seek_count: session.seekCount,
      completed_preview: reason === "ended" || listenedPercent >= 95,
    },
  }
}

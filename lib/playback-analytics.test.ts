import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildPlaybackSummaryEvent,
  buildTrackPlayedEvent,
  createPlaybackSession,
  recordPlaybackPause,
  recordPlaybackSeek,
  updatePlaybackSession,
} from "./playback-analytics"
import { Track } from "./types"

const track: Track = {
  trackId: 42,
  trackName: "Night Drive",
  artistName: "The Midnight",
  collectionName: "Kids",
  previewUrl: "https://example.com/night-drive.m4a",
  artworkUrl60: "https://example.com/60.jpg",
  artworkUrl100: "https://example.com/100.jpg",
  trackTimeMillis: 180000,
  primaryGenreName: "Synthwave",
  trackViewUrl: "https://example.com/track/42",
}

describe("playback analytics", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"))
  })

  it("builds a track played event with song metadata", () => {
    const event = buildTrackPlayedEvent(track, "session-1")

    expect(event).toEqual({
      event: "track_played",
      properties: expect.objectContaining({
        track_id: 42,
        track_name: "Night Drive",
        artist_name: "The Midnight",
        playback_source: "preview_player",
        session_id: "session-1",
      }),
    })
  })

  it("accumulates only real listened time and ignores seek jumps", () => {
    const session = createPlaybackSession(track, "session-1")

    updatePlaybackSession(session, 0.4)
    updatePlaybackSession(session, 0.9)
    recordPlaybackSeek(session, 25)
    updatePlaybackSession(session, 25.4)

    expect(session.listenedSeconds).toBeCloseTo(1.3, 5)
    expect(session.seekCount).toBe(1)
  })

  it("builds a playback summary event with listen duration", () => {
    const session = createPlaybackSession(track, "session-1")

    updatePlaybackSession(session, 5)
    recordPlaybackPause(session)

    const event = buildPlaybackSummaryEvent(session, "stopped", 30)

    expect(event).toEqual({
      event: "track_playback_session_ended",
      properties: expect.objectContaining({
        track_id: 42,
        session_id: "session-1",
        playback_end_reason: "stopped",
        preview_duration_seconds: 30,
        listened_seconds: 5,
        listened_percent: 16.67,
        pause_count: 1,
        seek_count: 0,
        completed_preview: false,
      }),
    })
  })

  it("drops sessions shorter than the minimum threshold", () => {
    const session = createPlaybackSession(track, "session-1")

    updatePlaybackSession(session, 0.5)

    expect(buildPlaybackSummaryEvent(session, "stopped", 30)).toBeNull()
  })
})

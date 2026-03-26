import { describe, expect, it, vi, afterEach } from "vitest"
import { favoritePayloadSchema, trackToFavoritePayload, createOptimisticFavorite, favoriteToTrack } from "./favorites"
import { Track, FavoriteSong } from "./types"

// A valid track fixture used across tests
const validTrack: Track = {
  trackId: 123456,
  trackName: "Bohemian Rhapsody",
  artistName: "Queen",
  collectionName: "A Night at the Opera",
  previewUrl: "https://audio-ssl.itunes.apple.com/preview.m4a",
  artworkUrl60: "https://is1-ssl.mzstatic.com/60x60.jpg",
  artworkUrl100: "https://is1-ssl.mzstatic.com/100x100.jpg",
  trackTimeMillis: 354000,
  primaryGenreName: "Rock",
  trackViewUrl: "https://music.apple.com/track/123456",
}

describe("favoritePayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = favoritePayloadSchema.safeParse(validTrack)
    expect(result.success).toBe(true)
  })

  it("accepts payload without optional trackViewUrl", () => {
    const { trackViewUrl: _trackViewUrl, ...withoutUrl } = validTrack
    const result = favoritePayloadSchema.safeParse(withoutUrl)
    expect(result.success).toBe(true)
  })

  it("rejects when trackId is missing", () => {
    const { trackId: _trackId, ...noId } = validTrack
    const result = favoritePayloadSchema.safeParse(noId)
    expect(result.success).toBe(false)
  })

  it("rejects when trackId is negative", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackId: -1 })
    expect(result.success).toBe(false)
  })

  it("rejects when trackId is zero", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackId: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects when trackId is a float", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackId: 1.5 })
    expect(result.success).toBe(false)
  })

  it("rejects when trackName is empty string", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackName: "" })
    expect(result.success).toBe(false)
  })

  it("rejects when previewUrl is not a valid URL", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, previewUrl: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("rejects when trackTimeMillis is negative", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackTimeMillis: -100 })
    expect(result.success).toBe(false)
  })

  it("accepts trackTimeMillis of zero", () => {
    const result = favoritePayloadSchema.safeParse({ ...validTrack, trackTimeMillis: 0 })
    expect(result.success).toBe(true)
  })
})

describe("trackToFavoritePayload", () => {
  it("extracts only the payload fields from a track", () => {
    const payload = trackToFavoritePayload(validTrack)
    expect(payload).toEqual({
      trackId: 123456,
      trackName: "Bohemian Rhapsody",
      artistName: "Queen",
      collectionName: "A Night at the Opera",
      previewUrl: "https://audio-ssl.itunes.apple.com/preview.m4a",
      artworkUrl60: "https://is1-ssl.mzstatic.com/60x60.jpg",
      artworkUrl100: "https://is1-ssl.mzstatic.com/100x100.jpg",
      trackTimeMillis: 354000,
      primaryGenreName: "Rock",
      trackViewUrl: "https://music.apple.com/track/123456",
    })
  })

  it("strips extra fields like releaseDate that exist on Track", () => {
    const trackWithExtra = { ...validTrack, releaseDate: "2024-01-01" }
    const payload = trackToFavoritePayload(trackWithExtra)
    expect(payload).not.toHaveProperty("releaseDate")
  })

  it("carries over undefined trackViewUrl", () => {
    const { trackViewUrl: _trackViewUrl, ...noUrl } = validTrack
    const payload = trackToFavoritePayload(noUrl as Track)
    expect(payload.trackViewUrl).toBeUndefined()
  })
})

describe("createOptimisticFavorite", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("includes all payload fields plus a createdAt timestamp", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"))

    const fav = createOptimisticFavorite(validTrack)

    expect(fav.trackId).toBe(validTrack.trackId)
    expect(fav.trackName).toBe(validTrack.trackName)
    expect(fav.createdAt).toBe("2026-03-25T12:00:00.000Z")
  })

  it("returns an ISO 8601 date string for createdAt", () => {
    const fav = createOptimisticFavorite(validTrack)
    // ISO string always matches this pattern
    expect(fav.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe("favoriteToTrack", () => {
  const favorite: FavoriteSong = {
    ...trackToFavoritePayload(validTrack),
    createdAt: "2026-03-25T12:00:00.000Z",
  }

  it("converts a FavoriteSong back to a Track", () => {
    const track = favoriteToTrack(favorite)
    expect(track.trackId).toBe(favorite.trackId)
    expect(track.trackName).toBe(favorite.trackName)
    expect(track.artistName).toBe(favorite.artistName)
  })

  it("does not include createdAt on the returned Track", () => {
    const track = favoriteToTrack(favorite)
    expect(track).not.toHaveProperty("createdAt")
  })

  it("round-trips: track -> payload -> favorite -> track preserves data", () => {
    const roundTripped = favoriteToTrack(createOptimisticFavorite(validTrack))
    // Should match all the original Track fields
    expect(roundTripped.trackId).toBe(validTrack.trackId)
    expect(roundTripped.trackName).toBe(validTrack.trackName)
    expect(roundTripped.artistName).toBe(validTrack.artistName)
    expect(roundTripped.previewUrl).toBe(validTrack.previewUrl)
  })
})

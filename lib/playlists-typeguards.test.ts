/**
 * Tests for serializePlaylist from lib/playlists.ts
 *
 * We mock the DB, Redis, and schema imports to avoid triggering
 * env validation (T3 Env) during test runs.
 */
import { describe, expect, it, vi } from "vitest"

// Mock modules that trigger env validation before importing the module under test
vi.mock("./db", () => ({
  db: {},
}))
vi.mock("./redis", () => ({
  redis: null,
}))
vi.mock("./db-schema", () => ({
  favoriteSong: {},
  playlist: {},
  playlistTrack: {},
  user: {},
}))
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
}))

// Now we can safely import
const { serializePlaylist } = await import("./playlists")

// Build a mock DB row that matches `typeof playlist.$inferSelect`
function makePlaylistRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "playlist-1",
    name: "My Playlist",
    userId: "user-1",
    isPublic: false,
    shareToken: null,
    sharedAt: null,
    isSavedShared: false,
    sourcePlaylistId: null,
    sourceOwnerId: null,
    sourceOwnerName: null,
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-01-15T12:00:00Z"),
    ...overrides,
  } as Parameters<typeof serializePlaylist>[0]
}

describe("serializePlaylist", () => {
  it("converts Date fields to ISO strings", () => {
    const result = serializePlaylist(makePlaylistRow())
    expect(result.createdAt).toBe("2026-01-15T10:00:00.000Z")
    expect(result.updatedAt).toBe("2026-01-15T12:00:00.000Z")
  })

  it("sets shareUrl when playlist is public AND has a shareToken", () => {
    const result = serializePlaylist(makePlaylistRow({ isPublic: true, shareToken: "abc-token-123" }))
    expect(result.shareUrl).toBe("/shared/abc-token-123")
  })

  it("does not set shareUrl when playlist is public but has no shareToken", () => {
    const result = serializePlaylist(makePlaylistRow({ isPublic: true, shareToken: null }))
    expect(result.shareUrl).toBeUndefined()
  })

  it("does not set shareUrl when playlist has shareToken but is not public", () => {
    const result = serializePlaylist(makePlaylistRow({ isPublic: false, shareToken: "abc-token-123" }))
    expect(result.shareUrl).toBeUndefined()
  })

  it("sets sharedAt as ISO string when present", () => {
    const result = serializePlaylist(makePlaylistRow({ sharedAt: new Date("2026-02-01T08:00:00Z") }))
    expect(result.sharedAt).toBe("2026-02-01T08:00:00.000Z")
  })

  it("leaves sharedAt undefined when null", () => {
    const result = serializePlaylist(makePlaylistRow({ sharedAt: null }))
    expect(result.sharedAt).toBeUndefined()
  })

  it("sets ownerName only for saved shared playlists", () => {
    const result = serializePlaylist(makePlaylistRow({ isSavedShared: true, sourceOwnerName: "Alice" }))
    expect(result.ownerName).toBe("Alice")
  })

  it("does not set ownerName for non-saved-shared playlists", () => {
    const result = serializePlaylist(makePlaylistRow({ isSavedShared: false, sourceOwnerName: "Alice" }))
    expect(result.ownerName).toBeUndefined()
  })

  it("sets savedAt for saved shared playlists", () => {
    const result = serializePlaylist(makePlaylistRow({ isSavedShared: true }))
    expect(result.savedAt).toBe("2026-01-15T10:00:00.000Z")
  })

  it("does not set savedAt for regular playlists", () => {
    const result = serializePlaylist(makePlaylistRow({ isSavedShared: false }))
    expect(result.savedAt).toBeUndefined()
  })

  it("sets isSavedShared to true (truthy) or undefined (falsy)", () => {
    const saved = serializePlaylist(makePlaylistRow({ isSavedShared: true }))
    expect(saved.isSavedShared).toBe(true)

    const notSaved = serializePlaylist(makePlaylistRow({ isSavedShared: false }))
    expect(notSaved.isSavedShared).toBeUndefined()
  })
})

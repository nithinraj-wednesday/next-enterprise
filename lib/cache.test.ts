import { describe, expect, it } from "vitest"
import { CACHE_TTL, getCacheKey } from "./cache"

describe("CACHE_TTL", () => {
  it("has expected TTL values in seconds", () => {
    expect(CACHE_TTL.playlists).toBe(60)
    expect(CACHE_TTL.favorites).toBe(60)
    expect(CACHE_TTL.search).toBe(300)
    expect(CACHE_TTL.sharedPlaylist).toBe(600)
  })
})

describe("getCacheKey", () => {
  it("returns just namespace when no parts given", () => {
    expect(getCacheKey("search")).toBe("search")
  })

  it("joins namespace and parts with colons", () => {
    expect(getCacheKey("favorites", "user123")).toBe("favorites:user123")
  })

  it("joins multiple parts", () => {
    expect(getCacheKey("search", "rock", "US")).toBe("search:rock:us")
  })

  it("lowercases all parts", () => {
    expect(getCacheKey("Search", "ROCK", "US")).toBe("Search:rock:us")
  })

  it("handles numeric parts by converting to string", () => {
    expect(getCacheKey("favorites", "user1", 12345)).toBe("favorites:user1:12345")
  })

  it("filters out null parts (empty string becomes falsy)", () => {
    expect(getCacheKey("favorites", null, "user1")).toBe("favorites:user1")
  })

  it("filters out undefined parts", () => {
    expect(getCacheKey("favorites", undefined, "user1")).toBe("favorites:user1")
  })

  it("trims whitespace from parts", () => {
    expect(getCacheKey("search", "  rock  ", " jazz ")).toBe("search:rock:jazz")
  })

  it("filters out parts that are only whitespace (become empty after trim)", () => {
    expect(getCacheKey("search", "   ", "rock")).toBe("search:rock")
  })

  it("handles all null/undefined parts — returns just namespace", () => {
    expect(getCacheKey("search", null, undefined, null)).toBe("search")
  })
})

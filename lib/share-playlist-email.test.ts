import { describe, expect, it } from "vitest"
import { createSharePlaylistEmailContent, getEmailDomain } from "./share-playlist-email"

describe("createSharePlaylistEmailContent", () => {
  const baseArgs = {
    playlistName: "Chill Vibes",
    shareUrl: "https://app.example.com/shared/abc-123",
    sharerName: "Alice",
  }

  it("returns subject, text, and html fields", () => {
    const result = createSharePlaylistEmailContent(baseArgs)
    expect(result).toHaveProperty("subject")
    expect(result).toHaveProperty("text")
    expect(result).toHaveProperty("html")
  })

  it("builds a subject with sharer name and playlist name", () => {
    const { subject } = createSharePlaylistEmailContent(baseArgs)
    expect(subject).toBe('Alice shared "Chill Vibes" with you')
  })

  it("includes the share URL in the plain text body", () => {
    const { text } = createSharePlaylistEmailContent(baseArgs)
    expect(text).toContain("https://app.example.com/shared/abc-123")
  })

  it("includes sharer name and playlist name in plain text", () => {
    const { text } = createSharePlaylistEmailContent(baseArgs)
    expect(text).toContain("Alice")
    expect(text).toContain("Chill Vibes")
  })

  it("includes an anchor tag with the share URL in html", () => {
    const { html } = createSharePlaylistEmailContent(baseArgs)
    expect(html).toContain('href="https://app.example.com/shared/abc-123"')
  })

  describe("HTML escaping (XSS prevention)", () => {
    it("escapes < and > in playlist name", () => {
      const { html } = createSharePlaylistEmailContent({
        ...baseArgs,
        playlistName: "<script>alert('xss')</script>",
      })
      expect(html).not.toContain("<script>")
      expect(html).toContain("&lt;script&gt;")
    })

    it("escapes & in sharer name", () => {
      const { html } = createSharePlaylistEmailContent({
        ...baseArgs,
        sharerName: "Tom & Jerry",
      })
      expect(html).toContain("Tom &amp; Jerry")
    })

    it("escapes double quotes in share URL", () => {
      const { html } = createSharePlaylistEmailContent({
        ...baseArgs,
        shareUrl: 'https://example.com/shared/abc"onmouseover="alert(1)',
      })
      expect(html).toContain("&quot;")
      expect(html).not.toContain('"onmouseover=')
    })

    it("escapes single quotes in playlist name", () => {
      const { html } = createSharePlaylistEmailContent({
        ...baseArgs,
        playlistName: "Rock'n'Roll Mix",
      })
      expect(html).toContain("&#39;")
    })
  })

  it("plain text subject does NOT escape HTML (used as email subject, not rendered as HTML)", () => {
    const { subject } = createSharePlaylistEmailContent({
      ...baseArgs,
      playlistName: "Tom & Jerry's Hits",
    })
    // Subject uses raw values — email clients render subjects as plain text
    expect(subject).toContain("&")
    expect(subject).toContain("'")
  })
})

describe("getEmailDomain", () => {
  it("extracts domain from a standard email", () => {
    expect(getEmailDomain("alice@example.com")).toBe("example.com")
  })

  it("lowercases the domain", () => {
    expect(getEmailDomain("alice@EXAMPLE.COM")).toBe("example.com")
  })

  it("returns 'unknown' when there is no @ sign", () => {
    expect(getEmailDomain("not-an-email")).toBe("unknown")
  })

  it("handles email with multiple @ signs (takes after first @)", () => {
    // split("@") with destructuring [, domain] gives second element
    const result = getEmailDomain("weird@address@example.com")
    expect(result).toBe("address")
  })

  it("handles empty string", () => {
    expect(getEmailDomain("")).toBe("unknown")
  })
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { SEARCH_DEFAULTS } from "@/app/music/constants"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get("term")
  const entity = searchParams.get("entity") || SEARCH_DEFAULTS.entity
  const limit = searchParams.get("limit") || SEARCH_DEFAULTS.limit
  const country = searchParams.get("country") || SEARCH_DEFAULTS.country

  if (!term) {
    return NextResponse.json({ resultCount: 0, results: [] })
  }

  try {
    if (term.toLowerCase() === "trending") {
      const rssUrl = `https://itunes.apple.com/us/rss/topsongs/limit=${limit}/json`
      const rssResponse = await fetch(rssUrl, { next: { revalidate: 3600 } })

      if (!rssResponse.ok) {
        throw new Error(`iTunes RSS API responded with status ${rssResponse.status}`)
      }

      const rssData: any = await rssResponse.json()

      // Map RSS feed format to match standard search API format
      const entryList = rssData?.feed?.entry || []
      const results = entryList.map((entry: any) => {
        // Find enclosure link for previewUrl
        const enclosureLink = entry.link?.find((l: any) => l.attributes?.rel === "enclosure")
        const alternateLink = entry.link?.find((l: any) => l.attributes?.rel === "alternate")

        return {
          trackId: parseInt(entry.id?.attributes?.["im:id"] || "0", 10),
          artistName: entry["im:artist"]?.label || "Unknown Artist",
          collectionName: entry["im:collection"]?.["im:name"]?.label || "Unknown Album",
          trackName: entry["im:name"]?.label || "Unknown Track",
          previewUrl: enclosureLink?.attributes?.href || "",
          artworkUrl60:
            entry["im:image"]?.find((img: any) => img.attributes?.height === "55")?.label ||
            entry["im:image"]?.[0]?.label ||
            "",
          artworkUrl100:
            entry["im:image"]?.find((img: any) => img.attributes?.height === "170")?.label ||
            entry["im:image"]?.[entry["im:image"].length - 1]?.label ||
            "",
          trackTimeMillis: parseInt(enclosureLink?.["im:duration"]?.label || "30000", 10),
          primaryGenreName: entry.category?.attributes?.label || "Music",
          trackViewUrl: alternateLink?.attributes?.href || "",
          releaseDate: entry["im:releaseDate"]?.label || "",
        }
      })

      return NextResponse.json({ resultCount: results.length, results })
    }

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      term
    )}&entity=${entity}&limit=${limit}&country=${country}`
    const response = await fetch(url, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`iTunes API responded with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("iTunes Search API error:", error)
    return NextResponse.json({ error: "Failed to fetch from iTunes API", resultCount: 0, results: [] }, { status: 500 })
  }
}

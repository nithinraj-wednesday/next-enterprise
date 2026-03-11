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

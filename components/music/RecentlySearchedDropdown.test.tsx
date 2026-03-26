import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Track } from "@/lib/types"
import { RecentlySearchedDropdown } from "./RecentlySearchedDropdown"

// Mock next/image since it requires Next.js runtime
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} data-fill={fill ? "true" : undefined} />
  },
}))

function makeTrack(id: number, name?: string): Track {
  return {
    trackId: id,
    trackName: name ?? `Track ${id}`,
    artistName: `Artist ${id}`,
    collectionName: `Album ${id}`,
    previewUrl: `https://example.com/preview/${id}.m4a`,
    artworkUrl60: `https://example.com/art/${id}/60x60.jpg`,
    artworkUrl100: `https://example.com/art/${id}/100x100.jpg`,
    trackTimeMillis: 200000 + id,
    primaryGenreName: "Pop",
  }
}

describe("RecentlySearchedDropdown", () => {
  const defaultHandlers = {
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  }

  it("renders nothing when tracks is empty", () => {
    const { container } = render(<RecentlySearchedDropdown tracks={[]} {...defaultHandlers} />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the 'Recent' header", () => {
    render(<RecentlySearchedDropdown tracks={[makeTrack(1)]} {...defaultHandlers} />)
    expect(screen.getByText("Recent")).toBeInTheDocument()
  })

  it("renders a 'Clear all' button", () => {
    render(<RecentlySearchedDropdown tracks={[makeTrack(1)]} {...defaultHandlers} />)
    expect(screen.getByText("Clear all")).toBeInTheDocument()
  })

  it("calls onClear when 'Clear all' is clicked", () => {
    const onClear = vi.fn()
    render(<RecentlySearchedDropdown tracks={[makeTrack(1)]} {...defaultHandlers} onClear={onClear} />)
    fireEvent.click(screen.getByText("Clear all"))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it("shows up to 4 tracks in the grid section", () => {
    const tracks = Array.from({ length: 6 }, (_, i) => makeTrack(i + 1))
    render(<RecentlySearchedDropdown tracks={tracks} {...defaultHandlers} />)
    // Grid tracks show track name as text
    // First 4 should be in grid, next 2 in list
    expect(screen.getByText("Track 1")).toBeInTheDocument()
    expect(screen.getByText("Track 4")).toBeInTheDocument()
  })

  it("shows remaining tracks (5-10) in the list section", () => {
    const tracks = Array.from({ length: 8 }, (_, i) => makeTrack(i + 1))
    render(<RecentlySearchedDropdown tracks={tracks} {...defaultHandlers} />)
    // Tracks 5-8 should be in the list section with artist names
    expect(screen.getByText("Artist 5")).toBeInTheDocument()
    expect(screen.getByText("Artist 8")).toBeInTheDocument()
  })

  it("does not show the list section when 4 or fewer tracks", () => {
    const tracks = Array.from({ length: 3 }, (_, i) => makeTrack(i + 1))
    render(<RecentlySearchedDropdown tracks={tracks} {...defaultHandlers} />)
    // With only 3 tracks, no list section means no artist names displayed
    // (grid section only shows track name, not artist)
    expect(screen.queryByText("Artist 1")).not.toBeInTheDocument()
  })

  it("calls onSelect with the track when a grid track is clicked", () => {
    const onSelect = vi.fn()
    const track = makeTrack(42, "Test Song")
    render(<RecentlySearchedDropdown tracks={[track]} {...defaultHandlers} onSelect={onSelect} />)
    fireEvent.click(screen.getByText("Test Song"))
    expect(onSelect).toHaveBeenCalledWith(track)
  })

  it("calls onRemove with trackId when remove button is clicked", () => {
    const onRemove = vi.fn()
    const track = makeTrack(42, "Test Song")
    render(<RecentlySearchedDropdown tracks={[track]} {...defaultHandlers} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText("Remove Test Song"))
    expect(onRemove).toHaveBeenCalledWith(42)
  })

  it("renders remove buttons with correct aria-labels for each track", () => {
    const tracks = [makeTrack(1, "Song A"), makeTrack(2, "Song B")]
    render(<RecentlySearchedDropdown tracks={tracks} {...defaultHandlers} />)
    expect(screen.getByLabelText("Remove Song A")).toBeInTheDocument()
    expect(screen.getByLabelText("Remove Song B")).toBeInTheDocument()
  })
})

"use client"

import {
  Clock04Icon,
  Compass01Icon,
  MusicNote01Icon,
  MusicNote02Icon,
  Playlist02Icon,
  UserMultiple02Icon,
  // @ts-expect-error - hugeicons moduleResolution mismatch
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { FEATURED_SEARCHES, getArtworkUrl } from "@/app/music/constants"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SearchResponse, Track } from "@/lib/types"

interface Artist {
  artistId: number
  artistName: string
  artistLinkUrl?: string
  primaryGenreName?: string
}

interface MusicSidebarLayoutProps {
  children: React.ReactNode
}

const MAIN_NAV = [
  { label: "Discover", href: "/music", icon: Compass01Icon },
  { label: "Playlists", href: "/favorites", icon: Playlist02Icon },
]

export function MusicSidebarLayout({ children }: MusicSidebarLayoutProps) {
  const pathname = usePathname()
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)
  const [electronicTracks, setElectronicTracks] = useState<Track[]>([])
  const [songsLoading, setSongsLoading] = useState(true)
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])

  // Load Recently Played
  useEffect(() => {
    const loadRecentlyPlayed = () => {
      try {
        const stored = localStorage.getItem("recently-played")
        if (stored) setRecentlyPlayed(JSON.parse(stored) as Track[])
      } catch (e) {
        console.warn("Failed to load recently played:", e)
      }
    }

    loadRecentlyPlayed()
    window.addEventListener("recently-played-updated", loadRecentlyPlayed)
    return () => window.removeEventListener("recently-played-updated", loadRecentlyPlayed)
  }, [])

  // Fetch trending artists
  useEffect(() => {
    let cancelled = false
    const loadArtists = async () => {
      setArtistsLoading(true)
      try {
        const response = await fetch(`/api/music/search?term=top+artists+2025&entity=allArtist&limit=8`, {
          cache: "no-store",
        })
        if (!response.ok) throw new Error(`Artists request failed: ${response.status}`)
        const data = (await response.json()) as {
          results?: Array<{ artistId: number; artistName: string; artistLinkUrl?: string; primaryGenreName?: string }>
        }
        if (!cancelled) {
          // iTunes allArtist response returns results with artistName
          const uniqueArtists: Artist[] = []
          const seenNames = new Set<string>()
          for (const result of data.results ?? []) {
            if (result.artistName && !seenNames.has(result.artistName)) {
              seenNames.add(result.artistName)
              uniqueArtists.push({
                artistId: result.artistId,
                artistName: result.artistName,
                artistLinkUrl: result.artistLinkUrl,
                primaryGenreName: result.primaryGenreName,
              })
            }
            if (uniqueArtists.length >= 6) break
          }
          setArtists(uniqueArtists)
        }
      } catch (error) {
        console.error("Failed to load artists:", error)
      } finally {
        if (!cancelled) setArtistsLoading(false)
      }
    }
    void loadArtists()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch electronic songs
  useEffect(() => {
    let cancelled = false
    const loadSongs = async () => {
      setSongsLoading(true)
      try {
        const response = await fetch(`/api/music/search?term=electronic+dance&entity=song&limit=8`, {
          cache: "no-store",
        })
        if (!response.ok) throw new Error(`Songs request failed: ${response.status}`)
        const data = (await response.json()) as SearchResponse
        if (!cancelled) {
          const tracks = (data.results ?? []).filter((t: Track) => t.previewUrl).slice(0, 6)
          setElectronicTracks(tracks)
        }
      } catch (error) {
        console.error("Failed to load electronic songs:", error)
      } finally {
        if (!cancelled) setSongsLoading(false)
      }
    }
    void loadSongs()
    return () => {
      cancelled = true
    }
  }, [])

  const genreItems = FEATURED_SEARCHES.slice(0, 6)

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas" className="border-sidebar-border border-r">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Go to home page">
              <div className="relative size-8">
                <div className="from-gold/80 to-gold/40 absolute inset-0 rounded-full bg-gradient-to-br">
                  <div className="bg-sidebar absolute inset-[35%] rounded-full" />
                </div>
              </div>
              <div>
                <span className="font-display text-sidebar-foreground text-base leading-none font-bold tracking-tight">
                  Obsidian<span className="text-sidebar-primary">Sound</span>
                </span>
              </div>
            </Link>
            <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {MAIN_NAV.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                      <Link href={item.href}>
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Recently Played */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 pr-4">
              <SidebarGroupLabel className="px-0">
                <HugeiconsIcon icon={Clock04Icon} strokeWidth={2} className="mr-1.5" />
                Recently Played
              </SidebarGroupLabel>
              {recentlyPlayed.length > 0 && (
                <Link
                  href="/music/recently-played"
                  className="text-muted-foreground hover:text-gold text-[10px] font-medium transition-colors"
                >
                  View All
                </Link>
              )}
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentlyPlayed.length === 0 ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled className="text-sidebar-foreground/50 text-xs italic">
                      <span>No play history</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  recentlyPlayed.slice(0, 5).map((track) => (
                    <SidebarMenuItem key={`recent-${track.trackId}`}>
                      <SidebarMenuButton
                        tooltip={`${track.trackName} — ${track.artistName}`}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("play-track", { detail: track })
                          )
                        }}
                        className="flex gap-2"
                      >
                        <div className="relative size-6 shrink-0 overflow-hidden rounded shadow-sm">
                          <Image
                            src={getArtworkUrl(track.artworkUrl100, "small")}
                            alt={track.trackName}
                            className="object-cover"
                            fill
                            sizes="24px"
                          />
                        </div>
                        <span className="truncate">{track.trackName}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Genre */}
          <SidebarGroup>
            <SidebarGroupLabel>Genre</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {genreItems.map((genre) => (
                  <SidebarMenuItem key={genre.query}>
                    <SidebarMenuButton asChild tooltip={genre.label}>
                      <Link href={`/music?search=${encodeURIComponent(genre.query)}`}>
                        <span className="text-sm">{genre.emoji}</span>
                        <span>{genre.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Artists */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="mr-1.5" />
              Artists
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {artistsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton disabled>
                        <div className="bg-sidebar-accent h-3 w-24 animate-pulse rounded" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : artists.length === 0 ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled className="text-sidebar-foreground/50 text-xs">
                      <span>No artists found</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  artists.map((artist) => (
                    <SidebarMenuItem key={artist.artistId}>
                      <SidebarMenuButton asChild tooltip={artist.artistName}>
                        <Link href={`/music?search=${encodeURIComponent(artist.artistName)}`}>
                          <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} />
                          <span>{artist.artistName}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Songs (Electronic) */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 pr-4">
              <SidebarGroupLabel className="px-0">
                <HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} className="mr-1.5" />
                Songs
              </SidebarGroupLabel>
              <Link
                href="/music/electronic"
                className="text-muted-foreground hover:text-gold text-[10px] font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            <SidebarGroupContent>
              <div className="grid grid-cols-1 gap-1 px-1.5">
                {songsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-sidebar-accent/50 h-10 w-full animate-pulse rounded-lg" />
                  ))
                ) : electronicTracks.length === 0 ? (
                  <div className="text-sidebar-foreground/50 px-2 py-3 text-xs italic">No songs available</div>
                ) : (
                  electronicTracks.map((track) => (
                    <Link
                      key={`electro-${track.trackId}`}
                      href={`/music?search=${encodeURIComponent(track.trackName)}`}
                      className="hover:bg-sidebar-accent group flex items-center gap-2 rounded-lg p-1.5 transition-colors"
                    >
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-md shadow-sm">
                        <Image
                          src={getArtworkUrl(track.artworkUrl100, "small")}
                          alt={track.trackName}
                          className="object-cover transition-transform group-hover:scale-110"
                          fill
                          sizes="32px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <HugeiconsIcon icon={MusicNote02Icon} className="size-3 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sidebar-foreground truncate text-xs font-medium">{track.trackName}</div>
                        <div className="text-sidebar-foreground/50 truncate text-[10px]">{track.artistName}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export { SidebarTrigger }

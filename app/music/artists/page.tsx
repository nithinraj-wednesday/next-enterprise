"use client"

import { ArrowRight, Disc3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { MusicAppHeader, TrackGridSkeleton } from "@/components/music/MusicComponents"
import { useMusicPlayer } from "@/contexts/MusicPlayerContext"
import { useMusicManagement } from "@/hooks/use-music-management"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

interface Artist {
  artistId: number
  artistName: string
  artistLinkUrl?: string
  primaryGenreName?: string
}

function ArtistsContent() {
  const { data: sessionData } = useSession()
  const { playlists } = useMusicManagement()
  const { currentTrack } = useMusicPlayer()

  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)
  const taggedGenreCount = useMemo(
    () => new Set(artists.map((artist) => artist.primaryGenreName).filter(Boolean)).size,
    [artists]
  )

  useEffect(() => {
    let cancelled = false

    const loadArtists = async () => {
      setArtistsLoading(true)
      try {
        const response = await fetch(`/api/music/search?term=top+artists+2025&entity=allArtist&limit=30`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error(`Artists request failed: ${response.status}`)
        }

        const data = (await response.json()) as { results?: Artist[] }
        if (cancelled) return

        const seenNames = new Set<string>()
        const uniqueArtists = (data.results ?? []).filter((artist) => {
          if (!artist.artistName || seenNames.has(artist.artistName)) {
            return false
          }
          seenNames.add(artist.artistName)
          return true
        })

        setArtists(uniqueArtists.slice(0, 24))
      } catch (error) {
        console.error("Failed to load artists:", error)
        if (!cancelled) setArtists([])
      } finally {
        if (!cancelled) setArtistsLoading(false)
      }
    }

    void loadArtists()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="noise-overlay" />

      <header className="relative pt-4 pb-2 sm:pt-6 sm:pb-4">
        <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
          <MusicAppHeader
            playlistCount={playlists.length + 1}
            userName={sessionData?.user?.name || undefined}
            className="mb-4 sm:mb-6"
          />
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-screen-xl px-4 py-3 sm:px-6 sm:py-5", currentTrack && "pb-32")}>
        <section className="from-secondary/60 via-background to-background border-border/50 mb-8 overflow-hidden rounded-[2rem] border bg-gradient-to-br p-5 shadow-[0_24px_80px_-48px_rgba(245,158,11,0.5)] sm:p-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] uppercase">
            <Disc3 className="size-3.5 text-amber-400" />
            Artist Radar
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="space-y-3">
              <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                View All Artists
              </h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
                Explore the artists currently bubbling through discovery. Each card jumps back into search results so
                you can preview tracks, favorite songs, and build playlists from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/70 flex flex-col justify-between rounded-2xl border border-white/8 p-4">
                <div className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">Artists</div>
                <div className="text-foreground mt-2 text-2xl font-semibold">{artists.length}</div>
              </div>
              <div className="bg-secondary/70 flex flex-col justify-between rounded-2xl border border-white/8 p-4">
                <div className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">Genres Tagged</div>
                <div className="text-foreground mt-2 text-2xl font-semibold">{taggedGenreCount}</div>
              </div>
            </div>
          </div>
        </section>

        {artistsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="bg-secondary/30 border-border/40 h-32 animate-pulse rounded-[1.5rem] border"
              />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="bg-secondary/20 border-border/30 rounded-3xl border border-dashed px-6 py-20 text-center">
            <h3 className="text-foreground text-lg font-medium">No artists found</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              The artist directory is empty right now. Try again shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {artists.map((artist, index) => (
              <Link
                key={`${artist.artistId}-${artist.artistName}`}
                href={`/music?search=${encodeURIComponent(artist.artistName)}`}
                className="group from-secondary/80 via-secondary/55 to-secondary/30 border-border/50 hover:border-gold/25 block overflow-hidden rounded-[1.5rem] border bg-gradient-to-br p-4 transition-all duration-300 hover:shadow-[0_28px_70px_-42px_rgba(245,158,11,0.45)]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-[88px] shrink-0">
                    <Image
                      src="/images/artist-placeholder-new.png"
                      alt={artist.artistName}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      fill
                      sizes="88px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-[0.28em] uppercase">
                      Artist {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-foreground truncate text-lg font-semibold">{artist.artistName}</h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2 min-h-10 text-sm">
                      {artist.primaryGenreName
                        ? `${artist.primaryGenreName} listening lane`
                        : "Open the catalog and explore this artist's top tracks."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <span className="bg-background/70 text-muted-foreground inline-flex rounded-full border border-white/8 px-3 py-1 text-xs">
                      {artist.primaryGenreName || "All genres"}
                    </span>
                  </div>

                  <span className="text-gold inline-flex items-center gap-1 text-sm font-medium">
                    Explore
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<TrackGridSkeleton />}>
      <ArtistsContent />
    </Suspense>
  )
}

import { eq, inArray, sql } from "drizzle-orm"
import { Music, User } from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { requireServerSession } from "@/lib/auth-server"
import { getAvatarUrl } from "@/lib/blob"
import { db } from "@/lib/db"
import { favoriteSong, playlist, playlistTrack } from "@/lib/db-schema"

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim()
  if (!source) {
    return "U"
  }

  const tokens = source.split(/\s+/).filter(Boolean)
  if (tokens.length > 1) {
    return `${tokens[0]?.[0] ?? ""}${tokens[1]?.[0] ?? ""}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function splitName(fullName: string) {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean)
  if (tokens.length > 1) {
    return { firstName: tokens[0], lastName: tokens.slice(1).join(" ") }
  }
  return { firstName: tokens[0] || "", lastName: "" }
}

export default async function ProfilePage() {
  const session = await requireServerSession()

  // Get user's playlists count
  const playlistsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(playlist)
    .where(eq(playlist.userId, session.user.id))
  const playlistsCount = playlistsResult[0]?.count ?? 0

  // Get total songs across all playlists
  const userPlaylistIds = await db
    .select({ id: playlist.id })
    .from(playlist)
    .where(eq(playlist.userId, session.user.id))

  let totalSongsInPlaylists = 0
  if (userPlaylistIds.length > 0) {
    const playlistIds = userPlaylistIds.map((p) => p.id)
    const songsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(playlistTrack)
      .where(inArray(playlistTrack.playlistId, playlistIds))
    totalSongsInPlaylists = songsResult[0]?.count ?? 0
  }

  // Get favorites count
  const favoritesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(favoriteSong)
    .where(eq(favoriteSong.userId, session.user.id))
  const favoritesCount = favoritesResult[0]?.count ?? 0

  const displayName = session.user.name || "Music Explorer"
  const displayEmail = session.user.email || "No email available"
  const initials = getInitials(displayName, displayEmail)
  const { firstName, lastName } = splitName(displayName)

  // Get signed URL for private blob avatars
  const avatarUrl = getAvatarUrl(session.user.image)

  return (
    <div className="bg-background relative min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="noise-overlay" />
      <div className="hero-gradient pointer-events-none fixed inset-0" />

      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">My Profile</h1>
          <Link
            href="/music"
            className="border-border/60 bg-secondary/55 text-muted-foreground hover:text-foreground inline-flex rounded-full border px-4 py-2 text-sm transition-colors"
          >
            Back to Music
          </Link>
        </div>

        <section className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <AvatarUpload currentImage={avatarUrl} initials={initials} userName={displayName} />

            <div className="space-y-1">
              <p className="text-foreground text-xl font-semibold">{displayName}</p>
              <p className="text-muted-foreground text-sm">{displayEmail}</p>
              <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">User ID: {session.user.id}</p>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <User className="size-3.5" />
                First Name
              </div>
              <p className="text-foreground font-medium">{firstName || "—"}</p>
            </div>

            {/* Last Name */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <User className="size-3.5" />
                Last Name
              </div>
              <p className="text-foreground font-medium">{lastName || "—"}</p>
            </div>

            {/* Email */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4 sm:col-span-2">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <User className="size-3.5" />
                Email Address
              </div>
              <p className="text-foreground font-medium">{displayEmail}</p>
            </div>

            {/* Total Playlists */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <Music className="size-3.5" />
                Total Playlists
              </div>
              <p className="text-foreground font-medium">{playlistsCount}</p>
            </div>

            {/* Total Songs in Playlists */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <Music className="size-3.5" />
                Songs in Playlists
              </div>
              <p className="text-foreground font-medium">{totalSongsInPlaylists}</p>
            </div>

            {/* Total Favorites */}
            <div className="bg-secondary/40 border-border/50 rounded-xl border p-4 sm:col-span-2">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
                <Music className="size-3.5" />
                Saved Tracks (Favorites)
              </div>
              <p className="text-foreground font-medium">{favoritesCount} songs</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

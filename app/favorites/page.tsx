import { desc, eq } from "drizzle-orm"
import { FavoritesPageClient } from "@/components/music/FavoritesPageClient"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { playlist } from "@/lib/db-schema"
import { listFavoritesForUser } from "@/lib/favorites-db"
import { Playlist } from "@/lib/types"

export default async function FavoritesPage() {
  const session = await requireServerSession()
  const favorites = await listFavoritesForUser(session.user.id)

  // Fetch user playlists
  const playlists = await db
    .select()
    .from(playlist)
    .where(eq(playlist.userId, session.user.id))
    .orderBy(desc(playlist.createdAt))

  // Build a map of playlist ID to a set of track IDs
  const playlistTracksMap: Record<string, number[]> = {}

  if (playlists.length > 0) {
    const playlistIds = playlists.map((p) => p.id)
    const allPlaylistTracks = await db.query.playlistTrack.findMany({
      where: (pt, { inArray }) => inArray(pt.playlistId, playlistIds),
    })

    for (const pt of allPlaylistTracks) {
      const arr = playlistTracksMap[pt.playlistId] || []
      arr.push(pt.trackId)
      playlistTracksMap[pt.playlistId] = arr
    }
  }

  // Passing as primitive array because Sets can't be serialized over Server Component boundary easily
  return (
    <FavoritesPageClient
      initialFavorites={favorites}
      initialPlaylists={JSON.parse(JSON.stringify(playlists)) as Playlist[]}
      initialPlaylistTracksMap={playlistTracksMap}
      userName={session.user.name}
    />
  )
}

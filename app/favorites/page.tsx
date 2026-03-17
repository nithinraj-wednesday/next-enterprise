import { FavoritesPageClient } from "@/components/music/FavoritesPageClient"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { listFavoritesForUser } from "@/lib/favorites-db"
import { listPlaylistsForUser, listSavedSharedPlaylistsForUser } from "@/lib/playlists"

export default async function FavoritesPage() {
  const session = await requireServerSession()
  const favorites = await listFavoritesForUser(session.user.id)

  const ownedPlaylists = await listPlaylistsForUser(session.user.id)
  const savedSharedPlaylists = await listSavedSharedPlaylistsForUser(session.user.id)
  const playlists = [...ownedPlaylists, ...savedSharedPlaylists]

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
      initialPlaylists={playlists}
      initialOwnedPlaylistIds={ownedPlaylists.map((playlist) => playlist.id)}
      initialPlaylistTracksMap={playlistTracksMap}
      userName={session.user.name}
    />
  )
}

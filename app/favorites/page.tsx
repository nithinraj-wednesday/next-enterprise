import { FavoritesPageClient } from "@/components/music/FavoritesPageClient"
import { requireServerSession } from "@/lib/auth-server"
import { listFavoritesForUser } from "@/lib/favorites-db"

export default async function FavoritesPage() {
  const session = await requireServerSession()
  const favorites = await listFavoritesForUser(session.user.id)

  return <FavoritesPageClient initialFavorites={favorites} userName={session.user.name} />
}

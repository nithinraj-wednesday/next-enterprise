import { notFound } from "next/navigation"
import { SharedPlaylistPageClient } from "@/components/music/SharedPlaylistPageClient"
import { getServerSession } from "@/lib/auth-server"
import { getSharedPlaylistByToken } from "@/lib/playlists"

export default async function SharedPlaylistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = await getServerSession()
  const data = await getSharedPlaylistByToken(token, session?.user?.id)

  if (!data) {
    notFound()
  }

  return <SharedPlaylistPageClient data={data} />
}

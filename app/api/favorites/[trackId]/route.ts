import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"
import { deleteFavoriteForUser } from "@/lib/favorites-db"

export async function DELETE(_: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { trackId: trackIdParam } = await params
  const trackId = Number(trackIdParam)

  if (!Number.isInteger(trackId) || trackId <= 0) {
    return NextResponse.json({ error: "Invalid track id" }, { status: 400 })
  }

  const removed = await deleteFavoriteForUser(session.user.id, trackId)

  return NextResponse.json({ removed })
}

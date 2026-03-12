import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"
import { favoritePayloadSchema } from "@/lib/favorites"
import { createFavoriteForUser, listFavoritesForUser } from "@/lib/favorites-db"

export async function GET() {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const favorites = await listFavoritesForUser(session.user.id)

  return NextResponse.json({ favorites })
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = favoritePayloadSchema.parse(body)
    const favorite = await createFavoriteForUser(session.user.id, payload)

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    console.error("Failed to create favorite:", error)
    return NextResponse.json({ error: "Invalid favorite payload" }, { status: 400 })
  }
}

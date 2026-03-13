import { desc, eq } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { requireServerSession } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { account } from "@/lib/db-schema"

const providerLabels: Record<string, string> = {
  credential: "Email & Password",
  github: "GitHub",
  google: "Google",
}

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

export default async function ProfilePage() {
  const session = await requireServerSession()

  const linkedAccounts = await db
    .select({
      providerId: account.providerId,
      createdAt: account.createdAt,
    })
    .from(account)
    .where(eq(account.userId, session.user.id))
    .orderBy(desc(account.createdAt))

  const uniqueProviders = Array.from(new Set(linkedAccounts.map((entry) => entry.providerId)))
  const displayName = session.user.name || "Music Explorer"
  const displayEmail = session.user.email || "No email available"
  const initials = getInitials(displayName, displayEmail)

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
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={`${displayName} profile image`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <div className="from-gold/30 to-gold/10 text-foreground flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br text-2xl font-semibold">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-foreground text-xl font-semibold">{displayName}</p>
              <p className="text-muted-foreground text-sm">{displayEmail}</p>
              <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">User ID: {session.user.id}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-muted-foreground mb-3 text-xs tracking-[0.18em] uppercase">Connected sign-in methods</p>
            <div className="flex flex-wrap gap-2">
              {uniqueProviders.length > 0 ? (
                uniqueProviders.map((providerId) => (
                  <span
                    key={providerId}
                    className="border-border/60 bg-secondary/60 text-foreground rounded-full border px-3 py-1.5 text-xs"
                  >
                    {providerLabels[providerId] ?? providerId}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No linked providers found.</span>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

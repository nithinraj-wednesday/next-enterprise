"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    await signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          router.push("/music")
        },
        onError: (ctx) => {
          setError(ctx.error.message ?? "Invalid email or password")
          setLoading(false)
        },
      }
    )
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4">
      <div className="noise-overlay" />
      <div className="hero-gradient pointer-events-none fixed inset-0" />

      <Card className="relative z-10 w-full max-w-md border-none ring-1 ring-white/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-3">
            <div className="relative size-9">
              <div className="from-gold/80 to-gold/40 absolute inset-0 rounded-full bg-gradient-to-br">
                <div className="bg-background absolute inset-[35%] rounded-full" />
              </div>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Obsidian<span className="text-gold">Sound</span>
            </span>
          </div>
          <CardTitle className="font-display text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to continue your music journey</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-none bg-transparent px-4 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-gold hover:text-gold/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

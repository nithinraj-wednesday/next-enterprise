"use client"

// @ts-expect-error Will Fix it
import { GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signUp, useSession } from "@/lib/auth-client"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { data: sessionData, isPending: isSessionPending } = useSession()

  useEffect(() => {
    if (!isSessionPending && sessionData?.user) {
      window.location.replace("/music")
    }
  }, [isSessionPending, sessionData?.user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      await signUp.email(
        {
          name,
          email,
          password,
        },
        {
          onSuccess: () => {
            window.location.assign("/music")
          },
          onError: (ctx) => {
            setError(ctx.error.message ?? "Something went wrong")
            setLoading(false)
          },
        }
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      setLoading(false)
    }
  }

  async function handleGitHubSignIn() {
    setError("")
    setGithubLoading(true)

    try {
      await signIn.social(
        {
          provider: "github",
          callbackURL: "/music",
          errorCallbackURL: "/sign-up",
        },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Unable to continue with GitHub")
            setGithubLoading(false)
          },
        }
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to continue with GitHub"
      setError(message)
      setGithubLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError("")
    setGoogleLoading(true)

    try {
      await signIn.social(
        {
          provider: "google",
          callbackURL: "/music",
          errorCallbackURL: "/sign-up",
        },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Unable to continue with Google")
            setGoogleLoading(false)
          },
        }
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to continue with Google"
      setError(message)
      setGoogleLoading(false)
    }
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
          <CardTitle className="font-display text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Start discovering music that moves you</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={loading || githubLoading || googleLoading}
              onClick={handleGoogleSignIn}
            >
              <HugeiconsIcon icon={GoogleIcon} className="size-4" />
              {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={loading || githubLoading || googleLoading}
              onClick={handleGitHubSignIn}
            >
              <HugeiconsIcon icon={GithubIcon} className="size-4" />
              {githubLoading ? "Redirecting to GitHub…" : "Continue with GitHub"}
            </Button>

            <div className="flex items-center gap-3 text-xs tracking-[0.24em] text-white/40 uppercase">
              <span className="h-px flex-1 bg-white/10" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-none bg-transparent px-4 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={loading || githubLoading || googleLoading}>
              {loading ? "Creating account…" : "Sign up"}
            </Button>
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-gold hover:text-gold/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

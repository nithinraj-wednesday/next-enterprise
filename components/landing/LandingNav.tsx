"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-500",
        scrolled ? "player-glass py-3" : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative size-9">
            <div className="from-gold/80 to-gold/40 absolute inset-0 rounded-full bg-gradient-to-br">
              <div className="bg-background absolute inset-[35%] rounded-full" />
            </div>
          </div>
          <span className="font-display text-foreground text-xl leading-none font-bold tracking-tight">
            Obsidian<span className="text-gold">Sound</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground font-body text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="text-muted-foreground hover:text-foreground font-body rounded-full px-4 py-2 text-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/music"
            className="bg-gold text-primary-foreground font-body rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--gold-glow)] hover:brightness-110"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground p-2 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="player-glass border-border/50 mt-3 border-t">
          <div className="flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground font-body rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-border/50 mt-2 flex flex-col gap-2 border-t pt-3">
              <Link
                href="/sign-in"
                className="text-muted-foreground font-body rounded-lg px-3 py-2.5 text-center text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/music"
                className="bg-gold text-primary-foreground font-body rounded-full px-5 py-2.5 text-center text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

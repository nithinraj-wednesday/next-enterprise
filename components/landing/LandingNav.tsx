"use client"

import {
  animate,
  AnimatePresence,
  type AnimationPlaybackControls,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import Link from "next/link"
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { ProfileDropdown } from "@/components/ProfileDropdown"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

const SCROLL_DURATION = 1.1
const SCROLL_EASE = [0.22, 1, 0.36, 1] as const

function NavLink({
  link,
  index,
  isActive,
  onNavigate,
}: {
  link: (typeof NAV_LINKS)[number]
  index: number
  isActive: boolean
  onNavigate: (href: string, e: MouseEvent) => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  // Magnetic hover — link subtly follows the cursor
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 250, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 250, damping: 20 })

  const handleMouseMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    mouseX.set((e.clientX - cx) * 0.15)
    mouseY.set((e.clientY - cy) * 0.3)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.a
      ref={ref}
      href={link.href}
      onClick={(e) => onNavigate(link.href, e)}
      initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn(
        "font-body relative px-1 py-0.5 text-sm transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {link.label}

      {/* Active underline — slides between links */}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="bg-gold absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full"
          style={{ boxShadow: "0 0 8px var(--gold-glow, rgba(200,160,60,0.4))" }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        />
      )}

      {/* Hover glow dot */}
      <motion.span
        className="bg-gold/40 pointer-events-none absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  )
}

export function LandingNav() {
  const { data: sessionData } = useSession()
  const isLoggedIn = Boolean(sessionData?.user)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const isScrollingTo = useRef(false)
  const scrollAnimRef = useRef<AnimationPlaybackControls | null>(null)

  // Clean up scroll animation on unmount
  useEffect(() => {
    return () => {
      scrollAnimRef.current?.stop()
    }
  }, [])

  // Scroll progress bar value (0–1)
  const scrollProgress = useMotionValue(0)
  const scaleX = useSpring(scrollProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) scrollProgress.set(window.scrollY / docHeight)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [scrollProgress])

  // Track which section is currently in view
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.replace("#", ""))
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`)
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    )
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // Custom smooth scroll with framer-motion animate + arrival glow
  const scrollToSection = useCallback((href: string, e: MouseEvent) => {
    const id = href.replace("#", "")
    const target = document.getElementById(id)
    // If target section doesn't exist, let the browser handle native anchor behavior
    if (!target) return

    e.preventDefault()

    // Stop any in-flight scroll animation to prevent overlapping scrolls
    scrollAnimRef.current?.stop()
    isScrollingTo.current = true

    // Immediately set active for instant feedback
    setActiveSection(href)

    const targetY = target.getBoundingClientRect().top + window.scrollY - 80

    // Animate the scroll
    scrollAnimRef.current = animate(window.scrollY, targetY, {
      duration: SCROLL_DURATION,
      ease: SCROLL_EASE,
      onUpdate: (v) => window.scrollTo(0, v),
      onComplete: () => {
        isScrollingTo.current = false
        scrollAnimRef.current = null

        // // Update URL hash for deep-linking and browser history
        history.pushState(null, "", `#${id}`)

        // Arrival glow effect on the target section
        target.style.transition = "none"
        target.style.boxShadow = "inset 0 0 80px -20px var(--gold-glow, rgba(200,160,60,0.15))"
        // Force reflow
        void target.offsetHeight
        target.style.transition = "box-shadow 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        target.style.boxShadow = "inset 0 0 80px -20px transparent"
      },
    })
  }, [])

  // Gold gradient that fades in as you scroll
  const progressOpacity = useTransform(scaleX, [0, 0.02, 0.05], [0, 0.5, 1])

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-500",
        scrolled ? "player-glass py-3" : "bg-transparent py-5"
      )}
    >
      {/* Scroll progress bar */}
      <motion.div
        className="absolute right-0 bottom-0 left-0 h-[2px] origin-left"
        style={{
          scaleX,
          opacity: progressOpacity,
          background:
            "linear-gradient(90deg, var(--gold-dim, #b8960c) 0%, var(--gold, #d4a825) 50%, var(--gold-dim, #b8960c) 100%)",
        }}
      />

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
          {NAV_LINKS.map((link, i) => (
            <NavLink
              key={link.href}
              link={link}
              index={i}
              isActive={activeSection === link.href}
              onNavigate={scrollToSection}
            />
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link
                href="/music"
                className="bg-gold text-primary-foreground font-body rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--gold-glow)] hover:brightness-110"
              >
                Go to App
              </Link>
              <ProfileDropdown />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-2" aria-label="Toggle menu">
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
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden md:hidden"
          >
            <div className="player-glass border-border/50 mt-3 border-t">
              <div className="flex flex-col gap-1 px-4 py-4">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      setMobileOpen(false)
                      scrollToSection(link.href, e)
                    }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 + i * 0.06, ease: "easeOut" }}
                    className={cn(
                      "font-body rounded-lg px-3 py-2.5 text-sm transition-colors",
                      activeSection === link.href
                        ? "text-foreground bg-foreground/5"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="border-border/50 mt-2 flex flex-col gap-2 border-t pt-3"
                >
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/music"
                        className="bg-gold text-primary-foreground font-body rounded-full px-5 py-2.5 text-center text-sm font-medium"
                      >
                        Go to App
                      </Link>
                      <div className="flex justify-center py-1">
                        <ProfileDropdown />
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

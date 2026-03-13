"use client"

import {
  ArrowRight01Icon,
  Logout01Icon,
  UserIcon,
  // @ts-expect-error - hugeicons moduleResolution mismatch
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

export function ProfileDropdown() {
  const router = useRouter()
  const { data: sessionData } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const user = sessionData?.user
  const userImage = user?.image
  const userName = user?.name
  const userEmail = user?.email

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  // Don't render if no user
  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={cn(
          "border-border bg-background/80 flex items-center gap-2 rounded-full border p-1 pr-3 transition-all dark:border-white/10 dark:bg-black/35",
          "hover:border-gold/30 hover:bg-accent/10 dark:hover:bg-black/50",
          isOpen && "border-gold/30 bg-accent/10 dark:bg-black/50"
        )}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        {userImage ? (
          <Image
            src={userImage}
            alt={userName || "Profile"}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="bg-gold/20 flex size-8 items-center justify-center rounded-full">
            <HugeiconsIcon icon={UserIcon} className="text-gold size-4" />
          </div>
        )}
        <span className="text-foreground/80 hidden text-sm sm:inline">{userName || "My Profile"}</span>
        <svg
          className={cn("text-muted-foreground size-3 transition-transform", isOpen && "rotate-180")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "border-border bg-card absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border shadow-xl transition-all dark:border-white/10 dark:bg-[#0a0a0a]",
          "invisible translate-y-2 opacity-0",
          isOpen && "visible translate-y-0 opacity-100"
        )}
      >
        {/* User Info */}
        <div className="border-border border-b px-4 py-3">
          {userName && <p className="text-foreground truncate text-sm font-medium">{userName}</p>}
          {userEmail && <p className="text-muted-foreground truncate text-xs">{userEmail}</p>}
        </div>

        {/* Menu Items */}
        <div className="p-1">
          <button
            onClick={() => {
              setIsOpen(false)
              router.push("/profile")
            }}
            className="text-foreground/80 hover:bg-accent/60 hover:text-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
          >
            <HugeiconsIcon icon={UserIcon} className="size-4" />
            My Profile
          </button>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <HugeiconsIcon icon={Logout01Icon} className="size-4" />
            Sign out
            <HugeiconsIcon icon={ArrowRight01Icon} className="ml-auto size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

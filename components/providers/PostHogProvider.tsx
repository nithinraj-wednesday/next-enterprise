"use client"

import posthog from "posthog-js"
import { PostHogProvider as PostHogProviderReact } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN
      if (token) {
        posthog.init(token, {
          api_host: "/ingest",
          ui_host: "https://eu.posthog.com",
          capture_pageview: false,
          capture_exceptions: true,
        })
      }
    }
  }, [])

  return <PostHogProviderReact client={posthog}>{children}</PostHogProviderReact>
}

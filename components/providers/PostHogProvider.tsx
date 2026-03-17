"use client"

import posthog from "posthog-js"
import { PostHogProvider as PostHogProviderReact } from "posthog-js/react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProviderReact client={posthog}>{children}</PostHogProviderReact>
}

"use client"

import posthogClient from "posthog-js"
import { PostHogProvider as PostHogProviderReact } from "posthog-js/react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProviderReact client={posthogClient}>{children}</PostHogProviderReact>
}

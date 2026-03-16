import { PostHog } from "posthog-node"

export function getPostHogClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN
  if (!token) {
    console.error("PostHog token is missing. Analytics will be disabled.")
    return null
  }

  const client = new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return client
}

import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
})

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  ;(window as unknown as Record<string, unknown>).posthog = posthog
}

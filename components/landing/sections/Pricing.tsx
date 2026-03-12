import Link from "next/link"
import { ScrollReveal } from "../ScrollReveal"

const FREE_FEATURES = [
  "Unlimited searches",
  "30-second previews",
  "All genres & eras",
  "Grid & list views",
  "Keyboard shortcuts",
  "Shuffle & repeat",
]

const PRO_FEATURES = [
  "Everything in Free",
  "Full-length tracks",
  "Offline listening",
  "Custom playlists",
  "Ad-free experience",
  "Priority support",
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <span className="font-body text-gold mb-4 inline-block text-xs tracking-[0.2em] uppercase">Pricing</span>
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Start free, <span className="text-gold italic">stay free</span>
          </h2>
          <p className="font-body text-muted-foreground mx-auto mt-4 max-w-lg text-base">
            ObsidianSound is completely free to use. No credit card, no trial period, no limits.
          </p>
        </ScrollReveal>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <ScrollReveal>
            <div className="border-gold/30 bg-gold/[0.03] relative rounded-2xl border p-6 shadow-[0_0_40px_-10px_var(--gold-glow)] sm:p-8">
              {/* Badge */}
              <div className="absolute -top-3 left-6">
                <span className="bg-gold text-primary-foreground font-body rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="font-display text-foreground text-xl font-bold">Free</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-foreground text-4xl font-bold">$0</span>
                  <span className="font-body text-muted-foreground text-sm">/ forever</span>
                </div>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg
                      className="text-gold size-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-body text-foreground/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/music"
                className="bg-gold text-primary-foreground font-body flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition-all hover:shadow-[0_0_20px_-5px_var(--gold-glow)] hover:brightness-110"
              >
                Start Listening
              </Link>
            </div>
          </ScrollReveal>

          {/* Pro Plan */}
          <ScrollReveal delay={120}>
            <div className="border-border bg-surface-elevated/50 relative rounded-2xl border p-6 sm:p-8">
              {/* Coming soon badge */}
              <div className="absolute -top-3 left-6">
                <span className="bg-muted text-muted-foreground font-body rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase">
                  Coming Soon
                </span>
              </div>

              <div className="mb-6">
                <h3 className="font-display text-foreground text-xl font-bold">Pro</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-muted-foreground text-4xl font-bold">$9</span>
                  <span className="font-body text-muted-foreground text-sm">/ month</span>
                </div>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg
                      className="text-muted-foreground size-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-body text-muted-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="bg-muted text-muted-foreground font-body flex w-full cursor-not-allowed items-center justify-center rounded-full py-3 text-sm font-medium"
              >
                Notify Me
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

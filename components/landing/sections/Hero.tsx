"use client"

import Link from "next/link"
import { useFeatureFlagEnabled, useFeatureFlagPayload } from "posthog-js/react"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "../ScrollReveal"

interface CtaPayload {
  text?: string
  style?: "diamond" | "emerald" | "gold"
}

export function Hero() {
  const isCtaVariantEnabled = useFeatureFlagEnabled("cta-variant")
  const ctaPayload = useFeatureFlagPayload("cta-variant") as CtaPayload | undefined

  const buttonText = ctaPayload?.text || (isCtaVariantEnabled ? "Discover Premium Music" : "Start Listening — Free")
  const buttonStyle = ctaPayload?.style || (isCtaVariantEnabled ? "diamond" : "gold")

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="landing-hero-gradient absolute inset-0" />
      <div className="noise-overlay" />

      {/* Floating decorative orbs */}
      <div className="animate-float bg-gold/[0.07] absolute top-[15%] left-[12%] h-64 w-64 rounded-full blur-[100px]" />
      <div className="animate-float-delayed bg-chart-2/[0.09] absolute top-[55%] right-[8%] h-48 w-48 rounded-full blur-[80px]" />
      <div className="animate-float-slow bg-chart-3/[0.07] absolute bottom-[20%] left-[25%] h-56 w-56 rounded-full blur-[90px]" />

      {/* Floating album shapes */}
      <div className="animate-float from-gold/[0.12] to-chart-2/[0.06] absolute top-[16%] left-[6%] hidden h-32 w-32 rotate-[-12deg] rounded-2xl border border-white/[0.04] bg-gradient-to-br sm:block" />
      <div className="animate-float-delayed from-chart-3/[0.1] to-gold/[0.06] absolute top-[10%] right-[10%] hidden h-24 w-24 rotate-[8deg] rounded-xl border border-white/[0.04] bg-gradient-to-br sm:block" />
      <div className="animate-float-slow from-chart-2/[0.1] to-chart-5/[0.06] absolute right-[6%] bottom-[28%] hidden h-28 w-28 rotate-[-5deg] rounded-2xl border border-white/[0.04] bg-gradient-to-br sm:block" />
      <div
        className="animate-float from-gold/[0.08] to-chart-3/[0.05] absolute bottom-[35%] left-[4%] hidden h-20 w-20 rotate-[6deg] rounded-xl border border-white/[0.04] bg-gradient-to-br sm:block"
        style={{ animationDelay: "3s" }}
      />

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(0.78 0.145 75) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-screen-xl grid-rows-[5.5rem_1fr_3rem] px-4 text-center sm:grid-rows-[6rem_1fr_4rem] sm:px-6">
        <div className="row-start-2 flex items-center justify-center">
          <div className="mx-auto w-full max-w-5xl">
            {/* Badge */}
            <ScrollReveal>
              <div className="border-gold/20 bg-gold/[0.05] mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
                <div className="bg-gold size-1.5 animate-pulse rounded-full" />
                <span className="font-body text-gold text-xs tracking-wide">Now streaming · 10M+ songs</span>
              </div>
            </ScrollReveal>

            {/* Headline */}
            <ScrollReveal delay={100}>
              <h1 className="font-display text-foreground text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl lg:text-[5.5rem]">
                The future of
                <br />
                music <span className="text-gold-gradient italic">discovery</span>
              </h1>
            </ScrollReveal>

            {/* Subtext */}
            <ScrollReveal delay={200}>
              <p className="font-body text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                Explore millions of songs with instant 30-second previews. Search artists, albums, and tracks — all in
                one beautifully crafted experience.
              </p>
            </ScrollReveal>

            {/* CTAs */}
            <ScrollReveal delay={300}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/music"
                  className={cn(
                    "font-body relative rounded-full px-8 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-[0.98]",
                    buttonStyle === "emerald" &&
                      "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]",
                    buttonStyle === "diamond" &&
                      "bg-sky-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:bg-sky-300 hover:shadow-[0_0_35px_rgba(56,189,248,0.5)]",
                    buttonStyle === "gold" &&
                      "bg-gold text-primary-foreground hover:shadow-[0_0_30px_-5px_var(--gold-glow)] hover:brightness-110",
                    isCtaVariantEnabled &&
                      "overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-white/10 before:opacity-0 hover:before:opacity-100"
                  )}
                >
                  {buttonText}
                </Link>
                <a
                  href="#how-it-works"
                  className="font-body text-muted-foreground hover:text-foreground hover:border-gold/30 border-border rounded-full border px-8 py-3.5 text-sm font-medium transition-all"
                >
                  See How It Works
                </a>
              </div>
            </ScrollReveal>

            {/* Stats */}
            <ScrollReveal delay={400}>
              <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12">
                {[
                  { value: "10M+", label: "Songs" },
                  { value: "30s", label: "Previews" },
                  { value: "100%", label: "Free" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="font-display text-foreground text-2xl font-bold sm:text-3xl">{stat.value}</div>
                    <div className="font-body text-muted-foreground mt-1 text-xs tracking-wide uppercase">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="from-background absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t to-transparent" />
    </section>
  )
}

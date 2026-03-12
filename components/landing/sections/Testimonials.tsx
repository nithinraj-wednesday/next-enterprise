import { ScrollReveal } from "../ScrollReveal"

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Music Producer",
    quote:
      "ObsidianSound completely changed how I discover samples and inspiration. The instant previews save me hours every week.",
    initials: "SC",
  },
  {
    name: "Marcus Rivera",
    role: "DJ & Radio Host",
    quote:
      "I use this before every set to find fresh tracks. The search is lightning fast, and the keyboard shortcuts make me feel like a power user.",
    initials: "MR",
  },
  {
    name: "Emma Lindström",
    role: "Playlist Curator",
    quote: "Finally, a music discovery tool that feels as premium as the music itself. The UI is absolutely gorgeous.",
    initials: "EL",
  },
]

const STATS = [
  { value: "10M+", label: "Songs available" },
  { value: "50K+", label: "Daily searches" },
  { value: "4.9★", label: "User rating" },
  { value: "<100ms", label: "Search speed" },
]

export function Testimonials() {
  return (
    <section className="bg-surface-elevated/30 relative py-24 sm:py-32">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <span className="font-body text-gold mb-4 inline-block text-xs tracking-[0.2em] uppercase">
            Loved By Listeners
          </span>
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            What people are <span className="text-gold italic">saying</span>
          </h2>
        </ScrollReveal>

        <div className="mb-16 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="glass-card group hover:border-gold/20 flex h-full flex-col rounded-2xl p-6 transition-all duration-300 sm:p-8">
                {/* Stars */}
                <div className="text-gold mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="font-body text-foreground/90 mb-6 flex-1 text-sm leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className="bg-gold/[0.1] text-gold flex size-10 items-center justify-center rounded-full text-xs font-semibold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-display text-foreground text-sm font-semibold">{t.name}</div>
                    <div className="font-body text-muted-foreground text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Stats bar */}
        <ScrollReveal>
          <div className="glass-card grid grid-cols-2 gap-6 rounded-2xl p-6 sm:p-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-gold text-2xl font-bold sm:text-3xl">{stat.value}</div>
                <div className="font-body text-muted-foreground mt-1 text-xs tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

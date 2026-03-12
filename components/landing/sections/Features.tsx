import { ScrollReveal } from "../ScrollReveal"

const FEATURES = [
  {
    title: "Instant Previews",
    description: "Hit play on any track and hear a 30-second preview instantly. No sign-up, no waiting.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M6 4v16l14-8L6 4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Millions of Songs",
    description: "Search the entire iTunes catalog — over 10 million songs from every genre and era.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Smart Discovery",
    description: "Curated search suggestions help you explore classical, chill, hip hop, indie, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    title: "Keyboard First",
    description: "Press / to search, Space to play or pause. Designed for power users who move fast.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h0M10 10h0M14 10h0M18 10h0M8 14h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Your View",
    description: "Switch between immersive grid view and compact list view with a single click.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Smart Playback",
    description: "Shuffle, repeat one or all, and fine-tune volume. Full playback control at your fingertips.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <span className="font-body text-gold mb-4 inline-block text-xs tracking-[0.2em] uppercase">Features</span>
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Everything you need to <span className="text-gold italic">explore</span>
          </h2>
          <p className="font-body text-muted-foreground mx-auto mt-4 max-w-lg text-base">
            A premium music discovery experience, crafted for listeners who demand more.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80}>
              <div className="glass-card group hover:border-gold/20 rounded-2xl p-6 transition-all duration-300 sm:p-8">
                <div className="bg-gold/[0.08] text-gold group-hover:bg-gold/[0.15] mb-4 flex size-12 items-center justify-center rounded-xl transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-display text-foreground mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

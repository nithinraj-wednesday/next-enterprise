import { ScrollReveal } from "../ScrollReveal"

const STEPS = [
  {
    number: "01",
    title: "Search",
    description:
      "Type any artist, song, or album name. Our search covers the entire iTunes catalog with instant results.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-7">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Preview",
    description: "Click any track to hear a 30-second preview instantly. No sign-up needed, no interruptions.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7">
        <path d="M6 4v16l14-8L6 4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Discover",
    description: "Explore curated suggestions, browse genres, and build your musical vocabulary one preview at a time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-7">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <span className="font-body text-gold mb-4 inline-block text-xs tracking-[0.2em] uppercase">How It Works</span>
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Three steps to <span className="text-gold italic">your sound</span>
          </h2>
          <p className="font-body text-muted-foreground mx-auto mt-4 max-w-lg text-base">
            No accounts, no subscriptions, no friction. Just music.
          </p>
        </ScrollReveal>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="via-gold/20 absolute top-[4.5rem] right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-r from-transparent to-transparent lg:block" />

          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 120}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Number + Icon */}
                  <div className="relative mb-6">
                    <div className="border-gold/20 bg-gold/[0.06] text-gold hover:bg-gold/[0.1] relative z-10 flex size-[5.5rem] items-center justify-center rounded-2xl border transition-colors">
                      {step.icon}
                    </div>
                    <div className="border-gold/30 bg-background absolute -top-2 -right-2 z-20 flex size-7 items-center justify-center rounded-full border">
                      <span className="font-display text-gold text-[10px] font-bold">{step.number}</span>
                    </div>
                  </div>

                  <h3 className="font-display text-foreground mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="font-body text-muted-foreground max-w-xs text-sm leading-relaxed">{step.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

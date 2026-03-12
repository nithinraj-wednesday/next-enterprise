"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "../ScrollReveal"

const FAQ_ITEMS = [
  {
    question: "What is ObsidianSound?",
    answer:
      "ObsidianSound is a free music discovery platform that lets you search and preview millions of songs from the iTunes catalog. You can listen to 30-second previews of any track, explore genres, and discover new music — all in a beautifully designed interface.",
  },
  {
    question: "Is it really completely free?",
    answer:
      "Yes, 100% free. ObsidianSound uses the iTunes Search API which provides free access to song previews. There are no hidden costs, no credit card required, and no trial periods. Just open the app and start listening.",
  },
  {
    question: "Where does the music come from?",
    answer:
      "All music comes from the iTunes catalog, which includes over 10 million songs from major and independent labels worldwide. The 30-second previews are provided by Apple's public API.",
  },
  {
    question: "Can I listen to full songs?",
    answer:
      "Currently, ObsidianSound provides 30-second previews which are great for discovery. If you find a song you love, you can purchase or stream the full version through iTunes or Apple Music. Full-length playback is planned for our upcoming Pro tier.",
  },
  {
    question: "What devices are supported?",
    answer:
      "ObsidianSound works in any modern web browser — Chrome, Firefox, Safari, and Edge on desktop and mobile. It's fully responsive, so you get a great experience on any screen size.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No account is needed to search and preview music. However, creating a free account will unlock additional features like saving favorites and personalized recommendations in the future.",
  },
]

export function FAQ() {
  const [openItem, setOpenItem] = useState<string>("")

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <span className="font-body text-gold mb-4 inline-block text-xs tracking-[0.2em] uppercase">FAQ</span>
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Got <span className="text-gold italic">questions?</span>
          </h2>
          <p className="font-body text-muted-foreground mx-auto mt-4 max-w-lg text-base">
            Everything you need to know about ObsidianSound.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <Accordion.Root
            type="single"
            collapsible
            value={openItem}
            onValueChange={setOpenItem}
            className="mx-auto max-w-2xl"
          >
            {FAQ_ITEMS.map((item, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="border-border/50 border-b last:border-b-0">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-5 text-left transition-colors">
                    <span className="font-display text-foreground group-hover:text-gold pr-4 text-base font-semibold sm:text-lg">
                      {item.question}
                    </span>
                    <svg
                      className={cn(
                        "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
                        openItem === `item-${i}` && "text-gold rotate-45"
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                  <p className="font-body text-muted-foreground pr-8 pb-5 text-sm leading-relaxed">{item.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </ScrollReveal>
      </div>
    </section>
  )
}

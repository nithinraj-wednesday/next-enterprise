import Image from "next/image"
import { LandingNav } from "@/components/landing/LandingNav"
import { FAQ } from "@/components/landing/sections/FAQ"
import { Features } from "@/components/landing/sections/Features"
import { Footer } from "@/components/landing/sections/Footer"
import { Hero } from "@/components/landing/sections/Hero"
import { HowItWorks } from "@/components/landing/sections/HowItWorks"
import { Pricing } from "@/components/landing/sections/Pricing"
import { Testimonials } from "@/components/landing/sections/Testimonials"

export default function Home() {
  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />
      <LandingNav />
      <Hero />
      <div className="section-glow-divider" />
      <Features />
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="relative mx-auto max-w-5xl">
            {/* Ambient glow */}
            <div className="bg-gold/10 absolute -inset-4 rounded-[2rem] blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
              <Image
                src="/images/image.png"
                alt="App Preview"
                width={1200}
                height={800}
                className="h-auto w-full rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      <div className="section-glow-divider" />
      <HowItWorks />
      <Testimonials />
      <div className="section-glow-divider" />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}

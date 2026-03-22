import "styles/tailwind.css"
import { Metadata } from "next"
import { DM_Sans, Syne } from "next/font/google"
import { Toaster } from "sonner"
import { PostHogProvider } from "@/components/providers/PostHogProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ObsidianSound — Music Discovery",
  description:
    "Discover and preview millions of songs from the iTunes catalog. Search artists, albums, and tracks with instant 30-second previews.",
  keywords: ["music", "discovery", "streaming", "iTunes", "preview", "search"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(syne.variable, dmSans.variable)} suppressHydrationWarning>
      <body className="font-body antialiased">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "!bg-card !border-border !shadow-lg !shadow-gold-glow/10 !rounded-xl !font-body",
                  title: "!text-foreground !font-medium",
                  description: "!text-muted-foreground",
                  success: "!border-gold/30 [&_[data-icon]_svg]:!text-gold [&_[data-icon]_svg]:!fill-gold",
                  error: "!border-destructive/30 [&_[data-icon]_svg]:!text-destructive [&_[data-icon]_svg]:!fill-destructive",
                  actionButton: "!bg-gold !text-background !font-medium",
                  closeButton: "!text-muted-foreground hover:!text-foreground !border-border",
                },
              }}
            />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}

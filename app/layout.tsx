import "styles/tailwind.css"
import { Noto_Serif } from "next/font/google"
import { cn } from "@/lib/utils"

const notoSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-serif", notoSerif.variable)}>
      <body>{children}</body>
    </html>
  )
}

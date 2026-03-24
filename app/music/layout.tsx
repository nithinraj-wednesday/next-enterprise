import { MusicSidebarLayout } from "@/components/music/MusicSidebar"

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return <MusicSidebarLayout>{children}</MusicSidebarLayout>
}

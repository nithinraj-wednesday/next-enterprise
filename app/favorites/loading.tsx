"use client"

export default function FavoritesLoading() {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="noise-overlay" />

      {/* Header skeleton — matches MusicAppHeader area */}
      <header className="relative pt-8 pb-4 sm:pt-12 sm:pb-6">
        <div className="relative z-30 mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="skeleton-shimmer h-8 w-48 rounded-full" />
            <div className="skeleton-shimmer h-5 w-72 rounded-full" />
            <div className="skeleton-shimmer h-10 w-full max-w-md rounded-xl" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10">
        {/* "Your Library" title + Create Playlist button */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="skeleton-shimmer h-8 w-40 rounded-full" />
            <div className="skeleton-shimmer h-4 w-80 rounded-full" />
          </div>
          <div className="skeleton-shimmer h-10 w-36 rounded-lg" />
        </div>

        {/* Horizontal playlist cards */}
        <div className="mb-6 flex gap-3 overflow-hidden pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-[7.5rem] w-[min(85vw,20rem)] shrink-0 rounded-xl" />
          ))}
        </div>

        {/* Track list card */}
        <div className="glass-card border-border/30 overflow-hidden rounded-[2rem] border">
          {/* Card header */}
          <div className="border-border/50 border-b p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="skeleton-shimmer h-7 w-44 rounded-full" />
                <div className="skeleton-shimmer h-4 w-20 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-9 w-52 rounded-xl" />
            </div>
          </div>

          {/* Table header */}
          <div className="flex items-center gap-4 px-3 py-3">
            <span className="skeleton-shimmer h-3 w-6 rounded" />
            <span className="skeleton-shimmer size-10 shrink-0 rounded" />
            <span className="skeleton-shimmer h-3 flex-1 rounded" />
            <span className="skeleton-shimmer hidden h-3 w-16 rounded md:block" />
            <span className="skeleton-shimmer ml-4 h-3 w-12 shrink-0 rounded" />
          </div>

          {/* Track rows */}
          <div className="flex flex-col gap-1 px-3 pb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl py-2">
                <span className="skeleton-shimmer h-4 w-6 rounded" />
                <span className="skeleton-shimmer size-10 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="skeleton-shimmer h-4 w-40 rounded" />
                  <div className="skeleton-shimmer h-3 w-28 rounded" />
                </div>
                <span className="skeleton-shimmer hidden h-3 w-16 rounded md:block" />
                <span className="skeleton-shimmer ml-4 h-3 w-10 shrink-0 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

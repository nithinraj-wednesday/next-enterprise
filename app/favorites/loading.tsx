export default function FavoritesLoading() {
  return (
    <div className="bg-background relative min-h-screen">
      <div className="noise-overlay" />

      <div className="hero-gradient relative pt-12 pb-10">
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-4">
            <div className="skeleton-shimmer h-10 w-56 rounded-full" />
            <div className="skeleton-shimmer h-24 max-w-2xl rounded-[2rem]" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="skeleton-shimmer h-7 w-32 rounded-full" />
              <div className="skeleton-shimmer h-32 w-full max-w-2xl rounded-[2rem]" />
            </div>
            <div className="skeleton-shimmer min-h-[280px] rounded-[2rem]" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <div className="glass-card overflow-hidden rounded-[2rem] p-4">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton-shimmer h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

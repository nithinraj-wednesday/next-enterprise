"use client"

import { Camera, Loader2, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface AvatarUploadProps {
  currentImage: string | null
  initials: string
  userName: string
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function AvatarUpload({ currentImage, initials, userName }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const session = useSession()

  const displayImage = previewUrl || currentImage

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image (JPEG, PNG, WebP, or GIF)")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be less than 5MB")
      return
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      setIsUploading(true)

      // Upload via FormData to server
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || "Upload failed")
      }

      const data = (await response.json()) as { url: string }

      // Transform blob URL to proxy URL for private blob access
      const proxyUrl = data.url.includes("blob.vercel-storage.com")
        ? `/api/avatar/image?url=${encodeURIComponent(data.url)}`
        : data.url
      setPreviewUrl(proxyUrl)

      // Refetch session to update client-side session data (for other components)
      await session.refetch()

      // Refresh the page to get updated session data
      router.refresh()
    } catch (uploadError) {
      console.error("Upload error:", uploadError)
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed")
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
      // Reset input so the same file can be selected again if needed
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click()
    }
  }

  const clearError = () => setError(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-white/15 transition-all hover:border-white/30 focus:ring-2 focus:ring-white/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Upload profile picture"
      >
        {displayImage ? (
          <Image src={displayImage} alt={`${userName} profile image`} fill className="object-cover" unoptimized />
        ) : (
          <div className="from-gold/30 to-gold/10 text-foreground flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl font-semibold">
            {initials}
          </div>
        )}

        {/* Overlay on hover/loading */}
        <div
          className={`bg-background/70 absolute inset-0 flex items-center justify-center transition-opacity ${
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isUploading ? (
            <Loader2 className="text-foreground size-6 animate-spin" />
          ) : (
            <Camera className="text-foreground size-6" />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        aria-label="Select profile picture file"
      />

      <p className="text-muted-foreground text-xs">Click to upload a new photo</p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <span>{error}</span>
          <Button variant="ghost" size="icon-xs" onClick={clearError} aria-label="Dismiss error">
            <X className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

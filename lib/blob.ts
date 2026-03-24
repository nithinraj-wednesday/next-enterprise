/**
 * Get a displayable URL for an avatar image.
 * For private Vercel Blob URLs, returns a proxy URL through our API.
 * For other URLs (GitHub, Google, etc.), returns as-is.
 */
export function getAvatarUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null

  // For Vercel Blob URLs, use our proxy endpoint
  if (imageUrl.includes("blob.vercel-storage.com")) {
    return `/api/avatar/image?url=${encodeURIComponent(imageUrl)}`
  }

  // Return other URLs (GitHub, Google, etc.) as-is
  return imageUrl
}

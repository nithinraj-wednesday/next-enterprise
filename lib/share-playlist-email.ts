function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

interface SharePlaylistEmailContentArgs {
  playlistName: string
  shareUrl: string
  sharerName: string
}

export function createSharePlaylistEmailContent({ playlistName, shareUrl, sharerName }: SharePlaylistEmailContentArgs) {
  const safePlaylistName = escapeHtml(playlistName)
  const safeSharerName = escapeHtml(sharerName)
  const safeShareUrl = escapeHtml(shareUrl)
  const subject = `${sharerName} shared "${playlistName}" with you`
  const text = [
    `${sharerName} shared the playlist "${playlistName}" with you.`,
    "",
    "Open the public playlist here:",
    shareUrl,
    "",
    "You can preview tracks and save it to your own library.",
  ].join("\n")
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p><strong>${safeSharerName}</strong> shared the playlist <strong>${safePlaylistName}</strong> with you.</p>
      <p>You can preview tracks and save it to your own library.</p>
      <p>
        <a
          href="${safeShareUrl}"
          style="display: inline-block; border-radius: 9999px; background: #111827; color: #ffffff; padding: 12px 18px; text-decoration: none;"
        >
          Open Playlist
        </a>
      </p>
      <p style="color: #4b5563; font-size: 14px;">Or copy this link into your browser: ${safeShareUrl}</p>
    </div>
  `.trim()

  return {
    subject,
    text,
    html,
  }
}

export function getEmailDomain(email: string) {
  const [, domain = "unknown"] = email.split("@")
  return domain.toLowerCase()
}

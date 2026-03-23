import { Copy, Globe2, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Playlist } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SharePlaylistDialogProps {
  playlist: Playlist | null
  isUpdatingShare: boolean
  isSendingShareEmail: boolean
  shareEmail: string
  shareEmailError: string | null
  onCopyShareLink: (playlist: Playlist) => void | Promise<void>
  onShareEmailChange: (value: string) => void
  onSendShareEmail: () => void | Promise<void>
  onPublishPlaylist: () => void | Promise<void>
  onClose: () => void
}

export function SharePlaylistDialog({
  playlist,
  isUpdatingShare,
  isSendingShareEmail,
  shareEmail,
  shareEmailError,
  onCopyShareLink,
  onShareEmailChange,
  onSendShareEmail,
  onPublishPlaylist,
  onClose,
}: SharePlaylistDialogProps) {
  const isBusy = isUpdatingShare || isSendingShareEmail
  const isPublic = Boolean(playlist?.isPublic)
  const shareUrl = playlist?.shareUrl

  return (
    <>
      <DialogHeader>
        <DialogTitle>Share playlist</DialogTitle>
        <DialogDescription>
          {isPublic
            ? "This playlist has a stable public link. Anyone with the link can save it into their own library."
            : "Publish this playlist to create a public, read-only link anyone can open."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="bg-secondary/40 border-border/50 flex items-start justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <p className="text-foreground font-medium">{playlist?.name ?? "Playlist"}</p>
            <p className="text-muted-foreground text-sm">
              {isPublic
                ? "Anyone with the link can preview tracks and save this playlist to their own library."
                : "Only you can see this playlist right now."}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase",
              isPublic
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-border/60 bg-secondary/55 text-muted-foreground"
            )}
          >
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        {isPublic && shareUrl ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="share-playlist-link">Share link</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="share-playlist-link" value={shareUrl} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (playlist) {
                      void onCopyShareLink(playlist)
                    }
                  }}
                >
                  <Copy data-icon="inline-start" />
                  Copy
                </Button>
              </div>
            </div>

            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void onSendShareEmail()
              }}
            >
              <Label htmlFor="share-playlist-email">Recipient email</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="share-playlist-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={shareEmail}
                  onChange={(event) => onShareEmailChange(event.target.value)}
                  aria-invalid={shareEmailError ? true : undefined}
                  disabled={isBusy}
                />
                <Button type="submit" disabled={isBusy}>
                  {isSendingShareEmail ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail data-icon="inline-start" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
              {shareEmailError ? <p className="text-destructive text-sm">{shareEmailError}</p> : null}
            </form>
          </>
        ) : null}
      </div>

      <DialogFooter>
        {!isPublic ? (
          <Button
            type="button"
            onClick={() => void onPublishPlaylist()}
            disabled={isBusy}
            className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/15"
          >
            {isUpdatingShare ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe2 data-icon="inline-start" />
                Publish Playlist
              </>
            )}
          </Button>
        ) : null}

        <Button type="button" variant="ghost" onClick={onClose} disabled={isBusy}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}

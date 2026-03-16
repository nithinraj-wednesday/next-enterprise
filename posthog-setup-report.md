<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the ObsidianSound Next.js App Router project. The integration includes client-side event tracking with `posthog-js`, server-side event tracking with `posthog-node`, user identification on sign-in/sign-up, automatic exception capture, and a reverse proxy for improved reliability. This session extended the existing integration by filling gaps in server-side event coverage and adding a view mode change event.

**Files modified in this session:**
- `app/music/page.tsx` — Added `view_mode_changed` event when switching between grid and list view
- `app/api/favorites/[trackId]/route.ts` — Added server-side `favorite_removed` event
- `app/api/playlists/[id]/route.ts` — Added server-side `playlist_renamed` and `playlist_deleted` events
- `app/api/playlists/[id]/tracks/route.ts` — Added server-side `playlist_track_added` and `playlist_track_removed` events

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully created a new account via email/password | `app/sign-up/page.tsx` |
| `user_signed_in` | User successfully signed in via email/password | `app/sign-in/page.tsx` |
| `user_signed_in_social` | User initiated social sign-in (GitHub or Google) | `app/sign-in/page.tsx`, `app/sign-up/page.tsx` |
| `music_searched` | User submitted a music search query | `app/music/page.tsx` |
| `track_played` | User started playing a track | `app/music/page.tsx` |
| `view_mode_changed` | User switched between grid and list view | `app/music/page.tsx` |
| `track_favorited` | User added a track to their favorites (client + server) | `app/music/page.tsx`, `app/api/favorites/route.ts` |
| `track_unfavorited` | User removed a track from favorites on the music page | `app/music/page.tsx` |
| `favorite_removed` | User removed a track from liked songs (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/favorites/[trackId]/route.ts` |
| `playlist_created` | User successfully created a new playlist (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/playlists/route.ts` |
| `playlist_renamed` | User renamed a playlist (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/playlists/[id]/route.ts` |
| `playlist_deleted` | User deleted a playlist (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/playlists/[id]/route.ts` |
| `track_added_to_playlist` | User added a track to a playlist (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/playlists/[id]/tracks/route.ts` |
| `track_removed_from_playlist` | User removed a track from a playlist (client + server) | `components/music/FavoritesPageClient.tsx`, `app/api/playlists/[id]/tracks/route.ts` |
| `playlist_track_added` | Server-side: track added to playlist | `app/api/playlists/[id]/tracks/route.ts` |
| `playlist_track_removed` | Server-side: track removed from playlist | `app/api/playlists/[id]/tracks/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/142090/dashboard/570916)
- [Sign-up to first track played](https://eu.posthog.com/project/142090/insights/PPXCISvu)
- [Music engagement over time](https://eu.posthog.com/project/142090/insights/sbLJUzqT)
- [New sign-ups vs returning sign-ins](https://eu.posthog.com/project/142090/insights/cx2UsItx)
- [Listener to collector funnel](https://eu.posthog.com/project/142090/insights/HAqExEqs)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

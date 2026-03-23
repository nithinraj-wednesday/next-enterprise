import { Resend } from "resend"
import { env } from "@/env.mjs"

export const SHARE_PLAYLIST_FROM_EMAIL = "Music Discovery <onboarding@resend.dev>"

export const resend = new Resend(env.RESEND_API_KEY)

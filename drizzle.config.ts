import type { Config } from "drizzle-kit"
import { env } from "./env.mjs"

export default {
  schema: "./lib/db-schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
} satisfies Config

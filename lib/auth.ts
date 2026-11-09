import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db.ts";

// On Vercel, fall back to the project's production URL if BETTER_AUTH_URL isn't set.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const auth = betterAuth({
  baseURL,
  database: db,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // Lets server actions set the login cookie. Must stay the last plugin.
  plugins: [nextCookies()],
});

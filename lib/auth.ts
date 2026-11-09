import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// On Vercel, fall back to the project's production URL if BETTER_AUTH_URL isn't set.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const auth = betterAuth({
  baseURL,
  // DATABASE_URL is the Neon connection string Vercel added to the project.
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // Lets server actions set the login cookie. Must stay the last plugin.
  plugins: [nextCookies()],
});

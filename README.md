# Bebop Buddy

Your AI jazz partner. Created by Nick Gombocz for ENGR 310.

Built with Next.js, Better Auth (email + password login), and a Neon Postgres database, deployed on Vercel.

## Run it locally

1. Install Node.js (LTS) from https://nodejs.org.
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill it in:
   - `DATABASE_URL`: from Vercel → your project → Storage → the Neon database → `.env.local` tab.
   - `BETTER_AUTH_SECRET`: any long random string (keep it secret).
   - `DEMO_EMAIL` / `DEMO_PASSWORD`: the grader demo account.
4. `npm run db:migrate` creates the login tables in Neon (run again whenever auth settings change).
5. `npm run db:seed-demo` creates the demo account.
6. `npm run dev` and open http://localhost:3000.

## Deploying on Vercel

Pushing to `main` deploys automatically. The project needs these environment variables
(Vercel → Settings → Environment Variables):

| Name | Value |
|---|---|
| `DATABASE_URL` | Added automatically when the Neon database was connected |
| `BETTER_AUTH_SECRET` | The same random secret as in `.env.local` |
| `BETTER_AUTH_URL` | Optional: your site's URL, e.g. `https://your-app.vercel.app` |

## Pages

- `/`: homepage
- `/signup`: create an account
- `/login`: log in
- `/dashboard`: logged-in area (redirects to `/login` if not logged in)

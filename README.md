# Болгарский с нуля

Duolingo-style PWA that teaches Bulgarian to Russian speakers.
Stack: React + Vite + TypeScript, Tailwind, Supabase, Cloudflare Pages.

## Local dev
```
npm install
cp .env.example .env   # fill in Supabase keys (optional: without them the app runs as guest)
npm run dev
```
Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run e2e`.

## Supabase setup
1. Create a project at supabase.com.
2. SQL Editor: paste and run each file in `supabase/migrations/` in order.
3. Authentication > URL Configuration: set Site URL to your deployed URL (add `http://localhost:5173` to Redirect URLs).
4. Project Settings > API: copy the Project URL and anon key into `.env` (and Cloudflare Pages env vars).

## Deploy (Cloudflare Pages)
Connect the GitHub repo. Build command `npm run build`, output directory `dist`.
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.

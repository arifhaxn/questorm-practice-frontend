# QueueStorm Command Center — Frontend

React + Vite + TypeScript SPA. Talks **only** to the deployed backend via
`VITE_API_BASE_URL`. Tailwind for styling, Recharts for analytics charts.

## Local dev

```bash
cd frontend
npm install
# Edit .env: set VITE_API_BASE_URL to the LIVE backend URL (no trailing slash)
npm run dev
```

Open http://localhost:5173. The Dashboard shows a green **"backend healthy"**
badge once `/health` responds from the live backend.

## Structure

- `src/api/types.ts` — mirrors `backend/app/schemas.py` exactly (contract is law).
- `src/api/client.ts` — typed fetch helper per endpoint, reads `VITE_API_BASE_URL`.
- `src/components/` — `Loading`, `ErrorBanner`, `AppLayout` (left-nav), `PageHeader`.
- `src/pages/` — Dashboard + Queue, Ticket Detail, Analyze, Batch, Analytics.

Routes: `/` (Dashboard), `/queue`, `/tickets/:ticketId`, `/analyze`,
`/analytics`, `/batch`.

## Deploy

### Vercel
1. Push the repo. In Vercel: **New Project** → import it.
2. **Root Directory** = `frontend`. Framework preset: **Vite** (Build `npm run build`,
   Output `dist`).
3. **Settings → Environment Variables**: add `VITE_API_BASE_URL` = the live backend
   URL (Production + Preview). No trailing slash.
4. **Deploy**. `vercel.json` already rewrites all paths to `index.html` (SPA routing).
5. After deploy, open the site → Dashboard badge should be green.

### Netlify
1. **Add new site → Import an existing project**, pick the repo.
2. **Base directory** = `frontend`. Build command `npm run build`, publish `frontend/dist`
   (or `dist` when base is set). `netlify.toml` already sets these + SPA redirect.
3. **Site settings → Environment variables**: add `VITE_API_BASE_URL` = live backend URL.
4. **Deploy site**, then confirm the green health badge.

> Env vars are baked in at build time. After changing `VITE_API_BASE_URL`,
> trigger a **redeploy** — restarting is not enough on the host.

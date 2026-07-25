# Website

Static personal site + a Next.js sub-app, deployed together.

## Structure

- Root: static HTML/CSS/JS pages (`dashboard.html`, `money.html`, `planner.html`, `notes.html`, `login.html`, etc.) with shared logic in `dashboard.js` and `dashboard.css`.
- `supabase.js` — Supabase client/config used by the static pages.
- `contact.php`, `stats.php`, `track.php`, `log-error.php` — small PHP backend endpoints (no framework).
- `sw.js`, `manifest.json` — PWA service worker/manifest for the static site.
- `wct-next/` — separate Next.js 14 app (`npm run dev` / `build` / `start` inside that dir). Pages in `wct-next/pages/`, styles in `wct-next/styles/globals.css` (Tailwind).

## Notes

- No build step for the root static site — files are served as-is.
- `dashboard.js` is large (~98KB); prefer targeted `Grep`/line-range `Read` over reading it in full.
- `.claude/settings.json` allows read-only tools (Read/Glob/Grep, `git status/diff/log`, `ls`) without prompting.

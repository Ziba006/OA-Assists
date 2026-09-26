# OA Assist

AI-assisted osteoarthritis assessment platform — frontend.

**Tagline:** AI-assisted osteoarthritis assessment

This repository currently contains the landing page and the scalable frontend
structure only. It is a software prototype: no backend, database, authentication
or AI model integration is included yet.

## Stack

- React 19 (JavaScript / JSX)
- Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- React Router 7
- lucide-react icons

## Design system — Sage + Plum + Cream

All colors are CSS variables defined in the `@theme` block of
`src/index.css`, so the palette can be rethemed in one place.

| Token                       | Value     | Usage                        |
| --------------------------- | --------- | ---------------------------- |
| `--color-sage-900`          | `#24382F` | Sidebar, dark surfaces       |
| `--color-sage-600`          | `#5F6F52` | Secondary sage, active state |
| `--color-sage-300`          | `#A9B8A0` | Light sage, muted dark text  |
| `--color-plum-500`          | `#8B5E83` | Primary accent / CTAs        |
| `--color-plum-700`          | `#68445F` | Primary hover                |
| `--color-plum-300`          | `#D8C3D5` | Soft lavender accent         |
| `--color-surface` / cream   | `#F7F4ED` | Page background              |
| `--color-surface-warm`      | `#FFFDF9` | Cards                        |
| `--color-line`              | `#E4DED3` | Card and section borders     |
| `--color-ink-900`           | `#202820` | Main text                    |
| `--color-ink-500`           | `#667066` | Muted text                   |
| `--color-success-500`       | `#6F9275` | Completed states             |
| `--color-warning-500`       | `#C69A4A` | Warnings                     |
| `--color-error-500`         | `#B85C5C` | Errors                       |

Application pages use the dark sage left sidebar (`src/layouts/AppLayout.jsx`
+ `src/components/AppSidebar.jsx`); public pages keep the landing navbar
(`src/layouts/PublicLayout.jsx`).


## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

## Backend connection

The frontend reads the API base URL from an environment variable, so no URL is
hardcoded in the source:

1. Copy `.env.example` to `.env.local` (already created for local development,
   and git-ignored).
2. Start the backend: `cd ../backend && uvicorn app.main:app --reload`
3. Start the frontend: `npm run dev`

`.env.local` contains:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The signup page (`/signup`) posts to `/api/auth/signup` on that base URL through
`src/services/authService.js`, which uses the shared helper in
`src/services/api.js`. Nothing is stored in localStorage and the password is
never logged or displayed.

## Routes

| Route        | Page                                                |
| ------------ | --------------------------------------------------- |
| `/`          | Landing page                                        |
| `/login`     | Login placeholder                                   |
| `/signup`    | Sign up form, connected to the FastAPI signup API     |
| `/guest`     | Guest session entry (temporary, in-memory)          |
| `/dashboard` | Dashboard placeholder                               |
| `/xray`      | X-ray assessment placeholder                        |
| `/gait`      | Gait assessment placeholder                         |
| `/symptoms`  | Symptom assessment placeholder                     |
| `/reports`   | Reports placeholder                                 |
| `/history`   | Assessment history placeholder                      |
| `/profile`   | Profile placeholder                                 |
| `/settings`  | Settings placeholder                                |

## Project structure

```
src/
  components/        reusable UI (Navbar, Footer, Hero, sections, ui/*)
  layouts/           PublicLayout (marketing) and AppLayout (application)
  pages/             one file per route
  context/           AuthContext, AssessmentContext (in-memory only)
  hooks/             useAuth, useAssessment
  services/          api, xrayService, gaitService (placeholders)
  routes.js          route constants and section anchors
```

## Future integration notes

- Authentication, the database and the AI services are not implemented. Session
  state lives in React memory only, so guest data is never persisted.
- When the backend exists, set `VITE_API_BASE_URL`; `src/services/api.js` reads
  it via `import.meta.env` and throws a clear error until it is configured.
- No API URLs (including localhost) are hardcoded anywhere.

## Deployment

Vercel-ready as a Vite project: build command `npm run build`, output directory
`dist`. `vercel.json` includes the SPA rewrite so client-side routes resolve on
refresh.

## Disclaimer

OA Assist provides AI-assisted preliminary assessment and does not replace
evaluation or diagnosis by a qualified healthcare professional.

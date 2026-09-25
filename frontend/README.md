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

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

## Routes

| Route        | Page                                                |
| ------------ | --------------------------------------------------- |
| `/`          | Landing page                                        |
| `/login`     | Login placeholder                                   |
| `/signup`    | Sign up placeholder                                 |
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

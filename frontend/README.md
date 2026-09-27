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
VITE_API_URL=http://127.0.0.1:8000
```

The signup page (`/signup`) posts to `${VITE_API_URL}/api/auth/signup` and the
login page (`/login`) posts to `${VITE_API_URL}/api/auth/login`, both through
`src/services/authService.js`, which uses the shared helper in
`src/services/api.js`. The password is never logged or displayed.

## Authentication

Login stores the session so a page refresh keeps the user signed in:

| Key                     | Content                                        |
| ----------------------- | ---------------------------------------------- |
| `oa-assist.accessToken` | The JWT from `POST /api/auth/login`            |
| `oa-assist.user`        | Only `{id, fullName, email}`                   |

`src/services/tokenStorage.js` owns both keys. The password, the password hash,
`MONGO_URI` and `JWT_SECRET` are never sent to the browser and are never stored.

- `authRequest(path)` in `src/services/api.js` is the authenticated counterpart
  of `request`. It adds `Authorization: Bearer <access_token>` automatically, so
  a protected call never handles the header itself:

  ```js
  import { getCurrentUser } from '../services/authService'

  const user = await getCurrentUser() // -> GET /api/auth/me with the header
  ```

  There is no Axios in this project, so the equivalent of an Axios request
  interceptor is this wrapper. Switching to Axios later means moving the same
  header logic into an interceptor.
- A `401` clears the stored session and notifies `AuthContext`, which sets the
  user back to `null` so `isAuthenticated` becomes `false`. Redirecting to
  `/login` from there is the next step.
- `AuthContext` is the only source of truth for the session. It exposes
  `status` (`restoring` / `authenticated` / `guest`), `user`, `isAuthenticated`,
  `isAuthenticating`, `signIn`, `signOut` and the guest helpers through the
  `useAuth` hook.
- **Page refresh:** the stored token is never trusted on its own. On load the
  provider calls `GET /api/auth/me` with `Authorization: Bearer <access_token>`.
  A `200` makes the user authenticated and refreshes the stored copy; a `401`
  clears the token and falls back to guest.
- The application sidebar (`src/components/AppSidebar.jsx`) renders the account
  card from that state: the signed-in user's name and email with a **Logout**
  button, or the original "No account connected" card with **Create Account**
  when nobody is signed in. A short "Checking session" state avoids a flash while
  `/api/auth/me` is in flight.
- **Logout** removes the token from localStorage, resets the context to guest and
  navigates to `/login`. There is no server call, because the backend issues
  stateless JWTs and has no logout endpoint. Guest assessment data is left alone.
- **Route guard:** `src/components/RequireAuth.jsx` wraps the application routes
  in `src/App.jsx`. It renders nothing while the session is being restored, lets
  authenticated users and guest sessions through, and redirects anyone else to
  `/login`. So a refresh or a back button after logout cannot land on an app page
  as a signed-out visitor.
- Guest mode is untouched: it never writes to storage, and "Continue as Guest"
  still works from the login page.

## Routes

| Route        | Page                                                |
| ------------ | --------------------------------------------------- |
| `/`          | Landing page                                        |
| `/login`     | Sign in form, connected to the FastAPI JWT login API     |
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
  context/           AuthContext, AssessmentContext
  hooks/             useAuth, useAssessment
  services/          api, authService, tokenStorage, xrayService, gaitService
  routes.js          route constants and section anchors
```

## Future integration notes

- Signup, login and JWT storage are connected. Logout, protected routes and the
  assessment endpoints are not. Guest assessment data still lives in React memory
  only, so it is never persisted.
- The backend base URL is `VITE_API_URL`; `src/services/api.js` reads it via
  `import.meta.env` and falls back to `http://127.0.0.1:8000` when it is unset,
  so local development works without extra configuration.
- No API URLs are hardcoded anywhere else; every request goes through
  `src/services/api.js`.

## Deployment

Vercel-ready as a Vite project: build command `npm run build`, output directory
`dist`. `vercel.json` includes the SPA rewrite so client-side routes resolve on
refresh.

## Disclaimer

OA Assist provides AI-assisted preliminary assessment and does not replace
evaluation or diagnosis by a qualified healthcare professional.

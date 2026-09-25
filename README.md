# OA Assist

Monorepo for the OA Assist platform — an AI-assisted osteoarthritis assessment
platform combining medical imaging, gait analysis and symptom questionnaires for
preliminary assessment.

## Repository structure

```
OA Assist/
├── frontend/   React + Vite + Tailwind CSS application (deployed to Vercel)
└── backend/    FastAPI service — placeholder only, not implemented yet
```

## Current status

- `frontend/` — landing page, routing structure and placeholder pages.
- `backend/` — empty placeholder. The Python/FastAPI backend, database,
  authentication and AI model integration are planned for a later stage.

## Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

See [`frontend/README.md`](./frontend/README.md) for frontend details.

## Vercel deployment

Import the repository into Vercel and set the **Root Directory** to `frontend`.
Vercel then uses the settings in `frontend/vercel.json`:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

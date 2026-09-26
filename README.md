# OA Assist

Monorepo for the OA Assist platform — an AI-assisted osteoarthritis assessment
platform combining medical imaging, gait analysis and symptom questionnaires for
preliminary assessment.

## Repository structure

```
OA Assist/
├── frontend/   React + Vite + Tailwind CSS application (deployed to Vercel)
└── backend/    FastAPI + MongoDB Atlas service
```

## Current status

- `frontend/` — landing page, routing structure and placeholder pages.
- `backend/` — FastAPI app with a MongoDB Atlas connection, `GET /` and
  `GET /health`. No authentication, user models, AI integration or frontend
  wiring yet.

## Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

See [`frontend/README.md`](./frontend/README.md) for frontend details.

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- http://127.0.0.1:8000/ — API root
- http://127.0.0.1:8000/health — database health check
- http://127.0.0.1:8000/docs — interactive API docs

The MongoDB connection string is read from `MONGO_URI` in `backend/.env`, which
is git-ignored. See [`backend/README.md`](./backend/README.md).

## Vercel deployment

Import the repository into Vercel and set the **Root Directory** to `frontend`.
Vercel then uses the settings in `frontend/vercel.json`:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

# backend (FastAPI + MongoDB)

The OA Assist backend lives here. It currently provides the FastAPI app, the
MongoDB Atlas connection and the User document model. There is **no** signup
route, login route, password hashing, JWT or authentication yet.

## Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI app, CORS, router registration
│   ├── database.py        # MongoDB client (PyMongo async) and ping helper
│   ├── models/
│   │   ├── __init__.py    # re-exports the models
│   │   └── user.py        # User schema + users collection helpers
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py        # POST /api/auth/signup
│   └── utils/
│       ├── __init__.py
│       └── security.py    # bcrypt hashing and verification
├── .env                   # your real credentials — never commit this
├── .env.example           # template without real values
├── .gitignore
├── .python-version        # pins Python 3.12 for Vercel builds
├── vercel.json            # Vercel function settings for app/main.py
└── requirements.txt
```

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
```

`backend/.env` already exists. Put your own MongoDB Atlas connection string in
it as `MONGO_URI=...` (see `.env.example` for the format). The file is listed in
`.gitignore`, so it stays out of version control.

## Run the server

```bash
cd backend
uvicorn app.main:app --reload
```

- API root: http://127.0.0.1:8000/
- Health check: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs

## Endpoints

| Method | Path                  | Description                                             |
| ------ | --------------------- | ------------------------------------------------------- |
| GET    | `/`                   | Returns `{"message": "OA Assist backend is running"}`    |
| GET    | `/health`             | Pings MongoDB. `200` when reachable, `503` when it is not. |
| POST   | `/api/auth/signup`    | Creates an account. `201` on success, `409` if the email already exists, `422` for invalid input. |

## Database

- Driver: PyMongo's built-in async client (`pymongo.AsyncMongoClient`).
  Motor is deprecated, so it is not used.
- Database name: `oa_assist` (defined in `app/database.py`).
- The client is created lazily on the first request that needs it and is closed
  when the app shuts down.
- No credentials are stored in code. `app/database.py` only reads `MONGO_URI`
  from the environment.

## User model

Defined in `app/models/user.py` (Pydantic v2) and stored in the `users`
collection of the `oa_assist` database.

| Field       | Type     | Notes                                              |
| ----------- | -------- | -------------------------------------------------- |
| `fullName`  | string   | required, whitespace collapsed                    |
| `email`     | string   | required, validated, stored lowercase and trimmed  |
| `password`  | string   | required, min 8 characters, **stored as a bcrypt hash** |
| `createdAt` | datetime | UTC, set automatically on creation                |
| `updatedAt` | datetime | UTC, set automatically on creation                |

- `UserCreate` — the input shape accepted by the signup route.
- `UserInDB` — the stored document, with `id` mapped to MongoDB's `_id`.
- `UserPublic` — safe response shape; never exposes the password.
- `ensure_user_indexes()` — creates a unique index on the normalized `email`.
  It runs on startup from the FastAPI lifespan hook, so one account per email
  address is enforced at the database level.

## Signup

`POST /api/auth/signup` (defined in `app/routes/auth.py`).

Passwords are hashed with `bcrypt` (cost 12) by the helpers in
`app/utils/security.py`:

- The plain password is never written to MongoDB.
- The hash is never returned by the API.
- Passwords longer than bcrypt's 72-byte limit are condensed with SHA-256
  first, so long passwords are never silently truncated.
- Login, tokens and sessions are **not** implemented yet.

Request body:

```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "TestPassword123"
}
```

Responses:

| Status | When                                                                   |
| ------ | ---------------------------------------------------------------------- |
| `201`  | Account created. Returns `{"message": "...", "user": {id, fullName, email, createdAt, updatedAt}}` |
| `409`  | The email is already registered.                                        |
| `422`  | Missing or invalid field (blank name, bad email, password under 8 chars). |

## CORS

`CLIENT_URL` in `.env` (or as an environment variable on the host) holds a
comma-separated allow-list. It defaults to `http://localhost:5173`, the Vite dev
server. When the frontend is deployed, add that URL to the same variable — no
code change is needed.

`FRONTEND_ORIGINS` is still read as a fallback so older local setups keep
working, but `CLIENT_URL` is the documented name.

## Deploy to Vercel

Vercel supports FastAPI with zero configuration: it looks for an instance named
`app` in a supported entrypoint file, and `app/main.py` is one of them. Nothing
in the app had to change for this.

Set up a **separate Vercel project for the backend**, with **Root Directory =
`backend`**. Keep the frontend as its own project (its own Vite build); mixing a
static build and a Python function in one project forces conflicting framework
presets and routing rules.

Project settings:

- Framework Preset: `FastAPI`
- Root Directory: `backend`
- Build Command: leave empty (Vercel installs `requirements.txt` and skips the build)

Environment variables (Project → Settings → Environment Variables):

- `MONGO_URI` — the MongoDB Atlas connection string, same value as in
  `backend/.env`. Set it for Production, Preview and Development.
- `CLIENT_URL` — the deployed frontend origin, for example
  `https://your-app.vercel.app` (comma-separated for several).

`backend/.env` is never deployed: it stays git-ignored, and `vercel.json` also
excludes it from the function bundle. `load_dotenv` in `app/main.py` is a no-op
on Vercel, where values come from the dashboard.

`vercel.json` sets `maxDuration` and the bundle `excludeFiles` for the
`app/main.py` function. `.python-version` pins Python 3.12 for the build.

`app/main.py:46` keeps the lifespan hook, so the unique email index is created on
startup. Vercel limits lifespan shutdown work to 500ms, which is enough to close
the Mongo client.

One manual step in Atlas: allow Vercel's outbound addresses. The simplest option
is to allow access from `0.0.0.0/0` in **Network Access**, or add Vercel's
published egress ranges for that cluster.

## Planned scope (future work)

- Login with hashed passwords and JWT
- Patient and assessment models
- X-ray, gait and symptom endpoints
- Integration with the AI models

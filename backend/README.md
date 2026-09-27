# backend (FastAPI + MongoDB + JWT + X-ray model)

The OA Assist backend lives here. It currently provides the FastAPI app, the
MongoDB Atlas connection, the User document model, signup, login with JWT
issuance, one protected account route, patient records, the knee X-ray
assessment endpoint and the X-ray assessment history it writes to MongoDB.
Refresh tokens, logout, the gait and symptom models and full report generation
are **not** implemented yet.

## Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI app, CORS, router registration
│   ├── database.py        # MongoDB client (PyMongo async) and ping helper
│   ├── dependencies.py    # get_current_user: Bearer token -> MongoDB user
│   ├── models/
│   │   ├── __init__.py    # re-exports the models
│   │   ├── user.py        # User schema + users collection helpers
│   │   ├── patient.py     # Patient schema, OA-#### id generation, indexes
│   │   ├── assessment.py  # assessments collection, indexes and the X-ray save path
│   │   └── best_knee_finetuned_v2.keras   # trained knee OA model (45 MB)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py        # POST /api/auth/signup, /login and GET /me
│   │   ├── patients.py    # POST/GET/DELETE /api/patients
│   │   └── assessment.py  # POST /api/assessment/xray
│   ├── services/
│   │   ├── __init__.py
│   │   └── xray_service.py  # model loading, preprocessing, inference
│   └── utils/
│       ├── __init__.py
│       ├── security.py    # bcrypt hashing and verification
│       └── jwt_utils.py   # JWT signing and verification
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

`backend/.env` already exists. It holds your MongoDB Atlas connection string as
`MONGO_URI=...` and the JWT settings (see `.env.example` for the format). The
file is listed in `.gitignore`, so it stays out of version control.

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
| POST   | `/api/auth/login`     | Verifies credentials and returns a JWT. `200` on success, `401` for a wrong email or password, `422` for invalid input. |
| GET    | `/api/auth/me`        | Protected. Returns the authenticated user for a valid `Authorization: Bearer <token>`, `401` otherwise. |
| POST   | `/api/patients`       | Protected. Creates a patient for the signed-in user. `201` on success, `422` for invalid input. |
| GET    | `/api/patients`       | Protected. Lists the signed-in user's patients, newest first. |
| GET    | `/api/patients/{id}`  | Protected. `200` for the owner's patient, `400` for a malformed id, `404` when it does not exist or belongs to another user. |
| DELETE | `/api/patients/{id}`  | Protected. `200` on success, `409` when assessments still reference the patient. |
| POST   | `/api/assessment/xray` | Protected. Assesses an uploaded knee X-ray with the trained model, saves the result against `patient_id` and returns it. Multipart upload in `file` plus a `patient_id` form field. `503` if the result cannot be saved. |
| GET    | `/api/assessments`     | Protected. Lists the signed-in user's saved assessments, newest first. Optional `patient_id` query parameter narrows it to one patient. |

## Database

- Driver: PyMongo's built-in async client (`pymongo.AsyncMongoClient`).
  Motor is deprecated, so it is not used.
- Database name: `oa_assist` (defined in `app/database.py`).
- The client is created lazily on the first request that needs it and is closed
  when the app shuts down.
- No credentials are stored in code. `app/database.py` only reads `MONGO_URI`
  from the environment.

## Patients

A **user** is whoever signed in. A **patient** is somebody whose X-ray, symptoms
and gait get assessed. The two are deliberately separate: signing in does not
make you a patient, and one user can manage many patients.

```
User (JWT)  ->  Patient  ->  Assessment (xray / symptoms / gait)
```

Defined in `app/models/patient.py` (Pydantic v2) and stored in the `patients`
collection of the `oa_assist` database.

| Field        | Type     | Notes                                                     |
| ------------ | -------- | --------------------------------------------------------- |
| `_id`        | ObjectId | MongoDB's own id. Never returned by the API.               |
| `patient_id` | string   | Public id such as `OA-0001`. Generated by the backend.     |
| `user_id`    | ObjectId | Owning user. Taken from the verified JWT, never the body.  |
| `name`       | string   | Display name only. Never used as the identifier.           |
| `age`        | int?     | Optional, `0`–`130`.                                       |
| `gender`     | string?  | Optional. `Male`, `Female`, `Other` or `Prefer not to say`. |
| `created_at` | datetime | UTC. Used to sort a user's patients newest first.          |

The patient document holds identity only. No medical data is stored here; that
belongs to the assessment documents.

### Patient id generation

Ids are global (`OA-0001`, `OA-0002`, ...) and are never derived from the
patient's name. `reserve_patient_id()` in `app/models/patient.py` issues one with
a single atomic `find_one_and_update` on the `counters` collection, using
`$inc` with `upsert`:

```python
await get_counters_collection().find_one_and_update(
    {"_id": "patient_id"}, {"$inc": {"seq": 1}},
    upsert=True, return_document=ReturnDocument.AFTER,
)
```

Because the read and the increment happen in one server-side operation, two
users creating a patient at the same moment cannot be handed the same id. A
unique index on `patient_id` (`uniq_patient_id`) is the second line of defence:
if a collision ever did occur, the insert fails with `DuplicateKeyError` and the
route retries. Ids are monotonic and never reused, so gaps are possible if a
request fails after the counter was incremented. That is harmless.

### Ownership

`user_id` is not part of the `PatientCreate` schema, so a `user_id` in the
request body is ignored. Every query filters on `patient_id` **and** `user_id`
together, and `DELETE` re-checks ownership inside the delete itself. A patient
that exists but belongs to somebody else returns `404`, never `403`, so the API
does not confirm that another user's id is real.

### Deleting a patient

`DELETE /api/patients/{patient_id}` refuses with `409` when the `assessments`
collection still holds documents for that patient. There is no cascade delete,
so a patient can never be removed while its history still points at it.

## Assessments

Defined in `app/models/assessment.py` and stored in the `assessments` collection.

`POST /api/assessment/xray` **writes one document per successful prediction**,
and `GET /api/assessments` reads them back. The stored shape is:

```jsonc
{
  "_id": "ObjectId(...)",
  "user_id": "ObjectId(...)", // owner, copied from the verified JWT
  "patient_id": "OA-0001",    // the patient this assessment belongs to
  "type": "xray",             // "xray" | "symptoms" | "gait"
  "xray": {
    "predicted_class": "Moderate",
    "class_index": 2,
    "oa_indication": true,
    "confidence": 0.75,
    "probabilities": { "Healthy": 0.05, "Minimal": 0.1, "Moderate": 0.75, "Severe": 0.1 },
    "interpretation": "Moderate OA-associated changes indicated.",
    "note": "This is an AI-assisted preliminary assessment and is not a medical diagnosis."
  },
  "created_at": "ISODate(...)"
}
```

`user_id` is stored on the assessment as well as on the patient. That is not
redundant: it makes "every assessment of my account" a single indexed query, and
it keeps the history findable even if the patient document is later removed.

### Reading history

`GET /api/assessments` is protected and **always** filters on the `user_id` from
the verified JWT. A `patient_id` query parameter is optional and narrows the
result to one patient; the `user_id` filter is applied on top of it, so asking
for another user's patient returns an empty list rather than their data. Results
come back newest first.

### Indexes

`ensure_assessment_indexes()` runs on startup from the FastAPI lifespan hook and
creates three indexes on `assessments`:

| Index                      | Keys                                    | Serves                                    |
| -------------------------- | --------------------------------------- | ----------------------------------------- |
| `patient_id`               | `patient_id`                            | the delete guard on a patient             |
| `user_created_at`          | `user_id`, `created_at` desc            | "all my assessments, newest first"       |
| `user_patient_created`     | `user_id`, `patient_id`, `created_at` desc | one patient's history, newest first   |

### What is not stored

The uploaded image bytes are **never** written to MongoDB or to disk. Only the
model's numeric output and the generated interpretation are kept, so the history
stays small and no medical imagery is retained.

### When saving fails

If the prediction succeeds but the insert fails, the endpoint answers `503` with
`The assessment result could not be saved. Please try again.` rather than
returning a result the client would then believe is stored. The prediction is
not retried, and the error message never exposes the database or the traceback.

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
- `UserLogin` — the input shape accepted by the login route.
- `UserInDB` — the stored document, with `id` mapped to MongoDB's `_id`.
- `UserPublic` — safe response shape; never exposes the password.
- `UserSession` — smaller safe shape (`id`, `fullName`, `email`) used by login
  and by the protected `/api/auth/me` route.
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
- Login is implemented separately (see below); tokens and sessions are **not**
  implemented yet.

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

## Login

`POST /api/auth/login` (defined in `app/routes/auth.py`).

Request body:

```json
{
  "email": "zibatest@example.com",
  "password": "TestPassword123"
}
```

Responses:

| Status | When                                                                   |
| ------ | ---------------------------------------------------------------------- |
| `200`  | Credentials verified. Returns `{"message": "Login successful", "user": {id, fullName, email}, "access_token": "...", "token_type": "bearer"}` |
| `401`  | Unknown email **or** wrong password. The message is identical in both cases: `{"detail": "Incorrect email or password."}` |
| `422`  | Malformed body (missing field, invalid email format, empty password). |

How it works:

- The email is normalized with the same `normalize_email` helper used by signup,
  so any casing or surrounding whitespace still matches the stored document.
- The user is looked up in the existing `users` collection and the submitted
  password is checked with `verify_password` from `app/utils/security.py`, which
  compares against the stored bcrypt hash. The plain password is never stored or
  logged, and the hash is never returned.
- The response uses a dedicated `UserSession` model that contains only `id`,
  `fullName` and `email`, so the password and hash cannot leak through it.
- An unknown email still runs the bcrypt comparison against a fixed dummy hash
  (`DUMMY_PASSWORD_HASH`). Both failure paths therefore take the same time, and
  the endpoint does not reveal which addresses are registered.
- On success a JWT is returned. Nothing is written to MongoDB, and the frontend
  Login page is not wired up to this endpoint yet.

## JWT tokens

Defined in `app/utils/jwt_utils.py` and enforced by the `get_current_user`
dependency in `app/dependencies.py`.

How a token is generated after a successful login:

1. The account id becomes the `sub` claim and the normalized email becomes the
   `email` claim. Nothing else about the user is included.
2. `iat` and `exp` are added, with the lifetime from `JWT_EXPIRE_MINUTES`
   (default 60 minutes).
3. The payload is signed with `JWT_SECRET` using `JWT_ALGORITHM` (default
   `HS256`) and returned as `access_token` with `token_type: "bearer"`.

Configuration comes from the environment only; the secret is never hardcoded
and never returned by the API:

| Variable            | Required | Default | Purpose                                    |
| ------------------- | -------- | ------- | ------------------------------------------ |
| `JWT_SECRET`        | yes      | —       | Signing key. The app refuses to sign without it. |
| `JWT_ALGORITHM`     | no       | `HS256` | Signing algorithm.                         |
| `JWT_EXPIRE_MINUTES`| no       | `60`    | Token lifetime in minutes.                 |

Using a token on a protected route:

```
Authorization: Bearer <access_token>
```

`GET /api/auth/me` is the protected example. It returns only the identity:

```json
{ "id": "...", "fullName": "...", "email": "..." }
```

`get_current_user` reads the Bearer header, verifies the signature, algorithm
and expiry, then loads the user from MongoDB using the `sub` claim. Details sent
by the client are never trusted. It answers `401` with
`{"detail": "Could not validate credentials."}` for a missing, malformed,
tampered, expired or unknown-account token, and `503` if the database is
unreachable. Swagger sends the header automatically because the route declares
the HTTPBearer security scheme, so the **Authorize** button appears at the top
of the docs page.

Notes:

- Tokens are stateless. Nothing is stored in MongoDB, so there is no revocation
  list and **no logout endpoint yet**; a token stays valid until it expires.
- Rotating `JWT_SECRET` invalidates every issued token immediately.
- On Vercel, set `JWT_SECRET` in the project environment variables alongside
  `MONGO_URI` and `CLIENT_URL`.

## X-ray assessment

`POST /api/assessment/xray`, defined in `app/routes/assessment.py`, with the
model logic in `app/services/xray_service.py`.

Request: `multipart/form-data` with a `file` field holding a JPG, JPEG or PNG
image of at most 10 MB, and a `patient_id` form field naming the patient the
result belongs to (for example `OA-0001`). A valid
`Authorization: Bearer <access_token>` header is required; the route uses the
same `get_current_user` dependency as `GET /api/auth/me`.

Response (`200`):

```json
{
  "assessment_id": "66f1c2a4e1b2c3d4e5f60718",
  "patient_id": "OA-0001",
  "type": "xray",
  "predicted_class": "Moderate",
  "class_index": 2,
  "confidence": 0.75,
  "probabilities": { "Healthy": 0.05, "Minimal": 0.1, "Moderate": 0.75, "Severe": 0.1 },
  "oa_indication": true,
  "interpretation": "Moderate OA-associated changes indicated.",
  "note": "This is an AI-assisted preliminary assessment and is not a medical diagnosis.",
  "created_at": "2026-09-27T20:15:00Z"
}
```

`assessment_id`, `patient_id` and `created_at` identify the document that was
just written, so the client can show the result and link to it immediately.

| Field             | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `predicted_class` | `Healthy`, `Minimal`, `Moderate` or `Severe` (argmax of the output).  |
| `class_index`     | Index of that class, 0 to 3.                                          |
| `probabilities`   | The model's softmax output per class. Nothing is recalculated.        |
| `confidence`      | The model's probability for the predicted class.                      |
| `oa_indication`   | `false` for Healthy, `true` for Minimal, Moderate and Severe.         |
| `interpretation`  | Plain-language wording. It never states a diagnosis.                 |

Errors:

| Status | When                                                                |
| ------ | ------------------------------------------------------------------- |
| `400`  | Malformed `patient_id`, no file, empty file, or the bytes are not a readable image. |
| `401`  | Missing, invalid or expired token.                                   |
| `404`  | The patient does not exist or belongs to another user.               |
| `413`  | The file is larger than 10 MB.                                       |
| `415`  | The content type and the file extension are neither JPG nor PNG.      |
| `422`  | The `file` or `patient_id` form field is missing.                    |
| `500`  | The prediction itself failed.                                        |
| `503`  | The model could not be loaded, the database is unreachable, or the result could not be saved. |

How it works:

- The model is loaded once and kept in memory by `get_model()`, guarded by a
  lock so a burst of first requests cannot load the file twice. Loading is lazy
  (on the first request) because it takes about 8 seconds; a second prediction
  takes roughly 0.1 s.
- The training loss was serialized under the name `loss_fn`, so the service
  passes `custom_objects={"loss_fn": focal_loss}` to `tf.keras.models.load_model`
  and loads with `compile=False` — inference never rebuilds the optimizer. The
  model is loaded, never retrained or modified.
- Preprocessing follows the training notebook exactly: convert to grayscale
  (`L`), resize to 224x224, convert back to 3 channels (`RGB`), add the batch
  dimension, then `model.predict`, then `argmax`. No extra normalisation,
  cropping or augmentation is applied.
- The patient id is validated and checked against the signed-in user **before**
  the model runs, so nothing is ever written for somebody else's patient.
- The upload is read into memory, processed and discarded. Nothing is written to
  disk and the image bytes never reach MongoDB; only the numeric result is
  saved, and only once the model has succeeded.
- Error responses contain a short message only: no file paths, tracebacks,
  credentials or secrets.

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
the Mongo client. The patient and assessment indexes are created in the same
hook.

One manual step in Atlas: allow Vercel's outbound addresses. The simplest option
is to allow access from `0.0.0.0/0` in **Network Access**, or add Vercel's
published egress ranges for that cluster.

## Planned scope (future work)

- Gait and symptom endpoints
- Refresh tokens and logout
- Deleting or editing a saved assessment
- Full report generation as a downloadable document

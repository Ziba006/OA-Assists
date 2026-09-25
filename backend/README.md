# backend (placeholder)

The OA Assist backend will live here.

**Nothing is implemented yet.** No Python files, dependencies, database schema,
authentication or AI model integration exist at this stage.

## Planned scope (future work)

- Python + FastAPI service
- Endpoints for the X-ray, gait and symptom assessment modules
- Authentication and user accounts
- Database for patients and assessment history
- Integration with the AI models

## Intended integration with the frontend

The frontend reads its API base URL from the `VITE_API_BASE_URL` environment
variable (see `frontend/src/services/api.js`). No API URL — including localhost
— is hardcoded in the frontend today. When the backend exists, the value will be
set as a Vite environment variable in the deployment settings.

Guest sessions in the frontend are intentionally temporary: guest data is held in
memory only and is never written to a database.

# ResumeAI — integrated source bundle

This bundle combines the supplied FastAPI `app/` package and Next.js `src/` application with the supplied `requirements.txt` and `package.json`.

## Included integration updates

- Recruiter recruitment pipeline now uses the backend's actual `JobApplication` statuses: `applied`, `reviewing`, `shortlisted`, `rejected`, and `withdrawn`.
- Pipeline transitions now match `app/services/application_workflow_service.py`; the UI no longer offers unsupported `interview` or `selected` states.
- Pipeline status changes update the local card optimistically after the API confirms the change, avoiding an unnecessary full-page data reload.
- Candidate marketplace loads published jobs, saved jobs, and applications concurrently. Auxiliary saved/application failures no longer prevent job discovery.
- Candidate save/apply actions have independent per-job loading states, optimistic updates, and rollback on API errors.
- Company membership responses include company location and the Companies page displays it.
- Admin users now have an Admin Dashboard navigation entry.
- Added shared route loading skeleton, route error boundary, consistent pointer/disabled cursor feedback, Next.js TypeScript/PostCSS configuration, environment examples, and a company-location SQL migration.

## Run locally

### Backend

1. Create a PostgreSQL database and Redis instance.
2. Copy `.env.example` to `.env` and set real values locally.
3. Install dependencies: `pip install -r requirements.txt`
4. Apply `migrations/0001_company_location.sql` if the database predates the `companies.location` column.
5. Start the API from this directory: `uvicorn app.main:app --reload`

The FastAPI lifespan initializes Redis-backed rate limiting, so Redis must be reachable during startup.

### Frontend

1. Copy `.env.local.example` to `.env.local` in the project root.
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Production build: `npm run build`

## Validation performed for this bundle

- Python source compilation (`compileall`) completed successfully.
- API route and UI contracts were inspected and the recruitment status mismatch was corrected.
- A Next.js production build was not run in this environment because `node_modules` was not present and dependency installation was not performed.
- Database migrations, Redis, Celery worker execution, Gemini API calls, authentication cookies/CSRF, and end-to-end browser flows require your local environment and credentials to verify.

## Important deployment notes

- Do not commit `.env`, `.env.local`, API keys, database credentials, or production JWT secrets.
- Use `DEBUG=false` and `COOKIE_SECURE=true` behind HTTPS in production.
- Ensure `CORS_ORIGINS` contains the exact frontend origin.
- Start a Celery worker using the task app configured in `app/worker/celery_app.py`.
- The SQL migration is additive and safe to rerun on PostgreSQL.

# ResumeAI Frontend

Next.js App Router frontend for the FastAPI backend supplied with this project.

## Requirements

- Node.js 20.9 or later
- npm
- FastAPI backend running locally
- Backend CORS configured to allow `http://localhost:3000` with credentials

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_URL` to the backend origin, for example `http://localhost:8000`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Implemented screens

- Login and registration
- Dashboard and recent analyses
- Resume upload and resume list
- Analysis history, analysis selection, processing status, report and learning plan
- Published jobs marketplace, resume matching, save job and apply
- Saved jobs
- Candidate application history and withdrawal
- Notifications and read actions
- Candidate profile extraction from an uploaded resume and candidate list
- Company membership, company creation, company job creation/publish/close and company applications
- Recruitment pipeline for the separate `/api/recruitment/applications` workflow

## Backend contract limitations

These limitations are based on the backend routers provided with this project:

1. **Candidate-owned job descriptions are not currently exposed by an API.** The analysis create endpoint checks that `Job.user_id` belongs to the current user, but the registered jobs router exposes published marketplace jobs and company job creation. The frontend therefore does not send marketplace jobs into the analysis endpoint. The analysis screen accepts a job ID if one is already available to the user and lets the backend validate ownership.
2. The `/api/auth/me` endpoint returns only `id` and `email`. The frontend does not infer a role from the email or invent role information.
3. The recruitment pipeline (`/api/recruitment/applications`) is separate from public marketplace applications (`/api/applications/me`). The UI keeps them separate.
4. The supplied backend does not expose a list endpoint for a company's draft/closed jobs. Company management can create and act on a job returned by the create endpoint during the current screen session, but cannot reconstruct all existing company drafts after a reload.
5. The supplied `main.py` includes all routers used by the frontend. Admin-only and role-restricted screens show backend authorization errors when the signed-in user lacks access.

## Important

The ZIP contains frontend code and project configuration only. It does not contain your FastAPI backend, database, Redis, Celery worker, environment secrets, or uploaded resume files. Configure and run those separately.

No production deployment, backend schema changes, or new backend endpoints are included.

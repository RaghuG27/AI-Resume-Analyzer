# Frontend-to-backend API mapping

All requests use `src/lib/api.ts`, `credentials: include`, and the readable `csrf_token` cookie for state-changing requests.

| Role / screen | Backend endpoints |
|---|---|
| Authentication | `POST /api/auth/register` (candidate/recruiter only), `POST /api/auth/login`, `GET /api/auth/me` (includes role), `POST /api/auth/logout` |
| Candidate dashboard | `GET /api/dashboard/stats` |
| Candidate resumes | `GET /api/resumes/`, `POST /api/resumes/upload` |
| Candidate analysis | `GET /api/analysis/`, `POST /api/analysis/`, `GET /api/analysis/status/{task_id}`, `GET /api/analysis/{analysis_id}`, `GET /api/analysis/{analysis_id}/learning` |
| Candidate job marketplace | `GET /api/jobs/`, `GET /api/jobs/matches?resume_id=...`, `GET /api/jobs/{job_id}/match?resume_id=...` |
| Saved jobs | `POST /api/jobs/{job_id}/save`, `DELETE /api/jobs/{job_id}/save`, `GET /api/jobs/saved/me` |
| Candidate applications | `POST /api/jobs/{job_id}/applications`, `GET /api/applications/me`, `POST /api/applications/{application_id}/withdraw`, `GET /api/applications/{application_id}/history` |
| Notifications | `GET /api/notifications/me`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/me/read-all` |
| Recruiter candidate profiles | `GET /api/candidates/`, `POST /api/candidates/from-resume/{resume_id}`, `GET /api/candidates/{id}`, `PATCH /api/candidates/{id}`, `DELETE /api/candidates/{id}` |
| Recruiter company workspace | `POST /api/companies/`, `GET /api/companies/me`, `GET /api/companies/{id}/jobs/permissions` |
| Recruiter company jobs | `GET /api/jobs/companies/{company_id}/manage`, `POST /api/jobs/companies/{company_id}`, `PATCH /api/jobs/companies/{company_id}/{job_id}/publish`, `PATCH /api/jobs/companies/{company_id}/{job_id}`, `PATCH /api/jobs/companies/{company_id}/{job_id}/close` |
| Recruiter applications | `GET /api/companies/{company_id}/applications`, `PATCH /api/companies/{company_id}/applications/{application_id}/status` |
| Admin console | `GET /api/admin/overview`, `GET /api/admin/users`, `PATCH /api/admin/users/{id}/active?is_active=...`, `GET /api/companies/admin/pending-memberships`, `POST /api/companies/admin/memberships/{id}/approve` |

## Important role/workflow contracts

- Public registration accepts only `candidate` and `recruiter`. Admin accounts are created out of band using `python -m app.scripts.create_admin`.
- A recruiter can create a company, but the initial owner membership is pending until an admin approves it. Job management endpoints require an active company membership.
- Candidate analysis accepts a candidate-owned legacy job or a published company job. Resume ownership remains mandatory.
- Recruiter company jobs can be listed in draft, published, and closed states.
- Candidate profile records are recruiter-owned and are separate from the authenticated candidate's marketplace account.
- The separate `/api/recruitment/applications` model is a legacy recruiter-owned candidate/job workflow; the current live marketplace hiring workflow uses `JobApplication` and the company application endpoints.

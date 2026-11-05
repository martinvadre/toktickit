# Lab 5: Cloud Deployment, Containerization, and CI/CD Guide (`deployment.md`)

## 1. Team & Repository Information

| Item | Value |
| :--- | :--- |
| **Course** | CPE 334 Software Engineering — Lab 5 (Cloud Deployment, Containerization, and CI/CD) |
| **Application** | **TokTickIT** — IT Service Desk & Helpdesk Ticketing System |
| **GitHub Repository** | [`https://github.com/martinvadre/toktickit`](https://github.com/martinvadre/toktickit) |
| **GitHub `REPO_ID`** | `1330793060` |
| **GitHub `OWNER_ID`** | `131797548` |
| **Immutable OIDC Subject Prefix** | `repo:martinvadre@131797548/toktickit@1330793060` |
| **Team Member 1** | Pawarit Wongdaeng (`67070503466`) — `@martinvadre` |
| **Team Member 2** | Tatchakorn Thamnimitr (`67070503415`) — `@Magiciancat9` |

---

## 2. Reference Stack & Adaptations Made

We used the **Lab 5 Reference Stack** (Node.js 24 + Express + TypeScript + Prisma + PostgreSQL 16 + React 18 / Vite + Docker + Google Cloud Run + Cloud SQL + Artifact Registry + Secret Manager + GitHub Actions with Workload Identity Federation) and adapted it to the `martinvadre/toktickit` repository as follows:

1. **Cloud-Readiness & Stateless Persistence (R-02, R-04 / Episode 2)**:
   - **Host & Port Binding**: Updated `server/src/index.ts` so Express binds to `0.0.0.0` on `Number(process.env.PORT) || 3000`.
   - **Health & Readiness Probes**:
     - `GET /api/health`: Liveness probe returning `200 OK` (`{"status":"ok","service":"TokTickIT API"}`).
     - `GET /api/ready`: Readiness probe executing `SELECT 1` via Prisma against PostgreSQL and returning `200 OK` (`{"status":"ready","db":"connected"}`) or `503 Service Unavailable` (`{"status":"not_ready","db":"disconnected"}`).
   - **Unified Single-Container Static SPA Serving**: Updated `server/src/app.ts` to serve compiled frontend static assets from `/app/client/dist` (`path.resolve(__dirname, "../../client/dist")`) with SPA fallback to `index.html` for non-`/api` routes.
   - **Same-Origin Frontend API Resolution**: Updated `client/src/api.ts` so `VITE_API_URL=""` uses relative same-origin requests (`/api/...`) in production builds instead of falling back to `http://localhost:3000`.
   - **Database-Backed Attachment Storage (Stateless Container Compliance)**: Added `content Bytes?` (`BYTEA`) to `model Attachment` in `server/prisma/schema.prisma` and switched Multer in `server/src/app.ts` to `multer.memoryStorage()`. Uploaded files are stored in and served directly from PostgreSQL (`GET /api/attachments/:id/download`), ensuring attachments survive Cloud Run container restarts/redeploys and running under the non-root `USER node` account without writing to ephemeral container disk.
   - **Production Seeding & Security Hardening**:
     - Updated `server/prisma/seed.ts` to read `ADMIN_PASSWORD`, `DEMO_USER_PASSWORD`, and `SEED_DEMO_DATA` from environment variables. In production (`NODE_ENV="production"`), `admin@kmutt.ac.th` is created with `mustChangePassword: true` and existing passwords are never overwritten on re-seed; sample demo accounts/tickets are only seeded when `SEED_DEMO_DATA="true"`.
     - Updated `client/src/components/Login.tsx` to hide demo quick-fill account buttons in production builds (`import.meta.env.PROD`).
     - Updated `server/src/middleware/auth.ts` to disable unauthenticated `x-requester-id` header fallback in production unless `ALLOW_LEGACY_REQUESTER_HEADER="true"`.
2. **Prisma Migration Baseline**:
   - Added `server/prisma/migrations/20261103000000_init/migration.sql` and `server/prisma/migrations/migration_lock.toml` so `npx prisma migrate deploy` works deterministically in Docker Compose, GitHub Actions CI, and the Cloud Run migration job (`toktickit-migrate`).
3. **Smoke Test Adaptation (`deploy/smoke_test.py`)**:
   - Adapted `/api/categories` and `/api/auth/login` response parsing in `deploy/smoke_test.py` to support `martinvadre/toktickit`'s `{"data": ...}` JSON envelope while maintaining 100% compatibility with `deploy/tests/test_smoke.py`.

---

## 3. Environment Variable Table (R-02)

All environment variables are externalized. No credentials, API keys, or secrets are hardcoded in source code, Dockerfiles, or Git history. Template files are committed at `.env.example`, `server/.env.example`, and `client/.env.example`.

| Variable Name | Component | Purpose | Secret vs Non-Secret | Source in Local Dev | Source in GCP / GitHub Actions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Backend (`server`) | TCP port the Express HTTP server listens on (`0.0.0.0:$PORT`) | Non-Secret | `.env` / `docker-compose.yml` (`3000`) | Automatically injected by Cloud Run (`3000`) |
| `NODE_ENV` | Backend (`server`) | Runtime mode (`development`, `test`, `production`) controlling seeding and auth guards | Non-Secret | `.env` / `docker-compose.yml` | Set via `--set-env-vars NODE_ENV=production` on Cloud Run Service & Job |
| `DATABASE_URL` | Backend & Prisma (`server`) | PostgreSQL connection URL (TCP locally; `/cloudsql/...` Unix socket on Cloud Run) | **Secret** | `.env` / `docker-compose.yml` | Google Secret Manager secret `toktickit-database-url` mounted via `--set-secrets` |
| `JWT_SECRET` | Backend (`server`) | HMAC secret key used to sign and verify JWT bearer tokens | **Secret** | `.env` / `docker-compose.yml` | Google Secret Manager secret `toktickit-jwt-secret` mounted via `--set-secrets` |
| `ADMIN_PASSWORD` | Prisma Seed (`server`) | Initial password for `admin@kmutt.ac.th` during database seeding | **Secret** | `.env` / `docker-compose.yml` | Google Secret Manager secret `toktickit-admin-password` mounted on `toktickit-migrate` Job |
| `DEMO_USER_PASSWORD` | Prisma Seed (`server`) | Initial password for demo requester/staff accounts when `SEED_DEMO_DATA=true` | **Secret** | `.env` / `docker-compose.yml` | Google Secret Manager secret `toktickit-demo-password` mounted on `toktickit-migrate` Job |
| `SEED_DEMO_DATA` | Prisma Seed (`server`) | Whether `prisma db seed` creates sample requester/staff accounts and demo tickets (`true` / `false`) | Non-Secret | `.env` / `docker-compose.yml` (`true`) | Set on `toktickit-migrate` Cloud Run Job (`false` by default in prod) |
| `CORS_ORIGIN` | Backend (`server`) | Comma-separated allowed CORS origin(s) when frontend is hosted on a separate origin | Non-Secret | `.env` (`http://localhost:5173`) | Optional on Cloud Run (same-origin unified container serves both UI and `/api`) |
| `VITE_API_URL` | Frontend Build (`client`) | Base URL for API requests (`""` for same-origin in Docker/Cloud Run; `http://localhost:3000` in local Vite dev) | Non-Secret | `client/.env` (`http://localhost:3000`) | Set at build time in `Dockerfile` (`ENV VITE_API_URL=""`) |
| `GCP_PROJECT_ID` | CI/CD (`deploy.yml`, `deploy/*.sh`) | Target Google Cloud Project ID | Non-Secret | Shell env var | GitHub Environment (`demo`) variable `GCP_PROJECT_ID` |
| `GCP_REGION` | CI/CD (`deploy.yml`, `deploy/*.sh`) | Target Google Cloud region (`asia-southeast1`) | Non-Secret | Shell env var (`asia-southeast1`) | GitHub Environment (`demo`) variable `GCP_REGION` |
| `WIF_PROVIDER` | GitHub Actions (`deploy.yml`) | Full resource name of the GCP Workload Identity Provider for keyless OIDC auth | Non-Secret | N/A (CI only) | GitHub Environment (`demo`) variable `WIF_PROVIDER` |
| `WIF_SERVICE_ACCOUNT` | GitHub Actions (`deploy.yml`) | Deployer Service Account email (`toktickit-github-deployer@<PROJECT_ID>.iam.gserviceaccount.com`) | Non-Secret | N/A (CI only) | GitHub Environment (`demo`) variable `WIF_SERVICE_ACCOUNT` |
| `SMOKE_EMAIL` | Smoke Test (`deploy/smoke_test.py`) | Optional account email for post-deploy authenticated `/api/auth/login` + `/api/auth/me` check | Non-Secret | Shell env var | GitHub Environment (`demo`) variable `SMOKE_EMAIL` (optional) |
| `SMOKE_PASSWORD` | Smoke Test (`deploy/smoke_test.py`) | Optional account password for post-deploy authenticated smoke test | **Secret** | Shell env var | GitHub Environment (`demo`) secret `SMOKE_PASSWORD` (optional) |

---

## 4. Exact Commands to Build, Test, Run Locally, Migrate, and Seed (R-01, R-07)

### 4.1 Local Node.js Development & Testing

```bash
# 1. Install dependencies
cd server && npm ci
cd ../client && npm ci

# 2. Generate Prisma Client, apply migrations, and seed database
cd ../server
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

# 3. Run backend automated test suite (Vitest + Supertest against PostgreSQL) and TypeScript build
npm test
npm run build

# 4. Run frontend automated test suite (Vitest + React Testing Library) and production Vite build
cd ../client
npm test
npm run build
```

### 4.2 Offline Deployment & Smoke Script Verification

```bash
# Syntax check all deployment bash scripts
bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh

# Run offline stub tests for deploy.sh and release.sh (simulates gcloud/docker without cloud access)
bash deploy/tests/test_deploy_stub.sh
bash deploy/tests/test_release_stub.sh

# Run unit tests for smoke_test.py
python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
```

### 4.3 Local Multi-Container Stack via Docker Compose

```bash
# Build and start PostgreSQL 16 (db), Express API + Prisma (server), and Nginx + React SPA (client)
docker compose up --build -d

# Check container status and healthchecks
docker compose ps

# Verify endpoints
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/ready
curl -i http://localhost:5173/api/health
curl -s http://localhost:5173/ | head -n 5

# Run smoke test against local stack
python3 deploy/smoke_test.py http://localhost:3000

# Stop and remove containers + volume
docker compose down -v
```

### 4.4 Unified Production Container Build (Cloud Run Image)

```bash
# Build the multi-stage unified production image (client-build -> server-build -> production runtime)
docker build -t toktickit-lab5:latest .
```

---

## 5. GCP Project, Region, and Resource Naming Matrix (R-03, R-04, R-06, R-11)

| Resource Type | Name / Identifier | Purpose |
| :--- | :--- | :--- |
| **GCP Region** | `asia-southeast1` (Singapore) | Low-latency region for Cloud Run, Cloud SQL, and Artifact Registry |
| **Cloud Run Service** | `toktickit` | Public HTTPS stateless web service running unified container (`min-instances=0`, `max-instances=3`, `memory=512Mi`, `cpu=1`, `port=3000`) |
| **Cloud Run Migration Job** | `toktickit-migrate` | Pre-traffic job running `sh -c 'npx prisma migrate deploy && npm run prisma:seed'` before new revisions receive traffic |
| **Artifact Registry Repo** | `toktickit-repo` | Docker repository storing immutable images (`asia-southeast1-docker.pkg.dev/<PROJECT_ID>/toktickit-repo/app:<COMMIT_SHA>`) |
| **Cloud SQL Instance** | `toktickit-pg` | Managed PostgreSQL 16 instance (`db-f1-micro`, `EDITION=ENTERPRISE`, `availability-type=zonal`) |
| **Cloud SQL Database & User** | DB: `toktickit` / User: `toktickit_app` | Application database and dedicated database user |
| **Secret Manager Secrets** | `toktickit-db-password`<br>`toktickit-database-url`<br>`toktickit-jwt-secret`<br>`toktickit-admin-password`<br>`toktickit-demo-password` | Managed secrets injected at runtime via `--set-secrets` |
| **Runtime Service Account** | `toktickit-run-sa@<PROJECT_ID>.iam.gserviceaccount.com` | Attached to `toktickit` Service and `toktickit-migrate` Job; roles: `roles/cloudsql.client`, `roles/secretmanager.secretAccessor` |
| **Deployer Service Account** | `toktickit-github-deployer@<PROJECT_ID>.iam.gserviceaccount.com` | Impersonated by GitHub Actions via WIF; roles: `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` on `toktickit-run-sa` |
| **Workload Identity Pool & Provider** | Pool: `github-pool`<br>Provider: `github-provider` | Keyless OIDC trust restricted by repository ID (`1330793060`), owner ID (`131797548`), ref (`refs/heads/main`), workflow (`.github/workflows/deploy.yml`), and immutable subject (`repo:martinvadre@131797548/toktickit@1330793060:environment:demo`) |

---

## 6. Release, Rollback, Roll-Forward, and Identifying Running Revisions (R-08, R-09)

### 6.1 Initial Infrastructure Provisioning (One-Time Setup in Cloud Shell)

```bash
export GCP_PROJECT_ID="<YOUR_GCP_PROJECT_ID>"
export GCP_REGION="asia-southeast1"
export SEED_DEMO_DATA="false"

# Optional dry-run preview first
DRY_RUN=true bash deploy/deploy.sh

# Provision Cloud SQL, Secret Manager, Artifact Registry, Cloud Run Job, and Cloud Run Service
bash deploy/deploy.sh
```

### 6.2 Automated Release Pipeline (`deploy.yml` + `deploy/release.sh`)

Every push/merge to `main` (or manual `workflow_dispatch`) triggers `.github/workflows/deploy.yml`:
1. **Job 1 (`ci`)**: Calls `.github/workflows/ci-docker.yml` (`test-and-docker`) to run offline deploy script tests, backend Prisma migrations + seeds + Vitest tests, frontend Vitest tests + Vite build, and Docker build verification.
2. **Job 2 (`deploy`)**: Runs only if `ci` succeeds (`needs: ci`) inside the `demo` GitHub Environment:
   - Authenticates to Google Cloud via Workload Identity Federation (`google-github-actions/auth`).
   - Runs `bash deploy/release.sh` with `IMAGE_TAG=$GITHUB_SHA`:
     1. Builds and pushes the image to Artifact Registry, then resolves the immutable `@sha256:...` digest (`IMAGE_REF`).
     2. Updates `toktickit-migrate` to `IMAGE_REF` and executes `gcloud run jobs execute toktickit-migrate --wait`.
     3. Deploys `toktickit` to `IMAGE_REF` (`--labels commit-sha=$IMAGE_TAG`) so 100% of traffic shifts to the new revision only after migrations succeed.
   - Runs `python3 deploy/smoke_test.py "$SERVICE_URL"` to verify `/api/health`, `/api/ready`, `/`, and `/api/categories` (plus optional `/api/auth/login` & `/api/auth/me`).

### 6.3 How to Find the Currently Running Commit SHA, Revision, and Image Digest

Run the following `gcloud` commands to inspect the live Cloud Run service and its revisions:

```bash
# 1. List all revisions (shows REVISION name, ACTIVE status, DEPLOYED timestamp)
gcloud run revisions list \
  --service toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID"

# 2. Show traffic split across revisions
gcloud run services describe toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format='table(status.traffic.revisionName,status.traffic.percent,status.latestReadyRevisionName)'

# 3. Inspect a specific revision's pinned @sha256 image digest and commit-sha label
gcloud run revisions describe <REVISION_NAME> \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format='yaml(spec.containers[0].image,metadata.labels)'
```

### 6.4 Rollback & Roll-Forward Procedure (Traffic Shift Between Revisions)

Because Cloud Run revisions are immutable and pinned by `@sha256:...` digest, rolling back to a known-good revision (or rolling forward again) requires **no rebuild** and completes in seconds:

```bash
# 1. List existing revisions and identify the previous known-good revision (PREV_REV) and latest revision (LATEST_REV)
gcloud run revisions list \
  --service toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID"

export PREV_REV="<PREVIOUS_REVISION_NAME>"
export LATEST_REV="<LATEST_REVISION_NAME>"

# 2. ROLLBACK: Shift 100% of traffic immediately to the previous revision
gcloud run services update-traffic toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --to-revisions="${PREV_REV}=100"

# 3. Verify rollback traffic split and run smoke test
gcloud run services describe toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format='table(status.traffic.revisionName,status.traffic.percent)'
python3 deploy/smoke_test.py "$SERVICE_URL"

# 4. ROLL-FORWARD: Restore 100% of traffic to the latest revision
gcloud run services update-traffic toktickit \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --to-revisions="${LATEST_REV}=100"
```

### 6.5 Safe Teardown / Cost Control (Episode 10 / R-11)

- **Between work sessions (Pause Cloud SQL billing while keeping data)**:
  ```bash
  gcloud sql instances patch toktickit-pg --activation-policy=NEVER --project "$GCP_PROJECT_ID"
  # Resume later:
  gcloud sql instances patch toktickit-pg --activation-policy=ALWAYS --project "$GCP_PROJECT_ID"
  ```
- **After grading is complete (Full Teardown)**:
  ```bash
  CONFIRM_DESTROY=toktickit bash deploy/teardown.sh
  ```

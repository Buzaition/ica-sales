# ICA Sales

Sales lead logging app with a Vite React client and an Express API prepared for Vercel.

## Structure

- `client` - React frontend
- `server` - Express API, auth, middleware, services
- `shared` - shared TypeScript types and Zod schemas

## Environment

Copy `.env.example` and set all required values. Auth only allows these usernames:

- `admin` -> role `admin`
- `fatma`, `nehal`, `sara`, `sera` -> role `rep`

Each password is read from `USER_${username.toUpperCase()}_PASSWORD`, for example `USER_ADMIN_PASSWORD`.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the API:

```bash
pnpm dev:server
```

Run the client in another terminal:

```bash
pnpm dev:client
```

The client proxies `/api` to `http://localhost:3000` by default.

## Build

```bash
pnpm build
```

## Vercel

Deploy the project root to Vercel. The included `vercel.json` builds both apps:

- `/api/*` routes to the Express serverless entry at `server/src/vercel.ts`.
- All other routes serve the Vite build from `client/dist/public`.

Required Vercel environment variables:

```text
SESSION_SECRET=
GOOGLE_SCRIPT_URL=
USER_ADMIN_PASSWORD=
USER_FATMA_PASSWORD=
USER_NEHAL_PASSWORD=
USER_SARA_PASSWORD=
USER_SERA_PASSWORD=
```

Use a long random value for `SESSION_SECRET`. Set `GOOGLE_SCRIPT_URL` to the deployed Google Apps Script web app URL.

## Google Sheets Backend

Google Sheets remains the database. Deploy [server/google-apps-script.gs](server/google-apps-script.gs) as a Google Apps Script web app and set its deployment URL as `GOOGLE_SCRIPT_URL`.

Google Apps Script setup:

1. Create a Google Sheet.
2. Open Extensions -> Apps Script.
3. Paste the contents of [server/google-apps-script.gs](server/google-apps-script.gs).
4. Deploy as a web app.
5. Set execution access so the backend can call it.
6. Copy the web app URL into Vercel as `GOOGLE_SCRIPT_URL`.

Expected sheet columns:

```text
id, timestamp, salesman, cxName, cxPhone, callSummary, updatedAt
```

Lead routes:

- `POST /api/leads` - logged-in users create submissions; the server sets `id`, `timestamp`, `updatedAt`, and `salesman`.
- `GET /api/leads/my` - logged-in users read only their own submissions.
- `PATCH /api/leads/:id` - reps edit their own submissions; admin edits any submission.
- `GET /api/leads?salesman=&date=&search=` - admin-only list with optional filters.
- `GET /api/leads/stats` - admin-only totals by salesman.

The frontend only sends `cxName`, `cxPhone`, and `callSummary`. It never sends `salesman`, and `GOOGLE_SCRIPT_URL` is only read by the server.

## Security Checks

- Passwords are read only from backend environment variables.
- `GOOGLE_SCRIPT_URL` is never exposed to the client bundle.
- Request bodies are validated with shared Zod schemas.
- Server errors returned to users are generic.
- Reps can only edit their own submissions; admin can edit any submission.

## Testing After Deployment

Login test:

1. Visit the Vercel URL.
2. Log in with `admin` and `USER_ADMIN_PASSWORD`.
3. Log out.
4. Log in with a rep username such as `fatma` and its configured password.

Submission test:

1. Log in as a rep.
2. Submit a call record.
3. Confirm it appears in `My submissions`.
4. Edit the record and confirm `updatedAt` changes in Google Sheets.
5. Confirm the `salesman` column is the logged-in username.

Admin dashboard test:

1. Log in as `admin`.
2. Open the admin dashboard.
3. Confirm all submissions load.
4. Filter by `salesman`, date, and search text.
5. Confirm stats totals match the Google Sheet.
6. Edit a submission created by another user.
7. Use `Submit` to create an admin-owned submission and confirm it appears in `My submissions`.

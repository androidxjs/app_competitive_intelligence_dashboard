# Deployment

This project uses two deployment targets:

- Frontend: GitHub Pages
- Backend API: Render web service

## Backend API on Render

The repository includes `render.yaml` for Render Blueprint deployment.

1. Open Render and create a new Blueprint from this GitHub repository.
2. Render will create `app-competitive-intelligence-api`.
3. Wait until the service health check passes at `/health`.
4. Copy the Render service URL, for example:

   ```text
   https://app-competitive-intelligence-api.onrender.com
   ```

The API uses:

- Build command: `npm ci && npm run build:api`
- Start command: `npm run start -w @aci/api`
- Health check: `/health`

The default free Render service writes demo state to `/tmp/app-competitive-intelligence-state.json`. This is enough for a live backend demo, but data can reset after restart or redeploy. For production persistence, connect Postgres or mount a persistent disk and set `ACI_DATA_FILE` accordingly.

## Connect GitHub Pages to the API

After the backend URL is ready, set the GitHub Actions variable:

```bash
gh variable set VITE_API_URL \
  --repo androidxjs/app_competitive_intelligence_dashboard \
  --body https://app-competitive-intelligence-api.onrender.com
```

Then redeploy the frontend:

```bash
gh workflow run deploy-pages.yml \
  --repo androidxjs/app_competitive_intelligence_dashboard \
  --ref main
```

Frontend URL:

```text
https://androidxjs.github.io/app_competitive_intelligence_dashboard/
```

# Deployment Guide

**Stack**: NestJS backend + PostgreSQL + Expo web frontend → all on **Railway**

Railway gives $5 of credit/month on the Hobby plan ($5/month). Two small services + one Postgres plugin fit comfortably within that.

---

## 1 — Deploy the Backend on Railway

### 1.1 Push the repo to GitHub (if you haven't)
```bash
git init          # if not already a git repo
git add .
git commit -m "initial commit"
# create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 1.2 Create a Railway project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo
3. Railway will detect the `backend/Dockerfile` — set the **Root Directory** to `backend`

### 1.3 Add a PostgreSQL database
1. In your Railway project dashboard click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-injects `DATABASE_URL` but this app uses individual `DB_*` vars.  
   In the Postgres plugin click **Variables** and copy the values into your backend service.

### 1.4 Set environment variables
Go to your backend service → **Variables** and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | run `openssl rand -hex 32` and paste |
| `DB_HOST` | from the Postgres plugin (e.g. `monorail.proxy.rlwy.net`) |
| `DB_PORT` | from the Postgres plugin (e.g. `12345`) |
| `DB_USERNAME` | from the Postgres plugin (`postgres`) |
| `DB_PASSWORD` | from the Postgres plugin |
| `DB_NAME` | from the Postgres plugin (`railway`) |
| `DB_SYNCHRONIZE` | `true` for the **first** deploy only, then set to `false` |
| `APP_BASE_URL` | your Railway public URL (available after first deploy) |
| `CORS_ORIGINS` | your Netlify URL (set after step 2, or use `*` temporarily) |

### 1.5 Deploy
Click **Deploy**. Railway builds the Docker image and starts the server.  
Copy the generated public URL (e.g. `https://myapp.up.railway.app`).

> **After the first successful deploy**, set `DB_SYNCHRONIZE=false` and redeploy to prevent accidental schema drops.

---

## 2 — Deploy the Mobile Web App on Railway

### 2.1 Add a second service in the same Railway project
1. In your Railway project dashboard click **+ New** → **GitHub Repo** (same repo)
2. Set **Root Directory** to `mobile`
3. Railway picks up `mobile/railway.toml` which points to `mobile/Dockerfile`

### 2.2 Set the build-time variable
Go to the mobile service → **Variables** and add:

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://your-backend.up.railway.app/graphql` |

> This is an `ARG` in the Dockerfile so it gets baked into the static build.

### 2.3 Deploy
Click **Deploy**. Railway builds the Expo web export inside Docker and serves it via nginx.  
Copy the generated public URL (e.g. `https://myapp-web.up.railway.app`).

### 2.4 Update CORS on the backend service
```
CORS_ORIGINS=https://myapp-web.up.railway.app
```

---

## 3 — Email (optional)

For email verification, use a free SMTP provider:
- **[Resend](https://resend.com)** — 3,000 emails/month free
- **[Brevo](https://brevo.com)** — 300 emails/day free

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, and `EMAIL_FROM` in Railway.

---

## Summary

| Service | Hosts | Cost |
|---|---|---|
| Railway (backend service) | NestJS | ~$5/month (Hobby, covers both services) |
| Railway (Postgres plugin) | PostgreSQL | included |
| Railway (frontend service) | Expo web (nginx) | included |

Total: **~$5/month** (or free during Railway's trial period). One platform, one dashboard.

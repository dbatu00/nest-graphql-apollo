# Deployment Guide

**Stack**: NestJS backend + PostgreSQL → **Railway** | Expo web frontend → **Netlify**

Both services have generous free tiers. Railway gives $5 of credit/month on the Hobby plan ($5/month after trial).

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

## 2 — Deploy the Mobile Web App on Netlify

### 2.1 Set the backend URL
Create `mobile/.env.production` (do **not** commit this):
```
EXPO_PUBLIC_API_URL=https://myapp.up.railway.app/graphql
```

Or set it as a **Netlify environment variable** (preferred — see step 2.3).

### 2.2 Connect to Netlify
1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Select your repo
3. Netlify will detect `netlify.toml` in the repo root automatically — no manual config needed

### 2.3 Set environment variable in Netlify
Site settings → **Environment variables** → add:

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://myapp.up.railway.app/graphql` |

### 2.4 Deploy
Click **Deploy site**. Netlify runs `npx expo export --platform web` and hosts the output.

### 2.5 Update CORS on Railway
Once you have your Netlify URL (e.g. `https://myapp.netlify.app`), go back to Railway and set:
```
CORS_ORIGINS=https://myapp.netlify.app
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
| Railway | NestJS + PostgreSQL | ~$5/month (Hobby) |
| Netlify | Expo web app | Free |

Total: **~$5/month** (or free during Railway's trial period).

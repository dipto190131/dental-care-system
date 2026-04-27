# Deploying to Render.com

This guide explains how to deploy your Dental Care System to Render.com with separate frontend and backend services.

## Prerequisites
1. GitHub account (already set up ✅)
2. Render.com account (free)
3. Your code pushed to GitHub

## Step-by-Step Setup

### Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `dental-postgres`
   - **Database**: `dental_care`
   - **Region**: Same as services (Oregon)
   - **Plan**: **Free** ✅
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (for backend to use)
6. Save it somewhere safe

**Example URL format:**
```
postgresql://user:password@dpg-xxx.render.internal:5432/dental_care
```

---

### Step 2: Deploy Django Backend Service

1. Click **New +** → **Web Service**
2. Select your GitHub repo `dipto190131/dental-care-system`
3. Fill in:
   - **Name**: `dental-backend`
   - **Environment**: `Python 3.11`
   - **Region**: `Oregon` (same as database)
   - **Plan**: **Free** ✅
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn dental_care.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 60`
   - **Root Directory**: `backend` (optional)

4. Click **Advanced** and add Environment Variables:
   ```
   DATABASE_URL = (paste the Internal Database URL from Step 1)
   DJANGO_DEBUG = False
   DJANGO_SECRET_KEY = (generate a random string, or Render can auto-generate)
   ALLOWED_HOSTS = *.render.com
   NODE_ENV = production
   ```

5. Click **Create Web Service**
6. Wait for build to complete (~2-3 min)
7. Once deployed, copy the service URL (looks like: `https://dental-backend.onrender.com`)

---

### Step 3: Deploy React Frontend + Express Server

1. Click **New +** → **Web Service**
2. Select your GitHub repo `dipto190131/dental-care-system`
3. Fill in:
   - **Name**: `dental-frontend`
   - **Environment**: `Node.js`
   - **Region**: `Oregon` (same as backend)
   - **Plan**: **Free** ✅
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:express`

4. Click **Advanced** and add Environment Variables:
   ```
   NODE_ENV = production
   DJANGO_HOST = dental-backend.onrender.com
   DJANGO_PORT = 443
   ```

5. Click **Create Web Service**
6. Wait for build to complete (~5 min)
7. Once deployed, your frontend will be at: `https://dental-frontend.onrender.com`

---

### Step 4: Verify Everything Works

1. Open `https://dental-frontend.onrender.com` in browser
2. You should see your Dental Care System login page ✅
3. Try logging in or registering
4. Check browser DevTools (F12) → Network tab to verify API calls work

---

## Troubleshooting

### "Backend service unavailable"
- Check that `DJANGO_HOST` and `DJANGO_PORT` are set correctly in frontend env vars
- Verify backend service is running (green indicator on Render dashboard)
- Check backend logs for errors

### Database connection errors
- Verify `DATABASE_URL` is set correctly in backend env vars
- Use the **Internal Database URL** (not external)
- Check database is running on Render dashboard

### Build failures
- Check logs on Render dashboard
- Verify all required files are in GitHub (not .gitignored)
- Make sure `requirements.txt` and `package.json` are present

---

## Environment Variables Summary

### Frontend Service (Express)
```
NODE_ENV = production
DJANGO_HOST = dental-backend.onrender.com
DJANGO_PORT = 443
```

### Backend Service (Django)
```
DATABASE_URL = postgresql://...@dpg-xxx.render.internal:5432/dental_care
DJANGO_DEBUG = False
DJANGO_SECRET_KEY = (long random string)
ALLOWED_HOSTS = *.render.com
NODE_ENV = production
```

### Database
- **Name**: dental-postgres
- **Region**: Oregon
- **Type**: PostgreSQL 15
- **Plan**: Free

---

## Cost

**Free tier includes:**
- Frontend service: Free (750 hours/month)
- Backend service: Free (750 hours/month)
- PostgreSQL: Free (up to 90 days, then $15/month)

**Total cost for 3 months**: **$0** ✅

---

## Next Steps

After successful deployment:

1. **Custom Domain** (optional):
   - Buy domain from Namecheap, GoDaddy, etc.
   - Point to Render service
   - Add SSL certificate (auto with Render)

2. **Email Configuration** (optional):
   - Set up SMTP for password resets
   - Configure in Django settings

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor logs on Render dashboard

---

## Support

- Render docs: https://render.com/docs
- Django deployment: https://docs.djangoproject.com/en/5.0/howto/deployment/
- Questions? Check the Render community forum

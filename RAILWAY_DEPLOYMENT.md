# Railway Deployment Guide

## Prerequisites
- Railway account (railway.app)
- GitHub account (for connecting repository)
- PostgreSQL database (Railway will provide)

## Deployment Steps

### 1. Push Code to GitHub
```bash
git init
git add .
git commit -m "Ready for Railway deployment"
git branch -M main
git remote add origin https://github.com/yourusername/dental-care-system.git
git push -u origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your "dental-care-system" repository
4. Authorize Railway to access your GitHub account

### 3. Configure Environment Variables
In Railway dashboard, go to your project and add these variables:

```
DATABASE_URL=postgresql://...  # Railway provides this when you add PostgreSQL
DJANGO_SECRET_KEY=your-very-long-random-secret-key-here
DJANGO_DEBUG=False
NODE_ENV=production
ALLOWED_HOSTS=yourapp.railway.app,www.yourapp.railway.app
GROQ_API_KEY=your-groq-key (optional)
GEMINI_API_KEY=your-gemini-key (optional)
```

### 4. Add PostgreSQL Database
1. In Railway project → "New" → "Database" → "PostgreSQL"
2. Railway will automatically set `DATABASE_URL` environment variable
3. The database will be created and ready

### 5. Configure Services
Railway auto-detects your `Procfile` and builds the application:
- Installs dependencies: `npm install`
- Builds: `npm run build`
- Runs: `bash start.sh` (which runs migrations and starts server)

### 6. Deploy
1. Push code or connect GitHub - Railway auto-deploys on push
2. Check deployment logs: Dashboard → "Deploy" tab
3. Monitor: Dashboard shows real-time logs and metrics

### 7. Access Your Application
- Your app URL: `https://yourapp.railway.app`
- API endpoints: `https://yourapp.railway.app/api/*`
- Database: PostgreSQL hosted on Railway

## Important Notes

⚠️ **Database Migrations**
- `start.sh` automatically runs Django migrations on startup
- First deployment will initialize database schema
- Subsequent deploys only run pending migrations

⚠️ **Static Files**
- Frontend built by `npm run build` → `dist/public/`
- Express serves both API and frontend from single port
- No separate static file hosting needed

⚠️ **File Uploads**
- Uploaded files stored in `backend/uploads/`
- These are ephemeral on Railway (won't persist between deploys)
- For persistent storage, integrate Railway's storage or S3

⚠️ **Production Security**
- Change `DJANGO_SECRET_KEY` to a random string
- Set `DJANGO_DEBUG=False` for production
- Use HTTPS (Railway provides automatic SSL)
- Configure `ALLOWED_HOSTS` for your domain

## Troubleshooting

### Build Failures
Check logs in Railway dashboard:
- "Deploy" tab → "Build Logs"
- Look for missing dependencies or syntax errors

### Runtime Errors
- "Logs" tab shows application errors
- Common issues:
  - `DATABASE_URL` not set → PostgreSQL not connected
  - Missing environment variables → Check Railway config
  - Port binding issues → Already fixed (0.0.0.0)

### Database Connection
Test in Railway terminal:
```bash
psql $DATABASE_URL -c "SELECT VERSION();"
```

### Restart Application
Railway → Project → Service → Restart

## Environment-Specific Configurations

**Local Development**
- `NODE_ENV=development`
- `DJANGO_DEBUG=True`
- `DATABASE_URL=postgresql://localhost/dentalcare`

**Production (Railway)**
- `NODE_ENV=production`
- `DJANGO_DEBUG=False`
- `DATABASE_URL=` (auto-set by Railway)
- `ALLOWED_HOSTS=yourapp.railway.app`

## Monitoring & Logs

Railway dashboard shows:
- Real-time application logs
- CPU/Memory usage
- Build/Deploy history
- Error tracking

Access logs via Railway CLI:
```bash
railway logs
```

## Custom Domain Setup

1. Go to Railway Project Settings
2. Click "Domain" 
3. Add your custom domain
4. Update DNS records as instructed
5. HTTPS automatically configured

## Support

- Railway Docs: https://docs.railway.app
- Railway Support: hello@railway.app

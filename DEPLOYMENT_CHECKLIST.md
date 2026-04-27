# Railway Deployment Checklist

## Pre-Deployment ✅

- [ ] Code pushed to GitHub
- [ ] All environment variables documented in .env.example
- [ ] `npm run build` tested locally and works
- [ ] `npm run start` tested locally and works
- [ ] Django migrations tested locally: `python backend/manage.py migrate --run-syncdb`
- [ ] Database backup completed (if migrating existing data)

## Railway Configuration

- [ ] Create Railway account at railway.app
- [ ] Create new project connected to GitHub repository
- [ ] Add PostgreSQL database from Railway marketplace
- [ ] Configure environment variables in Railway dashboard:
  ```
  DATABASE_URL=<auto-populated by Railway>
  DJANGO_SECRET_KEY=<generate random key>
  DJANGO_DEBUG=False
  NODE_ENV=production
  ALLOWED_HOSTS=<your-domain>.railway.app
  ```

## First Deployment

1. [ ] Push code to GitHub main branch
2. [ ] Railway automatically starts build
3. [ ] Monitor build logs in Railway dashboard
4. [ ] Check deployment logs for errors
5. [ ] Verify `https://yourapp.railway.app` loads

## Post-Deployment Verification

- [ ] Frontend loads at `https://yourapp.railway.app`
- [ ] Login page accessible
- [ ] Registration works
- [ ] API calls successful (check browser console for errors)
- [ ] Database migrations completed (check Railway logs)
- [ ] File uploads working
- [ ] Credit plans visible in admin panel

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build` locally, ensure all dependencies installed |
| 502 Bad Gateway | Django not starting, check logs for migration errors |
| Database connection failed | Verify DATABASE_URL is set in Railway dashboard |
| Frontend doesn't load | Check static files built correctly in `dist/public/` |
| API calls fail with 404 | Verify ALLOWED_HOSTS includes your domain |

## Monitoring

- Railway Dashboard → Logs: Real-time application logs
- Railway Dashboard → Deployments: See all deployment history
- Railway Dashboard → Metrics: CPU, Memory, Network usage

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | postgresql://user:pass@host/db | Yes |
| DJANGO_SECRET_KEY | random-long-string | Yes |
| DJANGO_DEBUG | False | Yes (production) |
| NODE_ENV | production | Yes |
| ALLOWED_HOSTS | app.railway.app | Yes |
| GROQ_API_KEY | sk-xxx | No |
| GEMINI_API_KEY | sk-xxx | No |

## Scaling & Performance

Railway automatically scales based on load. To adjust:
1. Go to Railway Project Settings
2. Increase memory/CPU allocation under Compute
3. Adjust in railway.json if needed

## Backup & Recovery

1. Railway creates automatic daily backups
2. Access backups in database settings
3. Can restore to specific point-in-time

## Custom Domain Setup

1. Railway Project → Settings → Domain
2. Add your custom domain
3. Update DNS CNAME record as instructed
4. HTTPS automatically configured

## Troubleshooting Commands

```bash
# View real-time logs
railway logs

# SSH into container
railway shell

# View environment variables
railway env

# Run Django command
railway run python backend/manage.py <command>
```

## Support Resources

- Railway Docs: https://docs.railway.app
- Django Deployment: https://docs.djangoproject.com/en/stable/howto/deployment/
- This app: See RAILWAY_DEPLOYMENT.md for detailed guide

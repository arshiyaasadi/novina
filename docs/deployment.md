# Deployment guide

## Environment variables

Required variables are defined in `.env.example`.

### Required

```env
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_DEFAULT_LOCALE=fa

# GAPGPT AI (for risk assessment)
GAPGPT_API_KEY=your_gapgpt_api_key_here
GAPGPT_BASE_URL=your_gapgpt_base_url_here
GAPGPT_MODEL=your_gapgpt_model_here
```

### Production

- `DATABASE_URL`: Production database path (not used while Prisma is disabled)
- `NODE_ENV`: `production`
- `LOG_LEVEL`: `warn` or `error`
- `NEXT_PUBLIC_APP_URL`: Main app URL
- `GAPGPT_*`: Required for risk assessment

## Build

### Local

```bash
yarn install
yarn db:generate
yarn build
```

### Production

```bash
export NODE_ENV=production
yarn build
yarn start
```

## Deployment platforms

### Vercel

1. Push the project to GitHub
2. Import the project in Vercel
3. Set environment variables
4. Deploy

Notes:
- Prisma migrations run automatically (Phase 2)
- Build command: `yarn build`
- Output: `.next`
- Set GAPGPT variables or risk assessment will not work

### Docker

(To be added later.)

### Self-hosted

1. Prepare a server (Node.js 18+)
2. Clone the repo
3. Install dependencies and set environment variables
4. Set up database
5. Build and run with PM2 or systemd

## Database migration

In Phase 1, Prisma is disabled; no migration is needed. For Phase 2 production:

```bash
yarn db:migrate
```

Or in a deployment script: `yarn db:generate && yarn db:migrate && yarn build`

## Logging

Logs are written to `./logs/app.log`. For monitoring consider Sentry, LogRocket, or CloudWatch.

## Security

1. Never commit environment variables
2. Use a secure database connection string
3. Use HTTPS
4. Configure CORS correctly
5. Add rate limiting for APIs

## Performance

1. Use Next.js caching
2. Use a CDN for static assets
3. Optimize database indexes
4. Use the Next.js Image component

## Monitoring

- Error tracking (e.g. Sentry)
- Analytics (e.g. Google Analytics)
- Uptime (e.g. UptimeRobot)
- Centralized logging

## Rollback

1. Roll back to a previous version
2. Revert database migrations if needed
3. Verify environment variables

## Backup

**SQLite:** `cp dev.db dev.db.backup-$(date +%Y%m%d)`

**Cron (daily):** `0 2 * * * cp /path/to/db.db /path/to/backup/db-$(date +\%Y\%m\%d).db`

## Troubleshooting

**Build fails:** Check dependencies, TypeScript errors, and environment variables.

**Runtime errors:** Check logs, environment variables, and database connection.

**Performance:** Optimize queries, check caching, and bundle size.

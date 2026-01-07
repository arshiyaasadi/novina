# راهنمای استقرار

## Environment Variables

متغیرهای محیطی مورد نیاز در `.env.example` تعریف شده‌اند.

### Required Variables

```env
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_DEFAULT_LOCALE=fa

# GAPGPT AI Configuration (برای ارزیابی ریسک)
GAPGPT_API_KEY=your_gapgpt_api_key_here
GAPGPT_BASE_URL=your_gapgpt_base_url_here
GAPGPT_MODEL=your_gapgpt_model_here
```

### Production Variables

برای production، این متغیرها را تنظیم کنید:

- `DATABASE_URL`: مسیر دیتابیس production (در حال حاضر استفاده نمی‌شود چون Prisma غیرفعال است)
- `NODE_ENV`: `production`
- `LOG_LEVEL`: `warn` یا `error`
- `NEXT_PUBLIC_APP_URL`: URL اصلی اپلیکیشن
- `GAPGPT_API_KEY`: کلید API برای سرویس GAPGPT (الزامی برای ارزیابی ریسک)
- `GAPGPT_BASE_URL`: URL پایه سرویس GAPGPT (الزامی برای ارزیابی ریسک)
- `GAPGPT_MODEL`: نام مدل AI برای استفاده (الزامی برای ارزیابی ریسک)

## Build Process

### Local Build

```bash
# Install dependencies
yarn install

# Generate Prisma Client
yarn db:generate

# Build
yarn build
```

### Production Build

```bash
# Set environment
export NODE_ENV=production

# Build
yarn build

# Start
yarn start
```

## Deployment Platforms

### Vercel

1. پروژه را به GitHub push کنید
2. در Vercel پروژه را import کنید
3. Environment variables را تنظیم کنید
4. Deploy کنید

**نکات:**
- Prisma migrations به صورت خودکار اجرا می‌شوند (در فاز ۲)
- Build command: `yarn build`
- Output directory: `.next`
- **مهم**: حتماً متغیرهای GAPGPT را تنظیم کنید وگرنه ارزیابی ریسک کار نمی‌کند

### Docker

(بعداً اضافه می‌شود)

### Self-Hosted

1. سرور را آماده کنید (Node.js 18+)
2. پروژه را clone کنید
3. Dependencies را نصب کنید
4. Environment variables را تنظیم کنید
5. Database را setup کنید
6. Build کنید
7. با PM2 یا systemd اجرا کنید

## Database Migration

> **نکته**: در فاز ۱، Prisma غیرفعال است و نیازی به migration نیست. دستورات زیر برای فاز ۲ آماده هستند.

در production (فاز ۲)، migrations را به صورت دستی اجرا کنید:

```bash
yarn db:migrate
```

یا در deployment script:

```bash
yarn db:generate && yarn db:migrate && yarn build
```

## Logging

Logs در production در فایل `./logs/app.log` ذخیره می‌شوند.

برای monitoring، می‌توانید از سرویس‌های زیر استفاده کنید:
- Sentry
- LogRocket
- CloudWatch

## Security

1. **Environment Variables**: هرگز در کد commit نکنید
2. **Database**: از connection string امن استفاده کنید
3. **HTTPS**: همیشه از HTTPS استفاده کنید
4. **CORS**: CORS را به درستی تنظیم کنید
5. **Rate Limiting**: برای API ها rate limiting اضافه کنید

## Performance

1. **Caching**: از Next.js caching استفاده کنید
2. **CDN**: برای static assets از CDN استفاده کنید
3. **Database**: indexes را بهینه کنید
4. **Images**: از Next.js Image component استفاده کنید

## Monitoring

برای monitoring در production:

1. **Error Tracking**: Sentry یا مشابه
2. **Analytics**: Google Analytics یا مشابه
3. **Uptime**: UptimeRobot یا مشابه
4. **Logs**: Centralized logging

## Rollback

در صورت مشکل:

1. به version قبلی rollback کنید
2. Database migration را revert کنید (در صورت نیاز)
3. Environment variables را بررسی کنید

## Backup

### Database Backup

برای SQLite:

```bash
cp dev.db dev.db.backup-$(date +%Y%m%d)
```

### Automated Backup

برای production، backup خودکار تنظیم کنید:

```bash
# Cron job برای backup روزانه
0 2 * * * cp /path/to/db.db /path/to/backup/db-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Build Fails

1. Dependencies را بررسی کنید
2. TypeScript errors را بررسی کنید
3. Environment variables را بررسی کنید

### Runtime Errors

1. Logs را بررسی کنید
2. Environment variables را بررسی کنید
3. Database connection را بررسی کنید

### Performance Issues

1. Database queries را بهینه کنید
2. Caching را بررسی کنید
3. Bundle size را بررسی کنید


# راهنمای توسعه

> **نکته**: برای چک‌لیست کامل آمادگی توسعه، به [Development Checklist](./development-checklist.md) مراجعه کنید.

## راه‌اندازی پروژه

### پیش‌نیازها

- Node.js 18+ 
- Yarn یا npm
- Git

### نصب وابستگی‌ها

```bash
yarn install
# یا
npm install
```

### تنظیم محیط

1. فایل `.env.local` را از `.env.example` کپی کنید:

```bash
cp .env.example .env.local
```

2. متغیرهای محیطی را تنظیم کنید:

**متغیرهای الزامی:**
- `DATABASE_URL`: مسیر دیتابیس (مثلاً `file:./prisma/dev.db`)
- `NODE_ENV`: محیط اجرا (`development` یا `production`)

**متغیرهای GAPGPT (الزامی برای ارزیابی ریسک):**
- `GAPGPT_API_KEY`: کلید API برای سرویس GAPGPT
- `GAPGPT_BASE_URL`: URL پایه سرویس GAPGPT
- `GAPGPT_MODEL`: نام مدل AI برای استفاده

**متغیرهای اختیاری:**
- `LOG_LEVEL`: سطح لاگ (پیش‌فرض: `info`)
- `LOG_FILE_PATH`: مسیر فایل لاگ (پیش‌فرض: `./logs/app.log`)
- `NEXT_PUBLIC_APP_URL`: URL عمومی اپلیکیشن (پیش‌فرض: `http://localhost:3000`)
- `NEXT_PUBLIC_DEFAULT_LOCALE`: زبان پیش‌فرض (پیش‌فرض: `fa`)

### راه‌اندازی دیتابیس

> **نکته**: در فاز ۱، Prisma غیرفعال است و از localStorage استفاده می‌شود. دستورات زیر برای فاز ۲ آماده هستند.

```bash
# Generate Prisma Client
yarn db:generate

# Create database and run migrations
yarn db:push

# یا برای migration
yarn db:migrate
```

**برای فاز ۱**: نیازی به راه‌اندازی دیتابیس نیست. داده‌ها در localStorage ذخیره می‌شوند.

### اجرای پروژه

```bash
# Development
yarn dev

# Build
yarn build

# Production
yarn start
```

## دستورات مهم

```bash
# Database
yarn db:generate    # Generate Prisma Client
yarn db:push        # Push schema to database
yarn db:migrate     # Run migrations
yarn db:studio      # Open Prisma Studio

# Development
yarn dev            # Start dev server
yarn build          # Build for production
yarn start          # Start production server
yarn lint           # Run ESLint
```

## استانداردهای کدنویسی

### TypeScript

- از TypeScript strict mode استفاده کنید
- از `any` استفاده نکنید
- Types را در فایل `types/` هر Domain تعریف کنید

### Naming Conventions

- **Files**: kebab-case (مثلاً `user-repository.ts`)
- **Classes**: PascalCase (مثلاً `UserRepository`)
- **Functions/Variables**: camelCase (مثلاً `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (مثلاً `MAX_RETRY_COUNT`)

### File Structure

هر Domain باید شامل این پوشه‌ها باشد:
- `controllers/` - Route handlers
- `services/` - Business logic
- `repositories/` - Data access
- `models/` - Domain models
- `types/` - TypeScript types

### Import Order

1. React/Next.js imports
2. Third-party libraries
3. Internal imports (با `@/`)
4. Relative imports
5. Types

```typescript
import { NextRequest } from "next/server";
import { logger } from "@/infrastructure/logging";
import { UserRepository } from "../repositories/user.repository";
import type { UserResponse } from "../types";
```

## Git Workflow

### Branch Naming

- `feature/` - برای ویژگی‌های جدید
- `fix/` - برای رفع باگ
- `docs/` - برای مستندات
- `refactor/` - برای بازنویسی کد

### Commit Messages

از format زیر استفاده کنید:

```
type(scope): subject

body (optional)
```

Types:
- `feat`: ویژگی جدید
- `fix`: رفع باگ
- `docs`: مستندات
- `style`: فرمت کد
- `refactor`: بازنویسی
- `test`: تست
- `chore`: کارهای دیگر

مثال:
```
feat(auth): add login functionality

Implement user login with email and password validation
```

## Testing

(بعداً اضافه می‌شود)

## Debugging

از logger برای debugging استفاده کنید:

```typescript
import { logger } from "@/infrastructure/logging";

logger.info("User logged in", { userId: user.id });
logger.error("Login failed", { error, email });
```

Logs در `./logs/app.log` ذخیره می‌شوند.

## Best Practices

1. **Error Handling**: همیشه try-catch استفاده کنید
2. **Logging**: خطاها و رویدادهای مهم را لاگ کنید
3. **Type Safety**: از TypeScript به درستی استفاده کنید
4. **Code Reuse**: کدهای مشترک را در `shared/` قرار دهید
5. **Documentation**: کدهای پیچیده را مستند کنید


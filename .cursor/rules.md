# قوانین توسعه برای Cursor AI

## ساختار پروژه

این پروژه از معماری MVC + Domain-based استفاده می‌کند. هر Domain شامل:
- `controllers/` - Route handlers
- `services/` - Business logic
- `repositories/` - Data access
- `models/` - Domain models
- `types/` - TypeScript types

## استفاده از کامپوننت‌ها

### کامپوننت‌های shadcn/ui

کامپوننت‌های UI از `@/shared/ui/` استفاده کنید:
- Button
- Input
- Card
- Label
- و سایر کامپوننت‌های shadcn/ui

### نمونه کامپوننت‌ها

قبل از ساخت کامپوننت جدید:
1. در `@/shared/samples/` جستجو کنید
2. اگر نمونه مشابهی وجود دارد، از آن استفاده کنید
3. کامپوننت را به `@/shared/components/` یا `@/shared/ui/` منتقل کنید

## استانداردهای کدنویسی

### TypeScript

- از TypeScript strict mode استفاده کنید
- از `any` استفاده نکنید
- Types را در فایل `types/` هر Domain تعریف کنید

### Naming

- Files: kebab-case
- Classes: PascalCase
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE

### Import Order

1. React/Next.js
2. Third-party libraries
3. Internal imports (`@/`)
4. Relative imports
5. Types

## RTL و i18n

### RTL Support

- پروژه برای فارسی RTL است
- از `dir="rtl"` استفاده می‌شود
- Tailwind به صورت خودکار RTL را پشتیبانی می‌کند

**قوانین مهم RTL:**

1. **ترتیب دکمه‌ها**: در RTL، دکمه "بعدی" باید در سمت چپ و دکمه "قبلی"/"رد کردن" باید در سمت راست باشد
   - استفاده از `justify-between` در flex container
   - دکمه Next را اول در DOM قرار دهید (در RTL در سمت چپ نمایش داده می‌شود)
   - دکمه Previous/Skip را آخر در DOM قرار دهید (در RTL در سمت راست نمایش داده می‌شود)

2. **Dots Indicator**: برای dots indicator در RTL، از `flex-row-reverse` استفاده کنید تا ترتیب بصری درست باشد
   ```tsx
   <div className="flex flex-row-reverse justify-center gap-2">
     {items.map((_, index) => (...))}
   </div>
   ```

3. **ترتیب عناصر در لیست‌ها**: در RTL، اولین عنصر در سمت راست و آخرین عنصر در سمت چپ نمایش داده می‌شود
   - برای navigation، عناصر مهم‌تر را در ابتدای لیست قرار دهید

### i18n

- از `next-intl` استفاده کنید
- متن‌ها را در `@/i18n/locales/fa.json` قرار دهید
- از `useTranslations()` hook استفاده کنید

مثال:
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<p>{t('welcome')}</p>
```

## UI Development

### Mobile-First

- پروژه فقط برای موبایل طراحی شده است
- از responsive design استفاده کنید
- Touch targets حداقل 44x44px

### Design System

- از رنگ‌های CSS variables استفاده کنید
- از spacing system Tailwind استفاده کنید
- از typography system استفاده کنید

### تم‌ها

- از `next-themes` برای مدیریت تم استفاده می‌شود
- از CSS variables برای رنگ‌ها استفاده کنید
- Dark/Light mode پشتیبانی می‌شود

## Domain Development

### ساختار Domain

هر Domain باید شامل:
1. **Models**: Domain entities
2. **Repositories**: Data access
3. **Services**: Business logic
4. **Controllers**: API handlers
5. **Types**: TypeScript interfaces

### جریان داده

```
Request → Controller → Service → Repository → Database
```

### Error Handling

- از try-catch استفاده کنید
- از logger برای ثبت خطاها استفاده کنید
- Error messages را به فارسی برگردانید

مثال:
```typescript
import { logger } from "@/infrastructure/logging";

try {
  // code
} catch (error) {
  logger.error("Operation failed", { error });
  throw error;
}
```

## Database

### Prisma

- از Prisma Client استفاده کنید
- Queries را در Repository layer قرار دهید
- از Prisma generated types استفاده کنید

### Migrations

- همیشه از migrations استفاده کنید
- Schema را در `prisma/schema.prisma` تعریف کنید

## Logging

- از `@/infrastructure/logging` استفاده کنید
- Logs در `./logs/app.log` ذخیره می‌شوند
- از log levels مناسب استفاده کنید (info, warn, error)

## Best Practices

1. **Code Reuse**: کدهای مشترک را در `shared/` قرار دهید
2. **Type Safety**: از TypeScript به درستی استفاده کنید
3. **Error Handling**: همیشه error handling داشته باشید
4. **Logging**: رویدادهای مهم را لاگ کنید
5. **Documentation**: کدهای پیچیده را مستند کنید
6. **Testing**: (بعداً اضافه می‌شود)

## مثال‌ها

### ساخت API Route

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { AuthController } from "@/domains/auth/controllers/auth.controller";

const authController = new AuthController();

export async function POST(request: NextRequest) {
  return authController.login(request);
}
```

### ساخت Service

```typescript
// src/domains/auth/services/auth.service.ts
import { UserRepository } from "../repositories/user.repository";
import { logger } from "@/infrastructure/logging";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(credentials: LoginCredentials) {
    // business logic
  }
}
```

### ساخت کامپوننت

```tsx
// src/shared/components/example.tsx
import { Button } from "@/shared/ui/button";
import { useTranslations } from 'next-intl';

export function ExampleComponent() {
  const t = useTranslations('common');
  
  return (
    <Button>
      {t('welcome')}
    </Button>
  );
}
```


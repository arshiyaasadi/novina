# ساختار دیتابیس

## Prisma Schema

Schema در `prisma/schema.prisma` تعریف شده است.

## Models

### User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  content   Content[]

  @@map("users")
}
```

**Fields:**
- `id`: شناسه یکتا (CUID)
- `email`: ایمیل کاربر (یکتا)
- `name`: نام کاربر (اختیاری)
- `password`: رمز عبور (باید hash شود)
- `createdAt`: تاریخ ایجاد
- `updatedAt`: تاریخ آخرین بروزرسانی

**Relations:**
- `content`: محتواهای ایجاد شده توسط کاربر

### Content

```prisma
model Content {
  id        String   @id @default(cuid())
  title     String
  body      String?
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@map("contents")
}
```

**Fields:**
- `id`: شناسه یکتا (CUID)
- `title`: عنوان محتوا
- `body`: متن محتوا (اختیاری)
- `published`: وضعیت انتشار
- `authorId`: شناسه نویسنده
- `createdAt`: تاریخ ایجاد
- `updatedAt`: تاریخ آخرین بروزرسانی

**Relations:**
- `author`: نویسنده محتوا (User)

**Indexes:**
- `authorId`: برای جستجوی سریع‌تر محتواهای یک نویسنده

## Migration Guide

### ایجاد Migration

```bash
yarn db:migrate
```

این دستور:
1. Migration جدید ایجاد می‌کند
2. Schema را به دیتابیس اعمال می‌کند
3. Prisma Client را generate می‌کند

### Push Schema (Development)

برای محیط توسعه می‌توانید مستقیماً schema را push کنید:

```bash
yarn db:push
```

**توجه**: این روش برای production توصیه نمی‌شود.

### Reset Database

```bash
# حذف تمام داده‌ها و migrations
yarn prisma migrate reset
```

## Seed Data

(بعداً اضافه می‌شود)

برای اضافه کردن seed data، فایل `prisma/seed.ts` ایجاد کنید.

## Prisma Studio

برای مشاهده و ویرایش داده‌ها:

```bash
yarn db:studio
```

این دستور Prisma Studio را در مرورگر باز می‌کند.

## Best Practices

1. **Migrations**: همیشه از migrations استفاده کنید
2. **Indexes**: برای فیلدهای پرجستجو index اضافه کنید
3. **Relations**: از cascade delete با احتیاط استفاده کنید
4. **Types**: از Prisma generated types استفاده کنید
5. **Validation**: اعتبارسنجی را در Service layer انجام دهید

## Database URL

در `.env.local`:

```env
DATABASE_URL="file:./dev.db"
```

برای SQLite، مسیر فایل دیتابیس را مشخص کنید.

## Backup

برای backup دیتابیس SQLite:

```bash
cp dev.db dev.db.backup
```

## Troubleshooting

### مشکل: Prisma Client not generated

```bash
yarn db:generate
```

### مشکل: Migration conflicts

```bash
# Reset و migrate مجدد
yarn prisma migrate reset
yarn db:migrate
```

### مشکل: Schema out of sync

```bash
# Pull schema from database
yarn prisma db pull
```


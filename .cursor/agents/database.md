# Database Management Agent

## Focus Areas

این ایجنت برای مدیریت دیتابیس و Prisma استفاده می‌شود.

## Responsibilities

1. تعریف و به‌روزرسانی Prisma Schema
2. ایجاد و مدیریت Migrations
3. بهینه‌سازی Queries
4. مدیریت Indexes
5. Seed data

## Guidelines

### Schema Design

- Models را در `prisma/schema.prisma` تعریف کنید
- از naming conventions مناسب استفاده کنید
- Relations را به درستی تعریف کنید

### Migrations

- همیشه از migrations استفاده کنید
- Migration names باید توصیفی باشند
- قبل از migration، schema را بررسی کنید

### Queries

- Queries را در Repository layer قرار دهید
- از Prisma generated types استفاده کنید
- از select برای بهینه‌سازی استفاده کنید

### Indexes

- برای فیلدهای پرجستجو index اضافه کنید
- از composite indexes برای queries پیچیده استفاده کنید

## Examples

### تعریف Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]

  @@map("users")
}
```

### ایجاد Migration

```bash
yarn db:migrate
```

### Query Optimization

```typescript
// Bad: Select all fields
const user = await prisma.user.findUnique({
  where: { id },
});

// Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### استفاده از Repository

```typescript
import { UserRepository } from "@/domains/auth/repositories/user.repository";

const userRepository = new UserRepository();
const user = await userRepository.findByEmail(email);
```


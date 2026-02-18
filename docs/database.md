# Database structure

## Current status

> **Note**: In Phase 1, Prisma Client is disabled and localStorage is used for temporary data. Prisma code exists in the project but is commented out.

### localStorage usage

In Phase 1, the following are stored in localStorage:
- User portfolio (`portfolio`)
- User investments (`investments`, `latestInvestment`)
- Installment payment status (`installment_*_paid`)

This is suitable for development and testing; Phase 2 will move to a real database.

## Prisma schema

The schema is defined in `prisma/schema.prisma`. Prisma Client is currently disabled; the schema is ready for future use.

## Models

### User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  firstName String?
  lastName  String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  content   Content[]

  @@map("users")
}
```

**Fields:**
- `id`: Unique ID (CUID)
- `email`: User email (unique)
- `name`: User name (optional) — for backward compatibility
- `firstName`: First name (optional)
- `lastName`: Last name (optional)
- `password`: Password (must be hashed)
- `createdAt`, `updatedAt`: Timestamps

**Relations:**
- `content`: Content created by the user

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

**Fields:** `id`, `title`, `body`, `published`, `authorId`, `createdAt`, `updatedAt`  
**Relations:** `author` (User)  
**Indexes:** `authorId` for faster lookups by author

## Enabling Prisma (Phase 2)

1. Uncomment `src/infrastructure/database/prisma.ts`
2. Uncomment repository files (e.g. `src/domains/auth/repositories/user.repository.ts`)
3. Run migrations: `yarn db:migrate`

## Migration guide

> Prisma is currently disabled. The following is for Phase 2.

### Create migration

```bash
yarn db:migrate
```

This creates a new migration, applies the schema, and regenerates the Prisma Client.

### Push schema (development)

```bash
yarn db:push
```

Not recommended for production.

### Reset database

```bash
yarn prisma migrate reset
```

## Seed data

(To be added later.) Add `prisma/seed.ts` for seed data.

## Prisma Studio

```bash
yarn db:studio
```

Opens Prisma Studio in the browser.

## Best practices

1. Use migrations
2. Add indexes for frequently queried fields
3. Use cascade delete with care
4. Use Prisma-generated types
5. Validate in the service layer

## Database URL

In `.env.local`:

```env
DATABASE_URL="file:./prisma/dev.db"
```

For SQLite, set the database file path. This variable is not used while Prisma is disabled.

## Backup

```bash
cp dev.db dev.db.backup
```

## Troubleshooting

**Prisma Client not generated:** Run `yarn db:generate`

**Migration conflicts:** Run `yarn prisma migrate reset` then `yarn db:migrate`

**Schema out of sync:** Run `yarn prisma db pull`

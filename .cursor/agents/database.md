# Database Management Agent

## Focus areas

This agent is used for database and Prisma work.

## Responsibilities

1. Define and update the Prisma schema
2. Create and manage migrations
3. Optimize queries
4. Manage indexes
5. Seed data

## Guidelines

### Schema design

- Define models in `prisma/schema.prisma`
- Use consistent naming
- Define relations correctly

### Migrations

- Always use migrations
- Use descriptive migration names
- Review the schema before migrating

### Queries

- Keep queries in the repository layer
- Use Prisma-generated types
- Use `select` to limit returned fields

### Indexes

- Add indexes for frequently queried fields
- Use composite indexes for complex queries

## Examples

### Model

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

### Run migration

```bash
yarn db:migrate
```

### Query optimization

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

### Using a repository

```typescript
import { UserRepository } from "@/domains/auth/repositories/user.repository";

const userRepository = new UserRepository();
const user = await userRepository.findByEmail(email);
```

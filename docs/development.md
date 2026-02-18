# Development guide

> For a full development readiness checklist, see [Development checklist](./development-checklist.md).

## Project setup

### Prerequisites

- Node.js 18+
- Yarn or npm
- Git

### Install dependencies

```bash
yarn install
# or
npm install
```

### Environment

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Set environment variables:

**Required:**
- `DATABASE_URL`: Database path (e.g. `file:./prisma/dev.db`)
- `NODE_ENV`: `development` or `production`

**GAPGPT (required for risk assessment):**
- `GAPGPT_API_KEY`: API key for GAPGPT
- `GAPGPT_BASE_URL`: GAPGPT base URL
- `GAPGPT_MODEL`: AI model name

**Optional:**
- `LOG_LEVEL`: Log level (default: `info`)
- `LOG_FILE_PATH`: Log file path (default: `./logs/app.log`)
- `NEXT_PUBLIC_APP_URL`: Public app URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_DEFAULT_LOCALE`: Default locale (default: `fa`)

### Database setup

> In Phase 1, Prisma is disabled and localStorage is used. The commands below are for Phase 2.

```bash
# Generate Prisma Client
yarn db:generate

# Create database and run migrations
yarn db:push

# or use migrations
yarn db:migrate
```

**Phase 1**: No database setup needed; data is stored in localStorage.

### Run the project

```bash
# Development
yarn dev

# Build
yarn build

# Production
yarn start
```

## Important commands

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

## Coding standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any`
- Define types in each domain’s `types/` folder

### Naming

- **Files**: kebab-case (e.g. `user-repository.ts`)
- **Classes**: PascalCase (e.g. `UserRepository`)
- **Functions/variables**: camelCase (e.g. `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g. `MAX_RETRY_COUNT`)

### File structure

Each domain should have:
- `controllers/` — route handlers
- `services/` — business logic
- `repositories/` — data access
- `models/` — domain models
- `types/` — TypeScript types

### Import order

1. React/Next.js
2. Third-party libraries
3. Internal imports (`@/`)
4. Relative imports
5. Types

```typescript
import { NextRequest } from "next/server";
import { logger } from "@/infrastructure/logging";
import { UserRepository } from "../repositories/user.repository";
import type { UserResponse } from "../types";
```

## Git workflow

### Branch naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — refactoring

### Commit messages

Use this format:

```
type(scope): subject

body (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Example:
```
feat(auth): add login functionality

Implement user login with email and password validation
```

## Testing

(To be added later.)

## Debugging

Use the logger for debugging:

```typescript
import { logger } from "@/infrastructure/logging";

logger.info("User logged in", { userId: user.id });
logger.error("Login failed", { error, email });
```

Logs are written to `./logs/app.log`.

## Best practices

1. **Error handling**: Use try/catch where appropriate
2. **Logging**: Log errors and important events
3. **Type safety**: Use TypeScript consistently
4. **Code reuse**: Put shared code in `shared/`
5. **Documentation**: Document complex code

## Future work (Phase 2 / API integration)

The following are left as TODOs for Phase 2 or real API integration:

- **Resend OTP**: `src/shared/components/auth/phone-login.tsx` — call API to resend OTP
- **Verify national ID (profile)**: `src/app/(main)/app/profile/page.tsx` — call API to verify national ID and load user info
- **Verify national ID (modal)**: `src/shared/components/profile/national-id-modal.tsx` — call API to verify national ID
- **Login OTP**: `src/app/(auth)/login/page.tsx` — call APIs to send and verify OTP
- **Profile navigation**: `src/shared/components/profile/app-settings-section.tsx` — navigate to about page and activity history

Until then, inline comments use the form `// TODO(phase2): ...` and behavior is mock or local-only.

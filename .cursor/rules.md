# Development rules for Cursor AI

## Project structure

This project uses **MVC + domain-based** architecture. Each domain includes:
- `controllers/` — Route handlers
- `services/` — Business logic
- `repositories/` — Data access
- `models/` — Domain models
- `types/` — TypeScript types

## Using components

### shadcn/ui components

Use UI components from `@/shared/ui/`:
- Button
- Input
- Card
- Label
- Other shadcn/ui components

### Sample components

Before creating a new component:
1. Search in `@/shared/samples/`
2. If a similar sample exists, use it
3. Move the component to `@/shared/components/` or `@/shared/ui/`

## Coding standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any`
- Define types in each domain’s `types/` folder

### Naming

- Files: kebab-case
- Classes: PascalCase
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE

### Import order

1. React/Next.js
2. Third-party libraries
3. Internal imports (`@/`)
4. Relative imports
5. Types

## RTL and i18n

### RTL support

- The app is RTL for Persian
- Use `dir="rtl"`
- Tailwind supports RTL automatically

**RTL rules:**

1. **Button order:** In RTL, the "Next" button should be on the left and "Previous"/"Skip" on the right
   - Use `justify-between` on the flex container
   - Put the Next button first in the DOM (it appears on the left in RTL)
   - Put Previous/Skip last in the DOM (they appear on the right in RTL)

2. **Dots indicator:** For a dots indicator in RTL, use `flex-row-reverse` so the visual order is correct
   ```tsx
   <div className="flex flex-row-reverse justify-center gap-2">
     {items.map((_, index) => (...))}
   </div>
   ```

3. **List order:** In RTL, the first item is on the right and the last on the left
   - For navigation, put the most important items at the start of the list

### i18n

- Use `next-intl`
- Put copy in `@/i18n/locales/fa.json`
- Use the `useTranslations()` hook

Example:
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<p>{t('welcome')}</p>
```

## UI development

### Mobile-first

- The app is designed for mobile only
- Use responsive design
- Touch targets at least 44x44px

### Design system

- Use CSS variables for colors
- Use Tailwind spacing and typography

### Themes

- Use `next-themes` for theme handling
- Use CSS variables for colors
- Dark/Light mode is supported

## Domain development

### Domain structure

Each domain should have:
1. **Models**: Domain entities
2. **Repositories**: Data access
3. **Services**: Business logic
4. **Controllers**: API handlers
5. **Types**: TypeScript interfaces

### Data flow

```
Request → Controller → Service → Repository → Database
```

### Error handling

- Use try/catch where appropriate
- Use the logger for errors
- Return user-facing error messages via i18n (app locale)

Example:
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

- Use the Prisma client
- Keep queries in the repository layer
- Use Prisma-generated types

### Migrations

- Always use migrations
- Define the schema in `prisma/schema.prisma`

## Logging

- Use `@/infrastructure/logging`
- Logs are written to `./logs/app.log`
- Use appropriate levels (info, warn, error)

## Best practices

1. **Code reuse:** Put shared code in `shared/`
2. **Type safety:** Use TypeScript consistently
3. **Error handling:** Always handle errors
4. **Logging:** Log important events
5. **Documentation:** Document complex code
6. **Testing:** (To be added later)

## Examples

### API route

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { AuthController } from "@/domains/auth/controllers/auth.controller";

const authController = new AuthController();

export async function POST(request: NextRequest) {
  return authController.login(request);
}
```

### Service

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

### Component

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

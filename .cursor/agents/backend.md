# Backend Development Agent

## Focus areas

This agent is used for backend and API development.

## Responsibilities

1. Create API routes
2. Implement domain logic (services, repositories)
3. Manage the database with Prisma
4. Error handling and logging
5. Input validation

## Guidelines

### API routes

- API routes live in `src/app/api/`
- Use controllers for handling
- Apply proper error handling

### Domain structure

- Business logic in services
- Data access in repositories
- Route handling in controllers

### Database

- Use the Prisma client
- Keep queries in the repository layer
- Use transactions for multi-step operations

### Error handling

- Use try/catch where appropriate
- Use the logger for errors
- Use `ErrorResponses` from `@/shared/types/errors` for standard error payloads
- Return user-facing error messages in the app locale (i18n)

### Validation

- Validate in the controller layer with Zod
- Define validation schemas in each domain’s `types/index.ts`
- Use `safeParse` for validation
- Use TypeScript types

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

**Note:** Error handling is done in the controller; the route does not need its own try/catch.

### Service

```typescript
// src/domains/auth/services/auth.service.ts
import { UserRepository } from "../repositories/user.repository";
import { LoginCredentials, AuthResponse } from "../types";
import { logger } from "@/infrastructure/logging";
import { hashPassword, verifyPassword } from "@/shared/lib/password";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);
      
      if (!user) {
        logger.warn(`Login attempt: ${credentials.email}`);
        return null;
      }

      const isPasswordValid = await verifyPassword(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        logger.warn(`Invalid password attempt: ${credentials.email}`);
        return null;
      }
      
      logger.info(`User logged in: ${user.email}`);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
        },
      };
    } catch (error) {
      logger.error("Login error", { error });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const hashedPassword = await hashPassword(data.password);
    // ... rest of registration logic
  }
}
```

### Controller with validation

```typescript
// src/domains/auth/controllers/auth.controller.ts
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../types";
import { ErrorResponses } from "@/shared/types/errors";
import { logger } from "@/infrastructure/logging";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(request: NextRequest) {
    try {
      const body = await request.json();

      const validationResult = loginSchema.safeParse(body);
      if (!validationResult.success) {
        const errorResponse = ErrorResponses.validation(validationResult.error.errors);
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const result = await this.authService.login(validationResult.data);
      if (!result) {
        const errorResponse = ErrorResponses.unauthorized();
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error("Login controller error", { error });
      const errorResponse = ErrorResponses.internalServerError();
      return NextResponse.json(errorResponse.error, { status: errorResponse.status });
    }
  }
}
```

### Repository

```typescript
// src/domains/auth/repositories/user.repository.ts
import { prisma } from "@/infrastructure/database/prisma";
import { User } from "../models/user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? User.fromPrisma(user) : null;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const user = await prisma.user.create({
      data,
    });

    return User.fromPrisma(user);
  }
}
```

### Validation schema

```typescript
// src/domains/auth/types/index.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});
```

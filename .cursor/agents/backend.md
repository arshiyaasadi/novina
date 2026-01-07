# Backend Development Agent

## Focus Areas

این ایجنت برای توسعه Backend و API استفاده می‌شود.

## Responsibilities

1. ساخت API Routes
2. توسعه Domain logic (Services, Repositories)
3. مدیریت دیتابیس با Prisma
4. Error handling و logging
5. اعتبارسنجی داده‌ها

## Guidelines

### API Routes

- API Routes در `src/app/api/` قرار می‌گیرند
- از Controllers استفاده کنید
- Error handling مناسب داشته باشید

### Domain Structure

- Business logic در Services
- Data access در Repositories
- Route handling در Controllers

### Database

- از Prisma Client استفاده کنید
- Queries را در Repository layer قرار دهید
- از transactions برای عملیات‌های پیچیده استفاده کنید

### Error Handling

- از try-catch استفاده کنید
- از logger برای ثبت خطاها استفاده کنید
- از `ErrorResponses` در `@/shared/types/errors` برای پاسخ‌های خطای استاندارد استفاده کنید
- Error messages را به فارسی برگردانید

### Validation

- اعتبارسنجی را در Controller layer با Zod انجام دهید
- Schema های validation را در `types/index.ts` هر Domain تعریف کنید
- از `safeParse` برای validation استفاده کنید
- از TypeScript types استفاده کنید

## Examples

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

**نکته**: Error handling در Controller انجام می‌شود، نیازی به try-catch در Route نیست.

### ساخت Service

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

      // Verify password
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
    // Hash password before storing
    const hashedPassword = await hashPassword(data.password);
    // ... rest of registration logic
  }
}
```

### ساخت Controller با Validation

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

      // Validate input with Zod
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

### ساخت Repository

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

### تعریف Validation Schema

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


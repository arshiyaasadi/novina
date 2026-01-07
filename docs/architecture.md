# معماری پروژه

## مقدمه

این پروژه از معماری **MVC (Model-View-Controller)** و **Domain-based Structure** استفاده می‌کند. این ترکیب به ما کمک می‌کند تا کد را به صورت منطقی و قابل نگهداری سازماندهی کنیم.

## ساختار کلی

```
src/
├── app/                    # Next.js App Router (View Layer)
├── domains/                # Domain-based Structure
│   ├── auth/
│   ├── content/
│   └── user/
├── shared/                 # کدهای مشترک
├── infrastructure/         # زیرساخت
├── i18n/                   # بین‌المللی‌سازی
└── types/                  # TypeScript global types
```

## Domain-based Architecture

هر Domain شامل ساختار MVC است:

### 1. Models (`models/`)
- Domain entities و business objects
- تبدیل داده‌های Prisma به Domain models

### 2. Repositories (`repositories/`)
- Data access layer
- تمام query های Prisma در اینجا قرار می‌گیرند
- جداسازی منطق دیتابیس از business logic

### 3. Services (`services/`)
- Business logic
- اعتبارسنجی‌ها
- قوانین کسب‌وکار

### 4. Controllers (`controllers/`)
- Route handlers
- API endpoints
- تبدیل request/response

### 5. Types (`types/`)
- TypeScript interfaces
- DTOs (Data Transfer Objects)

## جریان داده

```
Request → Controller → Service → Repository → Database
                ↓
         Response ← Controller
```

## Domain ها

### Auth Domain
- مدیریت احراز هویت
- Login/Register
- مدیریت session

### Content Domain
- مدیریت محتوا
- CRUD operations
- انتشار محتوا

### User Domain
- مدیریت اطلاعات کاربر
- Profile management

## قوانین توسعه

1. **هر Domain مستقل است**: Domain ها نباید مستقیماً به یکدیگر وابسته باشند
2. **Dependency Injection**: Services از Repositories استفاده می‌کنند
3. **Single Responsibility**: هر کلاس یک مسئولیت دارد
4. **Type Safety**: از TypeScript types استفاده کنید
5. **Error Handling**: از logger برای ثبت خطاها استفاده کنید

## API Structure

API Routes در `src/app/api/` قرار می‌گیرند و از Controllers استفاده می‌کنند.

## مثال

```typescript
// Controller
const authController = new AuthController();
export async function POST(request: NextRequest) {
  return authController.login(request);
}

// Service
const authService = new AuthService();
const result = await authService.login(credentials);

// Repository
const userRepository = new UserRepository();
const user = await userRepository.findByEmail(email);
```


# Project architecture

## Introduction

This project uses **MVC (Model-View-Controller)** and a **domain-based structure**. Together they keep the code organized and maintainable.

## Overall structure

```
src/
├── app/                    # Next.js App Router (View layer)
├── domains/                # Domain-based structure
│   ├── auth/
│   ├── content/
│   ├── risk/               # Risk assessment domain
│   └── user/
├── shared/                 # Shared code
├── infrastructure/         # Infrastructure
├── i18n/                   # Internationalization
└── types/                  # TypeScript global types
```

## Domain-based architecture

Each domain follows an MVC-style layout:

### 1. Models (`models/`)
- Domain entities and business objects
- Map Prisma data to domain models

### 2. Repositories (`repositories/`)
- Data access layer
- All Prisma queries live here
- Keeps database logic separate from business logic

### 3. Services (`services/`)
- Business logic
- Validation
- Business rules

### 4. Controllers (`controllers/`)
- Route handlers
- API endpoints
- Request/response mapping

### 5. Types (`types/`)
- TypeScript interfaces
- DTOs (Data Transfer Objects)

## Data flow

### Standard flow (with database)
```
Request → Controller → Service → Repository → Database
                ↓
         Response ← Controller
```

### Risk assessment flow (with AI)
```
Request → Controller → Service → AI API (GAPGPT)
                ↓
         Response ← Controller
```

> In Phase 1, risk assessment uses AI and does not use a repository.

## Domains

### Auth domain
- Authentication
- Login/register
- Session handling
- Layout: `controllers/`, `services/`, `repositories/`, `models/`, `types/`
- **Logged-in user (global):** A single DTO (mobile, nationalId, firstName, lastName, birthDate in Shamsi) is kept in a Zustand store and optionally in localStorage. See [user-session.md](user-session.md).

### Content domain
- Content management
- CRUD
- Publishing
- Layout: `controllers/`, `services/`, `repositories/`, `models/`, `types/`

### Risk domain
- Investment risk assessment
- AI integration (GAPGPT) to analyze user answers
- Risk profile: conservative, balanced, or aggressive
- Layout:
  - `controllers/risk-assessment.controller.ts` — API request handling
  - `services/risk-assessment.service.ts` — business logic and AI calls
  - `types/index.ts` — TypeScript interfaces and DTOs

Risk domain does not use a repository; it talks to the AI API directly.

### User domain
- User information
- Profile management
- Layout: `controllers/`, `services/`, `repositories/`, `models/`, `types/`

## Development rules

1. **Domains are independent**: Domains must not depend on each other directly.
2. **Dependency injection**: Services use repositories.
3. **Single responsibility**: Each class has one responsibility.
4. **Type safety**: Use TypeScript types.
5. **Error handling**: Use the logger for errors.

## API structure

API routes live under `src/app/api/` and use controllers.

## Examples

### Example 1: Auth domain (standard)

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

### Example 2: Risk domain (with AI)

```typescript
// Controller
const riskController = new RiskAssessmentController();
export async function POST(request: NextRequest) {
  return riskController.evaluate(request);
}

// Service
const riskService = new RiskAssessmentService();
const result = await riskService.evaluateRisk({
  answers: [...]
});

// AI API call (inside service)
const response = await openaiClient.chat.completions.create({
  model: "gpt-model",
  messages: [...]
});
```

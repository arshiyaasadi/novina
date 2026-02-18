# Development Readiness Checklist

This document outlines all prerequisites and setup steps required before starting feature development on the Novina project.

## Prerequisites

### Required Software

- [x] **Node.js 18+** - Check with `node --version`
- [x] **Yarn or npm** - Package manager (Yarn recommended)
- [x] **Git** - Version control
- [ ] **Code Editor** - VS Code or Cursor recommended

### Environment Setup

- [ ] **Environment Variables Configured**
  - Copy `.env.example` to `.env.local`
  - Fill in all required values (see Environment Variables section below)
  - Verify `DATABASE_URL` points to correct database location

## Infrastructure Checklist

### Database

- [x] **Prisma Schema Defined** - Located in `prisma/schema.prisma`
- [ ] **Database Initialized** (for Phase 2)
  ```bash
  yarn db:generate  # Generate Prisma Client
  yarn db:push      # Create database and apply schema
  # OR
  yarn db:migrate   # Use migrations (recommended for production)
  ```
- [ ] **Database Connection Verified** - Test with `yarn db:studio`

> **Note**: In Phase 1, Prisma Client is disabled and localStorage is used. No database setup is required.

### Authentication & Security

- [x] **Password Hashing Implemented** - Using bcryptjs
- [x] **Input Validation Implemented** - Using Zod
- [x] **Error Handling Standardized** - Using `ErrorResponses` utility
- [ ] **JWT Authentication** - (Future implementation)
- [ ] **Session Management** - (Future implementation)

### Code Quality

- [x] **TypeScript Strict Mode** - Enabled in `tsconfig.json`
- [x] **All Code Comments in English** - Standardized across codebase
- [x] **Error Handling in Async Operations** - Implemented in all services
- [ ] **ESLint Configuration** - Check with `yarn lint`
- [ ] **No `any` Types** - (Review and fix as needed)

## Development Setup Steps

### 1. Clone and Install

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd novina

# Install dependencies
yarn install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Required variables:
# - DATABASE_URL (for Phase 2, currently not used)
# - NODE_ENV
# - GAPGPT_API_KEY (required for risk assessment)
# - GAPGPT_BASE_URL (required for risk assessment)
# - GAPGPT_MODEL (required for risk assessment)
# - LOG_LEVEL (optional, defaults to "info")
```

### 3. Database Setup

> In Phase 1, Prisma is disabled and data is stored in localStorage. No database setup is required.

For Phase 2 (when Prisma is enabled):

```bash
# Generate Prisma Client
yarn db:generate

# Create database and apply schema
yarn db:push

# OR use migrations (recommended)
yarn db:migrate
```

### 4. Verify Installation

```bash
# Start development server
yarn dev

# Should start on http://localhost:3000
# Check for any errors in console
```

### 5. Test API Endpoints

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test register endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## Environment Variables

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `DATABASE_URL` | Prisma database connection string | `file:./prisma/dev.db` | For Phase 2 (not used currently) |
| `NODE_ENV` | Environment mode | `development` or `production` | - |
| `GAPGPT_API_KEY` | API key for GAPGPT service | `your_api_key_here` | **Required for risk assessment** |
| `GAPGPT_BASE_URL` | Base URL for GAPGPT service | `https://api.example.com` | **Required for risk assessment** |
| `GAPGPT_MODEL` | AI model name to use | `gpt-4` | **Required for risk assessment** |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `LOG_FILE_PATH` | Path to log file | `./logs/app.log` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default locale | `fa` |
| `JWT_SECRET` | JWT secret key (for future use) | - |
| `JWT_EXPIRES_IN` | JWT expiration time (for future use) | `7d` |

## Project Structure Verification

Verify the following structure exists:

```
novina/
├── .env.example          # Environment template
├── .env.local            # Your local environment (not in git)
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database (created after setup)
├── src/
│   ├── app/              # Next.js App Router
│   ├── domains/          # Domain-based structure
│   │   ├── auth/         # Authentication domain
│   │   ├── content/      # Content domain
│   │   ├── risk/         # Risk assessment domain
│   │   └── user/         # User domain
│   ├── shared/           # Shared utilities
│   │   ├── lib/          # Utility functions
│   │   │   └── password.ts  # Password hashing
│   │   ├── types/        # Shared types
│   │   │   └── errors.ts    # Error handling
│   │   └── ui/           # UI components
│   ├── infrastructure/  # Infrastructure
│   │   ├── database/     # Database setup
│   │   └── logging/      # Logging setup
│   └── i18n/            # Internationalization
└── docs/                 # Documentation
```

## Dependencies Verification

### Core Dependencies

- [x] Next.js 14
- [x] React 18
- [x] TypeScript 5
- [x] Prisma (currently disabled in Phase 1)
- [x] Tailwind CSS
- [x] next-intl
- [x] Winston (logging)
- [x] bcryptjs (password hashing)
- [x] Zod (validation)
- [x] OpenAI SDK (for GAPGPT integration)
- [x] Chart.js + react-chartjs-2 (for portfolio charts)

### Verify Installation

```bash
# Check if all dependencies are installed
yarn install

# Should complete without errors
```

## Known Limitations / TODOs

### Current Limitations (Phase 1)

1. **Prisma Disabled** - Prisma Client is currently disabled. Data is stored in localStorage. Will be enabled in Phase 2.
2. **JWT Authentication** - Not yet implemented (planned for Phase 2)
3. **Session Management** - Not yet implemented (planned for Phase 2)
4. **Password Reset** - Not yet implemented
5. **Email Verification** - Not yet implemented
6. **Rate Limiting** - Not yet implemented
7. **Testing Framework** - Not yet set up
8. **Database Persistence** - Currently using localStorage. Will migrate to database in Phase 2.

### Future Enhancements

- [ ] JWT token generation and validation
- [ ] Session management with cookies
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Rate limiting for API endpoints
- [ ] Unit and integration tests
- [ ] E2E tests with Playwright/Cypress

## Development Workflow

### Starting Development

1. Ensure all prerequisites are met
2. Environment variables are configured (especially GAPGPT variables for risk assessment)
3. Database setup is optional in Phase 1 (Prisma is disabled)
4. Development server runs without errors
5. API endpoints respond correctly
6. Risk assessment feature works (requires GAPGPT configuration)

### Before Starting a New Feature

1. Review relevant domain structure
2. Check existing similar implementations
3. Review agent documentation (`.cursor/agents/`)
4. Follow coding standards (`.cursor/rules.md`)
5. Plan database changes (if needed)

### Code Standards

- Use TypeScript strict mode
- All comments in English
- Follow MVC + Domain-based architecture
- Use standardized error handling
- Validate all inputs with Zod
- Hash passwords with bcryptjs
- Log important events

## Troubleshooting

### Database Issues

```bash
# Reset database (WARNING: Deletes all data)
yarn prisma migrate reset

# Regenerate Prisma Client
yarn db:generate

# Check database connection
yarn db:studio
```

### Environment Issues

- Verify `.env.local` exists and has correct values
- Check `DATABASE_URL` format (for SQLite: `file:./prisma/dev.db`) - Optional in Phase 1
- Ensure `NODE_ENV` is set correctly
- **Important**: Verify GAPGPT variables are set correctly (`GAPGPT_API_KEY`, `GAPGPT_BASE_URL`, `GAPGPT_MODEL`) - Required for risk assessment
- If risk assessment fails, check GAPGPT configuration

### Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next
yarn build
```

## Next Steps

Once all checklist items are completed:

1. ✅ Project is ready for feature development
2. Start implementing first feature (portfolio management or risk assessment)
3. Follow domain-based architecture
4. Use existing patterns and utilities
5. Document new features

## Support

For issues or questions:
- Review documentation in `docs/` directory
- Check agent documentation in `.cursor/agents/`
- Review code examples in existing domains


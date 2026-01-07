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
- [ ] **Database Initialized**
  ```bash
  yarn db:generate  # Generate Prisma Client
  yarn db:push      # Create database and apply schema
  # OR
  yarn db:migrate   # Use migrations (recommended for production)
  ```
- [ ] **Database Connection Verified** - Test with `yarn db:studio`

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
# - DATABASE_URL
# - NODE_ENV
# - LOG_LEVEL (optional, defaults to "info")
```

### 3. Database Setup

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

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./prisma/dev.db` |
| `NODE_ENV` | Environment mode | `development` or `production` |

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
- [x] Prisma
- [x] Tailwind CSS
- [x] next-intl
- [x] Winston (logging)
- [x] bcryptjs (password hashing)
- [x] Zod (validation)

### Verify Installation

```bash
# Check if all dependencies are installed
yarn install

# Should complete without errors
```

## Known Limitations / TODOs

### Current Limitations

1. **JWT Authentication** - Not yet implemented (planned)
2. **Session Management** - Not yet implemented (planned)
3. **Password Reset** - Not yet implemented
4. **Email Verification** - Not yet implemented
5. **Rate Limiting** - Not yet implemented
6. **Testing Framework** - Not yet set up

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
2. Environment variables are configured
3. Database is set up and migrated
4. Development server runs without errors
5. API endpoints respond correctly

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
- Check `DATABASE_URL` format (for SQLite: `file:./prisma/dev.db`)
- Ensure `NODE_ENV` is set correctly

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


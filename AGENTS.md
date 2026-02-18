# Cursor agents

This project uses Cursor agents to keep backend, frontend, and database work consistent.

## Agent roles

| Agent   | Purpose |
|--------|---------|
| **Backend**  | API routes, domain logic (controllers, services, repositories), Prisma, validation, error handling. |
| **Frontend** | React components, Next.js pages, shadcn/ui, RTL/i18n, mobile-first UI. |
| **Database** | Prisma schema, migrations, query optimization, indexes, seed data. |

## Where to look

- **Agent instructions:** `.cursor/agents/`
  - [backend.md](.cursor/agents/backend.md)
  - [frontend.md](.cursor/agents/frontend.md)
  - [database.md](.cursor/agents/database.md)
- **Project-wide rules:** [.cursor/rules.md](.cursor/rules.md)
- **Docs (architecture, development, features):** [docs/](docs/)

Use the right agent for the task and follow the rules and docs so the codebase stays consistent.

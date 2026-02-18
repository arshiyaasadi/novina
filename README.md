# Novina

Smart portfolio management and investment platform.

## About the project

Novina is a financial platform that helps users to:
- **Build and manage** their financial portfolio
- **Define their risk level** based on investment profile
- **Get suitable investment funds** recommendations
- **Receive credit/loan** for investment
- **Invest** in suggested funds using the loan and earn returns

### Project goal

The main goal of Novina is to let users receive credit, invest in suggested investment funds, and benefit from their portfolio returns.

> **Note**: In the initial version, the number of investment funds is limited and will be expanded in the future.

## Platform features

### Functional
- Portfolio construction and management
- Investment risk level definition
- Suitable investment fund recommendations
- Credit/loan for investment
- Portfolio returns and performance tracking

### Technical
- Next.js 14 with App Router
- Tailwind CSS + shadcn/ui
- Internationalization (i18n) with next-intl
- Dark/Light mode
- Mobile-first design
- RTL support for Persian
- Prisma + SQLite (Prisma currently disabled)
- Logging with Winston
- MVC + domain-based architecture
- AI integration (GAPGPT) for risk assessment
- localStorage for temporary data

## Tech stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Prisma + SQLite (Prisma currently disabled)
- **Storage**: localStorage (for temporary data)
- **AI**: OpenAI SDK (GAPGPT) for risk assessment
- **i18n**: next-intl
- **Theme**: next-themes
- **Logging**: Winston
- **Charts**: Chart.js + react-chartjs-2

## Setup

### Prerequisites

- Node.js 18+
- Yarn or npm

### Install

```bash
# Clone repository
git clone <repository-url>
cd novina

# Install dependencies
yarn install

# Copy environment file
cp .env.example .env.local

# Setup database
yarn db:generate
yarn db:push

# Run development server
yarn dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
# Development
yarn dev          # Start dev server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint

# Database
yarn db:generate  # Generate Prisma Client
yarn db:push      # Push schema to database
yarn db:migrate   # Run migrations
yarn db:studio    # Open Prisma Studio
```

## Project structure

```
novina/
├── .cursor/              # Cursor AI configuration
├── docs/                 # Documentation
├── prisma/               # Prisma schema
├── src/
│   ├── app/              # Next.js App Router
│   ├── domains/          # Domain-based structure
│   │   ├── auth/
│   │   ├── content/
│   │   ├── risk/         # Risk assessment domain
│   │   └── user/
│   ├── shared/           # Shared code
│   │   ├── components/
│   │   ├── ui/
│   │   └── samples/
│   ├── infrastructure/   # Infrastructure
│   │   ├── database/
│   │   └── logging/
│   └── i18n/             # Internationalization
└── public/               # Static files
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Development guide](./docs/development.md)
- [Design system](./docs/design-system.md)
- [Database](./docs/database.md)
- [Deployment](./docs/deployment.md)
- [Features](./docs/features/) — [Loan flow](./docs/features/loan-flow.md), [Assets trade](./docs/features/assets-trade-flow.md), [Wallet flows](./docs/features/wallet-flows.md), [Activities & installments](./docs/features/activities-and-installments.md), [Investment flow](./docs/features/investment-flow.md)

## Development

For more on development, see the [Development guide](./docs/development.md).

## Project status

**Phase 1 complete (v1.0.0)**

Phase 1 is complete and the project is ready to use. All main features are implemented.

### Implemented features (Phase 1)

- **Risk assessment**: AI-based risk assessment (GAPGPT), interactive questionnaire, risk profiles (conservative, balanced, aggressive), fund recommendations.
- **Investment**: Full investment flow with loan option; 3/6/9 month terms; automatic loan, interest, and installment calculation; invoice and receipt generation.
- **Portfolio management**: Pie chart, current value per fund, price change line chart, suggested vs active portfolio comparison.
- **Installment tracking**: Installment management page, due dates, payment status.
- **Assets**: User assets page, fund details, profit/loss tracking.
- **User profile**: User info and app settings.

## Roadmap

### Phase 1 (complete)
- [x] Auth flow
- [x] User risk profile
- [x] Fund recommendations
- [x] Credit/loan system
- [x] Portfolio dashboard
- [x] Returns and performance tracking
- [x] Invoice and receipt

### Phase 2 (planned)
- [ ] Real database (currently localStorage)
- [ ] Enable Prisma
- [ ] Full auth with JWT
- [ ] Session management
- [ ] More investment funds
- [ ] Real pricing APIs
- [ ] Notifications
- [ ] Advanced reporting

## Contributing

The project is under active development; a contribution guide will be added later.

## License

MIT License

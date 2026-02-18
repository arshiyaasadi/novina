# Activities and installments

This document describes the activities (transaction history) and loan installments flows.

## Activities page

**Route:** `/app/activities`  
**File:** `src/app/(main)/app/activities/page.tsx`

- Shows a list of user activities (e.g. investments, loans, wallet operations).
- Data can come from local state, localStorage, or (in Phase 2) from APIs.
- Entry point to drill into installments and other details.

## Installments page

**Route:** `/app/activities/installments`  
**File:** `src/app/(main)/app/activities/installments/page.tsx`

- Shows loan installments: due dates, amounts, payment status.
- Installment payment state is stored in localStorage (e.g. keys like `installment_*_paid`) in Phase 1; see [database.md](../database.md) for current persistence approach.
- User can view due dates and mark or simulate payments.

## Data sources (Phase 1)

- **Activities list:** Built from local data (e.g. loan requests from `loanRequests`, trade orders from `assetTradeOrders`, main wallet journal from `main-wallet-storage`).
- **Installments:** Derived from loan flow data (amount, period) and any stored payment flags in localStorage.

## Related files

- **Activities:** `src/app/(main)/app/activities/page.tsx`
- **Installments:** `src/app/(main)/app/activities/installments/page.tsx`
- **Loan flow (for installment source):** [loan-flow.md](loan-flow.md), `src/app/(main)/app/credit/loan/lib/loan-flow-storage.ts`
- **Main wallet journal:** `src/app/(main)/app/wallet/lib/main-wallet-storage.ts`

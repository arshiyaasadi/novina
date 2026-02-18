# Investment flow

This document describes the investment list, invoice, and receipt flows.

## Pages and routes

| Route | File | Purpose |
|-------|------|--------|
| `/app/investment` | `src/app/(main)/app/investment/page.tsx` | Investment list / history |
| `/app/investment/invoice` | `src/app/(main)/app/investment/invoice/page.tsx` | Investment invoice (before payment) |
| Receipt (separate layout) | `src/app/(receipt)/app/investment/receipt/page.tsx` | Investment receipt (after completion) |

- **Investment list:** Shows user’s investments (e.g. from localStorage or future API); user can open invoice or receipt.
- **Invoice:** Generated during the trade flow (e.g. from assets trade); shows amount, fund, payment source (main wallet). Uses layout in `src/app/(main)/app/investment/invoice/layout.tsx`.
- **Receipt:** Shown after an investment is completed; uses the `(receipt)` route group for a dedicated receipt layout/print view.

## Data flow

1. User starts issue/redeem from [assets trade](assets-trade-flow.md); order is stored via `trade-orders-storage.ts`.
2. Invoice step shows order details and wallet balance; user confirms.
3. On confirmation, order status is updated (e.g. to `completed`); receipt can be shown.
4. Investment list aggregates completed (and optionally pending) orders for display.

## Related files

- **List:** `src/app/(main)/app/investment/page.tsx`
- **Invoice:** `src/app/(main)/app/investment/invoice/page.tsx`, `invoice/layout.tsx`
- **Receipt:** `src/app/(receipt)/app/investment/receipt/page.tsx`
- **Trade orders:** `src/app/(main)/app/assets/lib/trade-orders-storage.ts`, [assets-trade-flow.md](assets-trade-flow.md)
- **Main wallet:** [main-wallet.md](../main-wallet.md)

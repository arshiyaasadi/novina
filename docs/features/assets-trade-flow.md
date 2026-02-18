# Assets trade flow

This document describes how asset trade (issue/redeem) orders are stored and how the flow works.

## Types and storage

### Types

Defined in `src/app/(main)/app/assets/lib/trade-orders-storage.ts`:

- **`TradeOrderType`**: `"issue"` | `"redeem"`
- **`TradeOrderStatus`**: `"draft"` | `"pending"` | `"completed"` | `"expired"` | `"cancelled"`
- **`StoredTradeOrder`**: `id`, `type`, `fundId`, `fundName`, `pricePerUnit`, `units`, `amount`, `status`, `createdAt` (ISO), `expiresAt` (ISO)

### Storage key

- **`assetTradeOrders`** — localStorage key for the list of trade orders.

### Invoice validity

Each new order gets an `expiresAt` set to 2 minutes from creation (e.g. for invoice time limit).

## Storage API

Same file `trade-orders-storage.ts`:

- **`getTradeOrders()`** — returns all stored orders.
- **`addTradeOrder(order)`** — adds an order (id, createdAt, expiresAt set automatically); returns the created order.
- **`updateTradeOrderStatus(id, status)`** — updates the status of an order by id.

## Page flow

1. **Assets list:** `src/app/(main)/app/assets/page.tsx` — lists funds/assets; user can start issue or redeem.
2. **Trade (issue/redeem):** `src/app/(main)/app/assets/trade/page.tsx` — full trade flow: fund selection, amount/units, wallet selection, invoice, and confirmation. Uses `addTradeOrder` and `updateTradeOrderStatus` and integrates with main wallet (see [main-wallet.md](../main-wallet.md)).

## Related files

- **Storage:** `src/app/(main)/app/assets/lib/trade-orders-storage.ts`
- **Assets page:** `src/app/(main)/app/assets/page.tsx`
- **Trade page:** `src/app/(main)/app/assets/trade/page.tsx`
- **Main wallet (payment source):** `src/app/(main)/app/wallet/lib/main-wallet-storage.ts`, [main-wallet.md](../main-wallet.md)

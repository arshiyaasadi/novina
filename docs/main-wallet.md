# Main wallet

## Definition

The **main wallet** represents the total balance available for investment (fund unit issuance). Total value is the sum of:

- **Wallet balance:** Cash the user has deposited into the wallet.
- **Sum of credits:** Loan credit, fund paper credit, crypto credit, and TWIN credit.

```
Total value = wallet balance + loan credit + fund paper credit + crypto credit + TWIN credit
```

All of these are usable for **investment (issuance)**; the user can see them at the issuance invoice step and (in later phases) choose the payment source.

---

## Sources

| Source              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Wallet balance**  | Amount added by deposit and reduced by withdrawal.                          |
| **Loan credit**     | Credit from loan facilities.                                                |
| **Fund paper credit** | Credit from fund papers.                                                 |
| **Crypto credit**  | Credit related to crypto assets.                                           |
| **TWIN credit**     | TWIN credit.                                                               |

All amounts are stored and displayed in **Toman**.

---

## Journal (transaction history)

For clarity and accounting, every change to balance or credits is recorded in the **wallet journal**. Event types include:

- **Deposit** to wallet
- **Withdrawal** from wallet
- **Loan / fund paper / crypto / TWIN credit** (when credit is allocated)
- **Use for issuance** (when paying from wallet for fund units)
- **Redemption** (amount received from unit redemption)

The journal is maintained in one place (the `main-wallet-storage` module) and shown in the “Wallet journal” section on the main page wallet card.

---

## Implementation locations

- **Storage and API:** `src/app/(main)/app/wallet/lib/main-wallet-storage.ts`
- **Main page:** Wallet and journal display in `src/app/(main)/app/page.tsx`
- **Issuance invoice step:** “Wallet and balances” display in `src/app/(main)/app/assets/trade/page.tsx` (for issuance orders only)

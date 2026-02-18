# Wallet flows

This document covers wallet registration, deposit, withdraw, and how they relate to the main wallet.

## Main wallet

The **main wallet** (balance and credits) is documented in [main-wallet.md](../main-wallet.md). Implementation: `src/app/(main)/app/wallet/lib/main-wallet-storage.ts`.

- Balance and credits (loan, funds, crypto, twin) are stored in localStorage.
- Journal entries (deposit, withdraw, credit_*, use_for_issue, redeem) are in the same module.

## Wallet state (register / addresses)

`src/app/(main)/app/wallet/lib/wallet-storage.ts`:

- **`WalletState`**: `walletRegistered`, `walletMnemonicBackedUp`, `walletAddresses` (usdt, btc), `walletBalances` (usdt, btc).
- Keys: `walletRegistered`, `walletMnemonicBackedUp`, `walletAddresses`, `walletBalances`.

Used for the “wallet” product (crypto addresses and backup state), separate from the main wallet balance used for fund issuance.

## Pages under `app/wallet/`

| Route              | File                                      | Purpose                          |
|--------------------|-------------------------------------------|----------------------------------|
| `/app/wallet`      | `src/app/(main)/app/wallet/page.tsx`      | Wallet overview / main wallet    |
| `/app/wallet/register` | `src/app/(main)/app/wallet/register/page.tsx` | Wallet registration flow   |
| `/app/wallet/deposit`  | `src/app/(main)/app/wallet/deposit/page.tsx`  | Deposit to main wallet      |
| `/app/wallet/withdraw` | `src/app/(main)/app/wallet/withdraw/page.tsx`  | Withdraw from main wallet   |

- **Register:** User registers a wallet (mnemonic backup, addresses); state saved via `wallet-storage.ts`.
- **Deposit/Withdraw:** Update main wallet balance and journal via `main-wallet-storage.ts`.

## Summary

- **Main wallet (balance + credits + journal):** `main-wallet-storage.ts`; used in app main page and in assets trade for payment source.
- **Wallet product (register, addresses, balances):** `wallet-storage.ts`; used in wallet register and wallet overview.
- All amounts in main wallet are in Toman; wallet-storage addresses/balances are for display (e.g. USDT/BTC).

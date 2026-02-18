# Loan (credit) flow

This document describes the behavior and persistence of the loan request flow.

## Flow steps (5 steps)

| Step | Title                         | Persisted data                                      |
|------|-------------------------------|-----------------------------------------------------|
| 1    | Loan amount and repayment terms | `loanAmount`, `selectedPeriod`                    |
| 2    | Installments                  | (derived from amount and period)                    |
| 3    | Credit report                 | `videoVerificationNationalId`, `creditReportRequested` |
| 4    | Video verification            | `videoVerificationSuccess`                         |
| 5    | Receive loan and accept contract | `isAgreementAccepted`                           |

All of these fields, plus `step` and `updatedAt`, are saved to the **draft** on every change.

## Persistence (localStorage)

### Keys

- **`loanFlowDraft`**: Draft of the request in progress. Updated whenever the user is in the flow and state changes.
- **`loanRequests`**: Array of submitted requests (after contract signing).

### Draft structure (`LoanFlowDraft`)

```ts
{
  loanAmount: number;
  selectedPeriod: LoanPeriod | null;
  step: 1 | 2 | 3 | 4 | 5;
  videoVerificationNationalId: string;
  creditReportRequested: boolean;
  videoVerificationSuccess: boolean;
  isAgreementAccepted: boolean;
  updatedAt: string; // ISO
}
```

### When data is saved and cleared

- **Save:** Whenever the user is in the flow (`showFlow === true`) and any of the above fields or `step` changes, `loanFlowDraft` is written to localStorage.
- **Clear:** After “Sign contract” (submit request), `loanFlowDraft` is cleared and the new request is appended to `loanRequests`.

## Loan requests list

- **Draft:** If `loanFlowDraft` exists, it appears as the first item with a label like “In progress – step X of 5” and the amount and last updated time. Clicking it reopens the flow at that step with the same data.
- **Submitted requests:** Loaded from `loanRequests` (localStorage). If empty, `MOCK_LOAN_REQUESTS` is used for demo.
- **“New loan” button:** If a draft exists, clicking opens that draft and continues from the saved step; otherwise the flow starts at step 1 with current amount/period.

## Related files

- **Flow page:** `src/app/(main)/app/credit/loan/page.tsx`
- **Storage/load:** `src/app/(main)/app/credit/loan/lib/loan-flow-storage.ts`
- **Credit report step:** `src/shared/components/credit/credit-report-step.tsx`
- **Video verification modal:** `src/shared/components/credit/video-verification-modal.tsx`

## Feature status

The loan flow with draft persistence and request list is considered complete. Real API integration for credit score and video upload can be added in later versions.

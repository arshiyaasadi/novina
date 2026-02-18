/**
 * ذخیره و بازیابی پیش‌نویس درخواست وام و لیست درخواست‌های ثبت‌شده.
 * همه‌ی دیتای فلو وام در هر مرحله در localStorage پرسیست می‌شود.
 */

export type LoanPeriod = 3 | 6 | 9 | 12;

export type LoanFlowDraft = {
  loanAmount: number;
  selectedPeriod: LoanPeriod | null;
  step: 1 | 2 | 3 | 4 | 5;
  videoVerificationNationalId: string;
  creditReportRequested: boolean;
  videoVerificationSuccess: boolean;
  isAgreementAccepted: boolean;
  /** زمان آخرین به‌روزرسانی (ISO) برای نمایش در لیست */
  updatedAt: string;
};

export type LoanStatus = "cancelled" | "rejected" | "pending" | "granted" | "active";

export interface StoredLoanRequest {
  id: string;
  amount: number;
  requestedAt: string;
  status: LoanStatus;
  statusLabel: string;
  statusBadgeClass: string;
  interest: number;
  months: LoanPeriod;
  monthlyInstallment: number;
  totalPayable: number;
  firstDueDate: string;
  rejectReason?: string;
}

const LOAN_FLOW_DRAFT_KEY = "loanFlowDraft";
const LOAN_REQUESTS_KEY = "loanRequests";

export function getLoanFlowDraft(): LoanFlowDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOAN_FLOW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoanFlowDraft;
    if (parsed && typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= 5) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setLoanFlowDraft(draft: LoanFlowDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOAN_FLOW_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearLoanFlowDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOAN_FLOW_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function getLoanRequests(): StoredLoanRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOAN_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is StoredLoanRequest =>
        r && typeof r.id === "string" && typeof r.amount === "number" && r.requestedAt
    );
  } catch {
    return [];
  }
}

export function addLoanRequest(request: StoredLoanRequest): void {
  const existing = getLoanRequests();
  existing.unshift(request);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOAN_REQUESTS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Banknote, Landmark, Coins, Sparkles, ArrowLeft, Info, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { CreditReportStep } from "@/shared/components/credit/credit-report-step";
import { VideoVerificationModal } from "@/shared/components/credit/video-verification-modal";
import {
  getLoanFlowDraft,
  setLoanFlowDraft,
  clearLoanFlowDraft,
  getLoanRequests,
  addLoanRequest,
} from "./lib/loan-flow-storage";
import type { StoredLoanRequest } from "./lib/loan-flow-storage";
import { appendMainWalletJournalEntry } from "../../wallet/lib/main-wallet-storage";
import { useMainWalletStore } from "../../wallet/store/main-wallet-store";

type LoanPeriod = 3 | 6 | 9 | 12;

const LOAN_OPTIONS: { months: LoanPeriod; interest: number; label: string; subtitle: string }[] = [
  { months: 3, interest: 3.5, label: "۳ ماه", subtitle: "(3.5% سود)" },
  { months: 6, interest: 6, label: "۶ ماه", subtitle: "(6% سود)" },
  { months: 9, interest: 11, label: "۹ ماه", subtitle: "(11% سود)" },
  { months: 12, interest: 12, label: "۱۲ ماه", subtitle: "(12% سود)" },
];

type LoanStatus = "cancelled" | "rejected" | "pending" | "granted" | "active";

export interface LoanRequest {
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

export const MOCK_LOAN_REQUESTS: LoanRequest[] = [
  {
    id: "req-1",
    amount: 20_000_000,
    requestedAt: "2026-02-10T00:00:00.000Z",
    status: "pending",
    statusLabel: "در انتظار تایید",
    statusBadgeClass: "bg-amber-100 text-amber-700",
    interest: 6,
    months: 6,
    monthlyInstallment: 3_533_333,
    totalPayable: 21_200_000,
    firstDueDate: "2026-03-26T00:00:00.000Z",
  },
  {
    id: "req-2",
    amount: 30_000_000,
    requestedAt: "2026-01-15T00:00:00.000Z",
    status: "active",
    statusLabel: "فعال",
    statusBadgeClass: "bg-emerald-100 text-emerald-700",
    interest: 6,
    months: 9,
    monthlyInstallment: 3_700_000,
    totalPayable: 33_300_000,
    firstDueDate: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "req-3",
    amount: 15_000_000,
    requestedAt: "2025-12-01T00:00:00.000Z",
    status: "granted",
    statusLabel: "در انتظار واریز",
    statusBadgeClass: "bg-blue-100 text-blue-700",
    interest: 3.5,
    months: 3,
    monthlyInstallment: 5_175_000,
    totalPayable: 15_525_000,
    firstDueDate: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "req-4",
    amount: 12_000_000,
    requestedAt: "2025-11-10T00:00:00.000Z",
    status: "cancelled",
    statusLabel: "لغو شده",
    statusBadgeClass: "bg-slate-100 text-slate-600",
    interest: 6,
    months: 6,
    monthlyInstallment: 2_120_000,
    totalPayable: 12_720_000,
    firstDueDate: "2025-12-15T00:00:00.000Z",
  },
  {
    id: "req-5",
    amount: 25_000_000,
    requestedAt: "2025-10-05T00:00:00.000Z",
    status: "rejected",
    statusLabel: "رد شده",
    statusBadgeClass: "bg-red-100 text-red-700",
    interest: 6,
    months: 6,
    monthlyInstallment: 4_416_667,
    totalPayable: 26_500_000,
    firstDueDate: "2025-11-10T00:00:00.000Z",
    rejectReason: "نمره اعتبارسنجی کافی نیست.",
  },
];

const MIN_LOAN = 10_000_000;
const MAX_LOAN = 100_000_000;
const STEP_LOAN = 1_000_000;

const LOAN_STEP_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "مبلغ و مدت بازپرداخت",
  2: "اقساط",
  3: "گزارش اعتبار سنجی",
  4: "احراز هویت ویدیویی",
  5: "قرارداد",
};

const LOAN_STEP_CHECKLIST: { step: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { step: 1, label: "انتخاب مبلغ وام و مدت بازپرداخت" },
  { step: 2, label: "مشاهده دفترچه اقساط و جزییات" },
  { step: 3, label: "دریافت گزارش اعتبار سنجی (کد ملی و استعلام رتبه)" },
  { step: 4, label: "احراز هویت ویدیویی (ضبط ویدیو کوتاه)" },
  { step: 5, label: "خواندن و امضای قرارداد به‌صورت آنلاین" },
];

export const formatNumber = (num: number): string =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const normalizeAmountInput = (raw: string): { digits: string; amount: number } => {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  let digits = "";
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      digits += ch;
    } else {
      const pIndex = persianDigits.indexOf(ch);
      const aIndex = arabicDigits.indexOf(ch);
      if (pIndex !== -1) {
        digits += String(pIndex);
      } else if (aIndex !== -1) {
        digits += String(aIndex);
      }
    }
  }
  if (!digits) return { digits: "", amount: 0 };
  const amount = Number(digits);
  return { digits, amount };
};

const clampToStep = (value: number): number => {
  if (value <= 0) return 0;
  const clamped = Math.max(MIN_LOAN, Math.min(MAX_LOAN, value));
  const steps = Math.round(clamped / STEP_LOAN);
  return steps * STEP_LOAN;
};

interface LoanDetails {
  interestAmount: number;
  totalPayable: number;
  monthlyInstallment: number;
  firstDueDate: Date;
  installments: { number: number; dueDate: Date; amount: number }[];
}

export default function LoanCreditPage() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState<number>(10_000_000);
  const [rawAmountInput, setRawAmountInput] = useState<string>(formatNumber(10_000_000));
  const [selectedPeriod, setSelectedPeriod] = useState<LoanPeriod | null>(6);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [videoVerificationNationalId, setVideoVerificationNationalId] = useState("");
  const [creditReportRequested, setCreditReportRequested] = useState(false);
  const [videoVerificationModalOpen, setVideoVerificationModalOpen] = useState(false);
  const [videoVerificationSuccess, setVideoVerificationSuccess] = useState(false);
  const [loanRequestsGuideOpen, setLoanRequestsGuideOpen] = useState(false);

  // بارگذاری اولیه مبلغ/دوره (وقتی پیش‌نویس نداریم یا برای اولین بار)
  useEffect(() => {
    try {
      const savedAmount = localStorage.getItem("creditLoanAmount");
      const savedPeriod = localStorage.getItem("creditLoanPeriod");
      if (savedAmount) {
        const parsed = Number(savedAmount);
        if (!Number.isNaN(parsed)) {
          const normalized = clampToStep(parsed);
          setLoanAmount(normalized);
          setRawAmountInput(formatNumber(normalized));
        }
      }
      if (savedPeriod) {
        const parsed = Number(savedPeriod) as LoanPeriod;
        if ([3, 6, 9, 12].includes(parsed)) {
          setSelectedPeriod(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // پرسیست پیش‌نویس در هر مرحله وقتی کاربر داخل فلو است
  useEffect(() => {
    if (!showFlow) return;
    setLoanFlowDraft({
      loanAmount,
      selectedPeriod,
      step,
      videoVerificationNationalId,
      creditReportRequested,
      videoVerificationSuccess,
      isAgreementAccepted,
      updatedAt: new Date().toISOString(),
    });
  }, [
    showFlow,
    loanAmount,
    selectedPeriod,
    step,
    videoVerificationNationalId,
    creditReportRequested,
    videoVerificationSuccess,
    isAgreementAccepted,
  ]);

  // اگر مبلغ کمتر از ۵۰ میلیون شد، دوره ۱۲ ماهه معتبر نیست
  useEffect(() => {
    if (loanAmount < 50_000_000 && selectedPeriod === 12) {
      setSelectedPeriod(9);
    }
  }, [loanAmount, selectedPeriod]);

  const loanDetails: LoanDetails | null = useMemo(() => {
    if (!selectedPeriod) return null;
    if (loanAmount < MIN_LOAN || loanAmount > MAX_LOAN) return null;

    const option = LOAN_OPTIONS.find((opt) => opt.months === selectedPeriod);
    if (!option) return null;

    const interestAmount = Math.round((loanAmount * option.interest) / 100);
    const totalPayable = loanAmount + interestAmount;
    const monthlyInstallment = Math.round(totalPayable / selectedPeriod);

    const firstDueDate = new Date();
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    firstDueDate.setHours(0, 0, 0, 0);

    const installments: LoanDetails["installments"] = [];
    for (let i = 0; i < selectedPeriod; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        number: i + 1,
        dueDate,
        amount: monthlyInstallment,
      });
    }

    return {
      interestAmount,
      totalPayable,
      monthlyInstallment,
      firstDueDate,
      installments,
    };
  }, [loanAmount, selectedPeriod]);

  const handleAmountChange = (value: string) => {
    setRawAmountInput(value);
    const { amount } = normalizeAmountInput(value);
    const normalized = clampToStep(amount);
    if (normalized === 0) {
      setLoanAmount(0);
      return;
    }
    setLoanAmount(normalized);
  };

  const handleAmountBlur = () => {
    if (loanAmount === 0) {
      setRawAmountInput("");
    } else {
      setRawAmountInput(formatNumber(loanAmount));
    }
  };

  const isValidAmount = loanAmount >= MIN_LOAN && loanAmount <= MAX_LOAN;
  const canShowInvoice = isValidAmount && !!selectedPeriod && !!loanDetails;

  const visibleLoanOptions =
    loanAmount >= 50_000_000
      ? LOAN_OPTIONS
      : LOAN_OPTIONS.filter((opt) => opt.months !== 12);

  const handleSignContract = () => {
    if (!loanDetails || !selectedPeriod) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        const option = LOAN_OPTIONS.find((opt) => opt.months === selectedPeriod);
        const newRequest: StoredLoanRequest = {
          id: `loan-${Date.now()}`,
          amount: loanAmount,
          requestedAt: new Date().toISOString(),
          status: "active",
          statusLabel: "فعال",
          statusBadgeClass: "bg-emerald-100 text-emerald-700",
          interest: option?.interest ?? 0,
          months: selectedPeriod,
          monthlyInstallment: loanDetails.monthlyInstallment,
          totalPayable: loanDetails.totalPayable,
          firstDueDate: loanDetails.firstDueDate.toISOString(),
        };

        addLoanRequest(newRequest);
        clearLoanFlowDraft();

        // به‌روزرسانی اعتبار وام در کیف پول و موجودی کیف پول
        const { walletCredits: credits, setWalletCredits: setCredits, mainWalletBalance: prevBalance, setMainWalletBalance: setBalance } = useMainWalletStore.getState();
        setCredits({ ...credits, loan: credits.loan + loanAmount });
        setBalance(Math.max(0, prevBalance + loanAmount));

        appendMainWalletJournalEntry({
          type: "credit_loan",
          amount: loanAmount,
          source: "loan",
          description: "اعتبار وام",
        });
      }
    } catch (error) {
      console.error("Failed to store loan request:", error);
    }

    router.push("/app");
  };

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">دریافت اعتبار نقدی</h1>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="بازگشت"
            onClick={() => router.push("/app/credit")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* بخش توضیحات فلو و دکمه شروع جرنی */}
        {!showFlow && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اعتبار نقدی با وام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const draftForCard = getLoanFlowDraft();
                return (
                  <>
                    <p className="text-sm text-muted-foreground">
                      با وام نقدی نوین، می‌تونی بدون خالی‌کردن حسابت، سرمایه‌گذاری رو شروع یا تقویت کنی. فقط مبلغ و مدت
                      بازپرداخت رو انتخاب می‌کنی و بقیه مسیر رو ما برات هموار می‌کنیم.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-2 pr-4">
                      {LOAN_STEP_CHECKLIST.map(({ step: stepNum, label }) => {
                        const done = !!draftForCard && draftForCard.step > stepNum;
                        return (
                          <li
                            key={stepNum}
                            className={`flex items-center gap-2 ${done ? "text-muted-foreground" : ""}`}
                          >
                            <span
                              className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                                done
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/50"
                              }`}
                            >
                              {done ? <Check className="h-3 w-3" /> : <span className="text-[10px]">{stepNum}</span>}
                            </span>
                            <span className={done ? "line-through opacity-80" : ""}>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="pt-2">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          const draft = getLoanFlowDraft();
                          if (draft) {
                            setLoanAmount(draft.loanAmount);
                            setRawAmountInput(formatNumber(draft.loanAmount));
                            setSelectedPeriod(draft.selectedPeriod);
                            setStep(draft.step);
                            setVideoVerificationNationalId(draft.videoVerificationNationalId);
                            setCreditReportRequested(draft.creditReportRequested);
                            setVideoVerificationSuccess(draft.videoVerificationSuccess);
                            setIsAgreementAccepted(draft.isAgreementAccepted);
                          } else {
                            setStep(1);
                            setCreditReportRequested(false);
                            setVideoVerificationSuccess(false);
                            setIsAgreementAccepted(false);
                          }
                          setShowFlow(true);
                          window.scrollTo?.({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {draftForCard
                          ? `ادامه: ${LOAN_STEP_LABELS[draftForCard.step]}`
                          : "دریافت وام جدید"}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* سکشن درخواست‌های وام (بدون کارت) */}
        {!showFlow && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">درخواست‌های وام</h2>
              <button
                type="button"
                onClick={() => setLoanRequestsGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                راهنما
              </button>
            </div>
            <div className="space-y-2">
              {(() => {
                const draft = getLoanFlowDraft();
                const savedRequests = getLoanRequests();
                const hasDraft = !!draft;

                return (
                  <>
                    {hasDraft && draft && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoanAmount(draft.loanAmount);
                          setRawAmountInput(formatNumber(draft.loanAmount));
                          setSelectedPeriod(draft.selectedPeriod);
                          setStep(draft.step);
                          setVideoVerificationNationalId(draft.videoVerificationNationalId);
                          setCreditReportRequested(draft.creditReportRequested);
                          setVideoVerificationSuccess(draft.videoVerificationSuccess);
                          setIsAgreementAccepted(draft.isAgreementAccepted);
                          setShowFlow(true);
                          window.scrollTo?.({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full text-right rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors px-3 py-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold tabular-nums">
                              {formatNumber(draft.loanAmount)} تومان
                            </p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              آخرین به‌روزرسانی:{" "}
                              {new Date(draft.updatedAt).toLocaleDateString("fa-IR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700">
                            در حال تکمیل – مرحله {draft.step} از ۵
                          </span>
                        </div>
                      </button>
                    )}
                    {(savedRequests.length > 0 ? savedRequests : MOCK_LOAN_REQUESTS).map(
                      (req: LoanRequest | StoredLoanRequest) => {
                        const requestedDate = new Date(req.requestedAt);
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => {
                              if (req.status === "active") {
                                router.push("/app/activities/installments?index=0");
                              } else {
                                router.push(`/app/credit/loan/${req.id}`);
                              }
                            }}
                            className="w-full text-right rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors px-3 py-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="font-semibold tabular-nums">
                                  {formatNumber(req.amount)} تومان
                                </p>
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                  تاریخ درخواست:{" "}
                                  {requestedDate.toLocaleDateString("fa-IR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium ${req.statusBadgeClass}`}
                              >
                                {req.statusLabel}
                              </span>
                            </div>
                            {req.status === "rejected" && req.rejectReason && (
                              <p className="mt-1 text-[11px] text-red-600">
                                دلیل رد: {req.rejectReason}
                              </p>
                            )}
                          </button>
                        );
                      }
                    )}
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* مودال راهنمای وضعیت درخواست‌های وام */}
        <Dialog open={loanRequestsGuideOpen} onOpenChange={setLoanRequestsGuideOpen}>
          <DialogContent onClose={() => setLoanRequestsGuideOpen(false)}>
            <DialogHeader>
              <DialogTitle>وضعیت درخواست‌های وام</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {[
                {
                  label: "در حال تکمیل",
                  description: "درخواست هنوز تکمیل نشده؛ می‌توانی از لیست ادامه بدهی.",
                  badgeClass: "bg-amber-100 text-amber-700",
                },
                {
                  label: "در انتظار تایید",
                  description: "درخواست ثبت شده و در حال بررسی توسط تیم ماست.",
                  badgeClass: "bg-amber-100 text-amber-700",
                },
                {
                  label: "فعال",
                  description: "وام تأیید و فعال است؛ می‌توانی اقساط را ببینی و پرداخت کنی.",
                  badgeClass: "bg-emerald-100 text-emerald-700",
                },
                {
                  label: "در انتظار واریز",
                  description: "وام تأیید شده و در انتظار واریز به حساب توست.",
                  badgeClass: "bg-blue-100 text-blue-700",
                },
                {
                  label: "لغو شده",
                  description: "درخواست یا وام توسط کاربر یا سامانه لغو شده.",
                  badgeClass: "bg-slate-100 text-slate-600",
                },
                {
                  label: "رد شده",
                  description: "درخواست پس از بررسی رد شده است.",
                  badgeClass: "bg-red-100 text-red-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-lg border p-3 text-right"
                >
                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium ${item.badgeClass}`}
                  >
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground flex-1">{item.description}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {showFlow && step === 1 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">مبلغ وام و شرایط بازپرداخت</CardTitle>
                <span className="text-[11px] text-muted-foreground">مرحله ۱ از ۵</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              {/* مبلغ وام */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="loan-amount-input">
                  مبلغ وام (تومان)
                </label>
                <input
                  id="loan-amount-input"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="مثلاً ۱۰,۰۰۰,۰۰۰"
                  value={rawAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={handleAmountBlur}
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>حداقل مبلغ: {formatNumber(MIN_LOAN)} تومان</span>
                  <span>حداکثر مبلغ: {formatNumber(MAX_LOAN)} تومان</span>
                </div>
                <div className="mt-3">
                  <input
                    type="range"
                    min={MIN_LOAN}
                    max={MAX_LOAN}
                    step={STEP_LOAN}
                    value={isValidAmount ? loanAmount : MIN_LOAN}
                    onChange={(e) => {
                      const next = clampToStep(Number(e.target.value));
                      setLoanAmount(next);
                      setRawAmountInput(formatNumber(next));
                    }}
                    className="w-full"
                  />
                </div>
                {!isValidAmount && (
                  <p className="text-xs text-red-600">
                    مبلغ وام باید بین {formatNumber(MIN_LOAN)} تا {formatNumber(MAX_LOAN)} تومان باشد.
                  </p>
                )}
              </div>

              {/* انتخاب مدت بازپرداخت */}
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">مدت بازپرداخت</p>
                <div className="grid grid-cols-3 gap-2">
                  {visibleLoanOptions.map((opt) => {
                    const isActive = selectedPeriod === opt.months;
                    return (
                      <button
                        key={opt.months}
                        type="button"
                        onClick={() => setSelectedPeriod(opt.months)}
                        className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs transition-colors ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-muted/40 text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-[10px]">{opt.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!canShowInvoice}
                  onClick={() => setStep(2)}
                >
                  دریافت وام
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* فاکتور وام و برنامه اقساط */}
        {showFlow && step === 2 && canShowInvoice && loanDetails && selectedPeriod && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">اقساط</CardTitle>
                <span className="text-[11px] text-muted-foreground">مرحله ۲ از ۵</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">مبلغ وام:</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatNumber(loanAmount)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">نرخ سود:</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {LOAN_OPTIONS.find((opt) => opt.months === selectedPeriod)?.interest}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">مدت بازپرداخت:</span>
                  <span className="text-sm font-semibold">
                    {LOAN_OPTIONS.find((opt) => opt.months === selectedPeriod)?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">مبلغ هر قسط:</span>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {formatNumber(loanDetails.monthlyInstallment)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">سررسید اول وام:</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {loanDetails.firstDueDate.toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-primary/20">
                  <span className="text-xs text-muted-foreground">مجموع بازپرداخت:</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatNumber(loanDetails.totalPayable)} تومان
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">برنامه اقساط</p>
                <div className="space-y-2 pt-2">
                  {loanDetails.installments.map((inst) => (
                    <div
                      key={inst.number}
                      className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          قسط {inst.number} از {selectedPeriod}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {inst.dueDate.toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(inst.amount)} تومان
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {step === 2 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setStep(3);
                        window.scrollTo?.({ top: 0, behavior: "smooth" });
                      }}
                    >
                      مرحله بعد: رتبه اعتباری
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      تغییر وام
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* مرحله ۳: دریافت گزارش اعتبار سنجی */}
        {showFlow && step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">دریافت گزارش اعتبار سنجی</CardTitle>
                <span className="text-[11px] text-muted-foreground">مرحله ۳ از ۵</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">مرحله ۱: وارد کردن کد ملی</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <CreditReportStep
                value={videoVerificationNationalId}
                lockedNationalId={creditReportRequested ? videoVerificationNationalId : undefined}
                creditGrade="A+"
                onInquiry={(nationalId) => {
                  setVideoVerificationNationalId(nationalId);
                  setCreditReportRequested(true);
                }}
                onContinue={() => {
                  setStep(4);
                  window.scrollTo?.({ top: 0, behavior: "smooth" });
                }}
                onBack={() => setStep(2)}
                backLabel="بازگشت"
              />
            </CardContent>
          </Card>
        )}

        {/* مرحله ۴: احراز هویت ویدیویی — توضیحات و دکمه شروع؛ یا نمایش احراز موفق */}
        {showFlow && step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">احراز هویت ویدیویی</CardTitle>
                <span className="text-[11px] text-muted-foreground">مرحله ۴ از ۵</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {videoVerificationSuccess ? (
                <>
                  <p className="text-lg font-semibold text-primary text-center py-4">
                    احراز هویت موفق
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        setStep(5);
                        window.scrollTo?.({ top: 0, behavior: "smooth" });
                      }}
                    >
                      ادامه
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                      بازگشت
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    برای تکمیل درخواست وام، احراز هویت به‌صورت ویدیویی لازم است. ویدیوی کوتاهی از خودتان ضبط
                    می‌کنید و متن اعلام‌شده را می‌خوانید. پس از تأیید، به مرحله بعد هدایت می‌شوید.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setVideoVerificationModalOpen(true)}
                  >
                    شروع فرایند احراز هویت
                  </Button>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                      بازگشت
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* مرحله نهایی: نمایش قرارداد و امضای آن */}
        {showFlow && step === 5 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">دریافت وام و تایید قرارداد</CardTitle>
                <span className="text-[11px] text-muted-foreground">مرحله ۵ از ۵</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  این وام صرفاً برای سرمایه‌گذاری در محصولات مالی نوین استفاده می‌شود و امکان برداشت نقدی خارج از
                  چارچوب پلتفرم را ندارد.
                </p>
                <p>
                  شما متعهد می‌شوید اقساط را در سررسید تعیین‌شده پرداخت کنید. در صورت عدم پرداخت به‌موقع، ممکن است
                  محدودیت‌هایی روی دسترسی به سایر سرویس‌ها اعمال شود.
                </p>
                <p>
                  خلاصه وام شما بر اساس انتخاب فعلی: مبلغ وام{" "}
                  <span className="font-semibold tabular-nums">
                    {formatNumber(loanAmount)} تومان
                  </span>{" "}
                  با مدت بازپرداخت{" "}
                  <span className="font-semibold">
                    {LOAN_OPTIONS.find((opt) => opt.months === selectedPeriod)?.label}
                  </span>{" "}
                  و مجموع بازپرداخت تقریبی{" "}
                  {loanDetails && (
                    <span className="font-semibold tabular-nums">
                      {formatNumber(loanDetails.totalPayable)} تومان
                    </span>
                  )}
                  {" "}است.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="agreement-checkbox"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={isAgreementAccepted}
                  onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                />
                <label
                  htmlFor="agreement-checkbox"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  تمام مفاد قرارداد را خواندم و قبول دارم.
                </label>
              </div>

              <div className="flex items-center justify-between pt-3">
                <Button
                  type="button"
                  disabled={!isAgreementAccepted}
                  onClick={handleSignContract}
                >
                  امضای قرارداد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(4)}
                >
                  بازگشت
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <VideoVerificationModal
          open={videoVerificationModalOpen}
          onOpenChange={setVideoVerificationModalOpen}
          onSuccess={() => setVideoVerificationSuccess(true)}
        />
      </div>
    </div>
  );
}


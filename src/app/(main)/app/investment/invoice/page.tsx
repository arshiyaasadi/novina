"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Edit, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { CoinIcon } from "@/shared/components/coin-icon";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { getWalletState } from "../../wallet/lib/wallet-storage";
import { useMainWalletStore } from "../../wallet/store/main-wallet-store";
import { appendMainWalletJournalEntry } from "../../wallet/lib/main-wallet-storage";
import { handlerBank, maskPanHandler } from "@/shared/lib/bank-card";
import Image from "next/image";

type LoanPeriod = 3 | 6 | 9;
type LoanType = "none" | "cash" | "collateral";

const LOAN_OPTIONS = [
  { months: 3 as const, interest: 3.5, label: "۳ ماه" },
  { months: 6 as const, interest: 6, label: "۶ ماه" },
  { months: 9 as const, interest: 11, label: "۹ ماه" },
];

export default function InvoicePage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [loanType, setLoanType] = useState<LoanType>("none");
  const [useLoan, setUseLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanPeriod, setLoanPeriod] = useState<LoanPeriod | null>(null);
  const [loanInterest, setLoanInterest] = useState<number>(0);
  const [collateralAsset, setCollateralAsset] = useState<"usdt" | "btc" | null>(null);
  const [collateralValueToman, setCollateralValueToman] = useState<number>(0);
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);
  const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [invoiceExpiresAt] = useState(() => Date.now() + 2 * 60 * 1000);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [mainWalletCards, setMainWalletCards] = useState<string[]>([]);
  const [selectedCardForDeposit, setSelectedCardForDeposit] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositAmountRial, setDepositAmountRial] = useState(0);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  const mainWalletBalance = useMainWalletStore((s) => s.mainWalletBalance);
  const walletCreditsFromStore = useMainWalletStore((s) => s.walletCredits);
  const setMainWalletBalance = useMainWalletStore((s) => s.setMainWalletBalance);
  const setWalletCredits = useMainWalletStore((s) => s.setWalletCredits);

  // Wallet balances and allocation on invoice
  const [walletBalances, setWalletBalances] = useState<{ usdt: string; btc: string } | null>(null);
  const [allocationUsdt, setAllocationUsdt] = useState<string>("");
  const [allocationBtc, setAllocationBtc] = useState<string>("");

  useEffect(() => {
    useMainWalletStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("mainWalletCards");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setMainWalletCards(arr);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const savedPortfolio = localStorage.getItem("portfolio");
      const savedAmount = localStorage.getItem("investmentAmount");
      const savedLoanType = (localStorage.getItem("loanType") || "none") as LoanType;
      const savedUseLoan = localStorage.getItem("useLoan");
      const savedLoanAmount = localStorage.getItem("loanAmount");
      const savedLoanPeriod = localStorage.getItem("loanPeriod");
      const savedLoanInterest = localStorage.getItem("loanInterest");
      const savedCollateralAsset = localStorage.getItem("collateralAsset");
      const savedCollateralValueToman = localStorage.getItem("collateralValueToman");
      const savedAllocation = localStorage.getItem("investmentAllocation");

      if (savedPortfolio) {
        const parsed = JSON.parse(savedPortfolio);
        setPortfolio(parsed);
      }
      if (savedAmount) {
        setAmount(parseInt(savedAmount, 10));
      }

      setLoanType(savedLoanType);
      if (savedUseLoan === "true") {
        setUseLoan(true);
        if (savedLoanAmount) setLoanAmount(parseInt(savedLoanAmount, 10));
        if (savedLoanPeriod) setLoanPeriod(parseInt(savedLoanPeriod, 10) as LoanPeriod);
        if (savedLoanInterest) setLoanInterest(parseFloat(savedLoanInterest));
      }
      if (savedLoanType === "collateral") {
        if (savedCollateralAsset === "usdt" || savedCollateralAsset === "btc") {
          setCollateralAsset(savedCollateralAsset);
        }
        if (savedCollateralValueToman) {
          setCollateralValueToman(parseInt(savedCollateralValueToman, 10));
        }
      }

      // Load wallet state
      const state = getWalletState();
      if (state.walletRegistered && state.walletBalances) {
        setWalletBalances(state.walletBalances);
      }

      // Prefill allocation if it was set previously
      if (savedAllocation) {
        try {
          const parsed = JSON.parse(savedAllocation) as { fromUsdt?: number; fromBtc?: number };
          if (parsed.fromUsdt != null) setAllocationUsdt(parsed.fromUsdt.toString());
          if (parsed.fromBtc != null) setAllocationBtc(parsed.fromBtc.toString());
        } catch {
          // ignore parse errors
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateFundAmount = (percentage: number): number => {
    return Math.round((amount * percentage) / 100);
  };

  const totalAmount = portfolio.reduce((sum, item) => {
    return sum + calculateFundAmount(item.percentage);
  }, 0);

  // How much should be paid from wallets (investment minus loan, if any)
  const walletRequired = useLoan ? amount - loanAmount : amount;

  const numericAllocationUsdt = parseInt(allocationUsdt.replace(/,/g, ""), 10) || 0;
  const numericAllocationBtc = parseInt(allocationBtc.replace(/,/g, ""), 10) || 0;
  const allocatedTotal = numericAllocationUsdt + numericAllocationBtc;
  const remainingToAllocate = Math.max(0, walletRequired - allocatedTotal);

  const usdtBalanceNum = walletBalances ? Number(walletBalances.usdt) || 0 : 0;
  const btcBalanceNum = walletBalances ? Number(walletBalances.btc) || 0 : 0;
  const allocationExceedsBalance =
    numericAllocationUsdt > usdtBalanceNum || numericAllocationBtc > btcBalanceNum;

  const allocationError =
    walletBalances && walletRequired > 0
      ? allocationExceedsBalance
        ? "مبلغ انتخاب‌شده از یکی از کیف پول‌ها بیشتر از موجودی است."
        : allocatedTotal !== walletRequired
        ? "مجموع مبالغ انتخاب‌شده باید دقیقا برابر مبلغ پرداخت از کیف پول باشد."
        : ""
      : "";

  // Calculate loan details (cash: installments; collateral: lump sum 1 year)
  const calculateLoanDetails = () => {
    if (!useLoan || loanAmount === 0) return null;

    if (loanType === "collateral") {
      const dueDate = new Date();
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      return {
        interestAmount: 0,
        totalPayable: loanAmount,
        monthlyInstallment: 0,
        dueDate,
        isLumpSum: true,
      };
    }

    if (!loanPeriod) return null;
    const interestAmount = Math.round((loanAmount * loanInterest) / 100);
    const totalPayable = loanAmount + interestAmount;
    const monthlyInstallment = Math.round(totalPayable / loanPeriod);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loanPeriod);

    return {
      interestAmount,
      totalPayable,
      monthlyInstallment,
      dueDate,
      isLumpSum: false as const,
    };
  };

  const loanDetails = calculateLoanDetails();

  // Calculate installments list (only for cash loan)
  const calculateInstallments = () => {
    if (!useLoan || !loanDetails || !loanPeriod || loanType === "collateral" || loanDetails.isLumpSum) return [];

    const installments = [];
    const firstDueDate = new Date(loanDetails.dueDate);
    const monthlyInstallment = loanDetails.monthlyInstallment;

    for (let i = 0; i < loanPeriod; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setHours(0, 0, 0, 0);

      installments.push({
        number: i + 1,
        dueDate,
        amount: monthlyInstallment,
      });
    }

    return installments;
  };

  const installments = calculateInstallments();

  const handlePayment = () => {
    if (walletRequired > 0 && !canPayFromMainWallet) return;

    // کسر از کیف پول اصلی (اعتبار کریپتو+TWIN، وام، موجودی نقد)
    if (walletRequired > 0 && (takeFromCrypto > 0 || takeFromTwin > 0 || takeFromLoan > 0 || takeFromMain > 0)) {
      const creds = useMainWalletStore.getState().walletCredits;
      const main = useMainWalletStore.getState().mainWalletBalance;
      setWalletCredits({
        loan: creds.loan - takeFromLoan,
        funds: creds.funds,
        crypto: creds.crypto - takeFromCrypto,
        twin: creds.twin - takeFromTwin,
      });
      setMainWalletBalance(main - takeFromMain);
      const ref = "سرمایه‌گذاری";
      if (takeFromCrypto > 0) {
        appendMainWalletJournalEntry({
          type: "use_for_issue",
          amount: takeFromCrypto,
          source: "crypto",
          description: "استفاده برای سرمایه‌گذاری",
          reference: ref,
        });
      }
      if (takeFromTwin > 0) {
        appendMainWalletJournalEntry({
          type: "use_for_issue",
          amount: takeFromTwin,
          source: "twin",
          description: "استفاده برای سرمایه‌گذاری",
          reference: ref,
        });
      }
      if (takeFromLoan > 0) {
        appendMainWalletJournalEntry({
          type: "use_for_issue",
          amount: takeFromLoan,
          source: "loan",
          description: "استفاده برای سرمایه‌گذاری",
          reference: ref,
        });
      }
      if (takeFromMain > 0) {
        appendMainWalletJournalEntry({
          type: "use_for_issue",
          amount: takeFromMain,
          source: "main",
          description: "استفاده برای سرمایه‌گذاری",
          reference: ref,
        });
      }
    }

    try {
      const investmentData = {
        amount: amount,
        portfolio: portfolio,
        useLoan: useLoan,
        loanType: loanType,
        loanAmount: useLoan ? loanAmount : null,
        loanPeriod: useLoan ? loanPeriod : null,
        loanInterest: useLoan ? loanInterest : null,
        collateralAsset: loanType === "collateral" ? collateralAsset : null,
        collateralValueToman: loanType === "collateral" ? collateralValueToman : null,
        allocation: walletBalances
          ? {
              fromUsdt: numericAllocationUsdt,
              fromBtc: numericAllocationBtc,
            }
          : null,
        loanDetails: useLoan && loanDetails ? {
          interestAmount: loanDetails.interestAmount,
          totalPayable: loanDetails.totalPayable,
          monthlyInstallment: loanDetails.monthlyInstallment,
          dueDate: loanDetails.dueDate.toISOString(),
          isLumpSum: loanDetails.isLumpSum ?? false,
        } : null,
        investmentAmount: useLoan ? amount - loanAmount : amount,
        createdAt: new Date().toISOString(),
        status: "completed",
      };

      // Get existing investments or create new array
      const existingInvestments = localStorage.getItem("investments");
      const investments = existingInvestments ? JSON.parse(existingInvestments) : [];
      
      // Add new investment
      investments.push(investmentData);
      
      // Save to localStorage
      localStorage.setItem("investments", JSON.stringify(investments));
      
      // Also save as latest investment for quick access
      localStorage.setItem("latestInvestment", JSON.stringify(investmentData));
    } catch (error) {
      console.error("Failed to save investment data:", error);
    }

    // Navigate to receipt page with amount and success status
    const receiptUrl = `/app/investment/receipt?amount=${amount}&status=success&callback=${encodeURIComponent("/app")}`;
    router.push(receiptUrl);
  };

  const shouldEnforceAllocation = !!walletBalances && walletRequired > 0;
  const canPayBase = !useLoan || isAgreementAccepted;

  // کیف پول اصلی: ترتیب کسر مثل assets/trade (کریپتو+TWIN، وام، موجودی نقد)
  const credits = walletCreditsFromStore;
  const mainBalance = mainWalletBalance;
  const cryptoTwin = credits.crypto + credits.twin;
  let takeFromCryptoTwin = Math.min(walletRequired, cryptoTwin);
  let remaining = walletRequired - takeFromCryptoTwin;
  const takeFromLoan = Math.min(remaining, credits.loan);
  remaining -= takeFromLoan;
  const takeFromMain = Math.min(remaining, mainBalance);
  const takeFromCrypto = Math.min(takeFromCryptoTwin, credits.crypto);
  const takeFromTwin = takeFromCryptoTwin - takeFromCrypto;
  const totalCoveredByMainWallet = takeFromCryptoTwin + takeFromLoan + takeFromMain;
  const canPayFromMainWallet = walletRequired <= 0 || totalCoveredByMainWallet >= walletRequired;

  const mainWalletRows: { label: string; balance: number; take: number }[] = [
    { label: "اعتبار کریپتو + TWIN", balance: cryptoTwin, take: takeFromCryptoTwin },
    { label: "اعتبار وام", balance: credits.loan, take: takeFromLoan },
    { label: "موجودی کیف پول", balance: mainBalance, take: takeFromMain },
  ].filter((r) => r.balance > 0);

  const isInvoiceExpired = Date.now() > invoiceExpiresAt;
  const depositShortfall = walletRequired > 0 && !canPayFromMainWallet
    ? walletRequired - totalCoveredByMainWallet
    : 0;

  useEffect(() => {
    if (isDepositModalOpen && depositShortfall > 0) {
      const rial = depositShortfall * 10;
      setDepositAmountRial(rial);
      setDepositAmountInput(formatNumber(rial));
    }
  }, [isDepositModalOpen, depositShortfall]);

  const canPay =
    canPayBase &&
    !isInvoiceExpired &&
    (walletRequired <= 0 || canPayFromMainWallet);

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>فاکتور سرمایه‌گذاری</CardTitle>
            {walletRequired > 0 && (
              isInvoiceExpired ? (
                <p className="text-xs text-muted-foreground">این فاکتور منقضی شده است.</p>
              ) : (
                <p className="text-xs text-amber-600 font-medium">این فاکتور ۲ دقیقه اعتبار دارد.</p>
              )
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Amount */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">مبلغ کل سرمایه‌گذاری:</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatNumber(amount)} تومان
                  </span>
                </div>

                {/* Loan Information - Cash */}
                {useLoan && loanDetails && loanType === "cash" && loanPeriod && (
                  <div className="pt-3 border-t border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مبلغ وام (۷۰٪):</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(loanAmount)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">نرخ سود:</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {loanInterest}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مدت بازپرداخت:</span>
                      <span className="text-sm font-semibold">
                        {LOAN_OPTIONS.find(opt => opt.months === loanPeriod)?.label}
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
                        {loanDetails.dueDate.toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Loan Information - Collateral (crypto) */}
                {useLoan && loanDetails && loanType === "collateral" && collateralAsset && (
                  <div className="pt-3 border-t border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">نوع وثیقه:</span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <CoinIcon symbol={collateralAsset === "usdt" ? "USDT" : "BTC"} size={14} />
                        {collateralAsset === "usdt" ? "تتر" : "بیت‌کوین"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مبلغ وام از وثیقه:</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(loanAmount)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مدت بازپرداخت:</span>
                      <span className="text-sm font-semibold">۱ سال</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">نوع بازپرداخت:</span>
                      <span className="text-sm font-semibold">یک‌باره</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">سررسید:</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {loanDetails.dueDate.toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500 pt-1">
                      مبلغ وثیقه فریز می‌شود و تا پایان بازپرداخت قابل برداشت نیست.
                    </p>
                  </div>
                )}

                {/* Loan Calculation */}
                {useLoan && loanDetails && loanAmount > 0 && (
                  <div className="space-y-2 pt-3 border-t border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">مبلغ کل سرمایه‌گذاری:</span>
                      <span className="font-semibold tabular-nums">{formatNumber(amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">کسر مبلغ وام:</span>
                      <span className="font-semibold tabular-nums text-destructive">
                        - {formatNumber(loanAmount)}
                      </span>
                    </div>
                    {/* Double line separator (thin + thick) */}
                    <div className="relative pt-2 pb-2">
                      <div className="absolute top-0 left-0 right-0 border-t border-border"></div>
                      <div className="absolute top-[2px] left-0 right-0 border-t-2 border-foreground"></div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold">مبلغ سرمایه‌گذاری:</span>
                      <span className="text-lg font-bold tabular-nums text-primary">
                        {formatNumber(amount - loanAmount)} تومان
                      </span>
                    </div>
                  </div>
                )}

                {/* توزیع سرمایه — زیر مجموعه مبلغ کل */}
                <div className="space-y-2 pt-3 border-t border-primary/20">
                  <h3 className="font-semibold text-sm">توزیع سرمایه:</h3>
                  <div className="space-y-2">
                    {portfolio.map((item) => {
                      const fundAmount = calculateFundAmount(item.percentage);
                      return (
                        <div key={item.fundId} className="flex items-center justify-between py-1.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.fundName}</p>
                            <p className="text-xs text-muted-foreground">{Math.round(item.percentage)}% از کل</p>
                          </div>
                          <div className="flex-shrink-0 text-left">
                            <span className="text-sm font-bold tabular-nums">{formatNumber(fundAmount)}</span>
                            <span className="text-xs text-muted-foreground mr-1">تومان</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* کیف پول اصلی */}
            {walletRequired > 0 && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-foreground mb-3">کیف پول و موجودی‌ها</h3>
                  {mainWalletRows.length > 0 ? (
                    <table className="w-full min-w-[280px] text-sm border-collapse" dir="rtl">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">نوع اعتبار</th>
                          <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">موجودی</th>
                          <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">برداشت</th>
                          <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">مانده</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {mainWalletRows.map((r) => (
                          <tr key={r.label} className="border-b border-border/60 last:border-0">
                            <td className="py-2.5 px-3 text-foreground font-medium">{r.label}</td>
                            <td className="py-2.5 px-3 tabular-nums text-foreground">{formatNumber(r.balance)}</td>
                            <td className="py-2.5 px-3 tabular-nums text-foreground">{r.take > 0 ? formatNumber(r.take) : "—"}</td>
                            <td className="py-2.5 px-3 tabular-nums font-semibold text-foreground">{formatNumber(r.balance - r.take)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-3">موجودی قابل استفاده‌ای ثبت نشده است.</p>
                  )}
                  {!canPayFromMainWallet && walletRequired > 0 && (
                    <>
                      <p className="text-sm text-destructive font-medium mt-3">
                        مجموع موجودی‌ها برای این مبلغ کافی نیست.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => setIsDepositModalOpen(true)}
                      >
                        شارژ کیف پول به مبلغ: {formatNumber(depositShortfall)} تومان
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Read Agreement Option */}
            {useLoan && loanDetails && loanAmount > 0 && (
              <div className="pt-2">
                <label
                  htmlFor="read-agreement"
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLoanModalOpen(true);
                  }}
                >
                  <input
                    type="checkbox"
                    id="read-agreement"
                    checked={isAgreementAccepted}
                    onChange={(e) => {
                      setIsAgreementAccepted(e.target.checked);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAgreementAccepted) {
                        setIsLoanModalOpen(true);
                      }
                    }}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium">خواندن قرارداد</span>
                </label>
              </div>
            )}

            {/* سررسید اقساط — فقط در صورت وام */}
            {useLoan && loanDetails && installments.length > 0 && (
                <>
                  <button
                    onClick={() => setIsInstallmentsOpen(!isInstallmentsOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <h3 className="font-semibold text-sm">سررسید اقساط:</h3>
                    {isInstallmentsOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {isInstallmentsOpen && (
                    <div className="space-y-2 pt-2">
                      {installments.map((installment) => {
                        return (
                          <div
                            key={installment.number}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="rounded-full bg-muted p-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">
                                  قسط {installment.number} از {installments.length}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {installment.dueDate.toLocaleDateString("fa-IR", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-bold tabular-nums text-sm">
                                {formatNumber(installment.amount)} تومان
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

            {/* Total Check */}
            {totalAmount !== amount && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  توجه: مجموع توزیع ({formatNumber(totalAmount)}) با مبلغ کل ({formatNumber(amount)}) متفاوت است
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handlePayment}
                className="flex-1"
                size="lg"
                disabled={!canPay}
              >
                <Check className="w-4 h-4 ml-2" />
                تأیید و پرداخت
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Edit className="w-4 h-4 ml-2" />
                ویرایش
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* بنر دریافت وام */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => router.push("/app/credit/loan")}
              className="block w-full text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            >
              <img
                src="/images/banner_1.png"
                alt="وام تا ۷۰٪ مبلغ سرمایه‌گذاری شما"
                className="w-full h-auto object-contain"
              />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* مودال واریز به کیف پول */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent onClose={() => setIsDepositModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>واریز به کیف پول</DialogTitle>
            <DialogDescription>
              از بین کارت‌های بانکی خود یک کارت را انتخاب کنید و مبلغ را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">انتخاب کارت بانکی</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mainWalletCards.map((card) => {
                  const selected = selectedCardForDeposit === card;
                  const { bank, masked } = (() => {
                    const pan = card.replace(/\D/g, "");
                    return { bank: handlerBank(pan), masked: maskPanHandler(pan) };
                  })();
                  const logoSrc = `/images/bankLogos/${bank.logo}`;
                  return (
                    <button
                      key={card}
                      type="button"
                      onClick={() => setSelectedCardForDeposit(card)}
                      className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                        selected ? "border-primary bg-primary/10" : "border-muted bg-muted/40 hover:bg-muted/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-muted">
                          <Image
                            src={logoSrc}
                            alt={bank.bankName || "لوگوی بانک"}
                            fill
                            sizes="24px"
                            className="object-contain"
                          />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-[11px] font-medium">{bank.bankName || "کارت بانکی"}</span>
                          <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                            {masked.slice(0, 4)} {masked.slice(4)}
                          </span>
                        </div>
                      </div>
                      {selected && <span className="text-xs text-primary font-medium">انتخاب شده</span>}
                    </button>
                  );
                })}
                {mainWalletCards.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">هیچ کارتی ثبت نشده است.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push("/app/wallet")}
                    >
                      افزودن کارت بانکی از صفحه کیف پول
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="invoice-deposit-amount">
                مبلغ واریز (ریال)
              </label>
              <input
                id="invoice-deposit-amount"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="مثلاً ۱,۰۰۰,۰۰۰"
                value={depositAmountInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
                  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
                  let digits = "";
                  for (const ch of raw) {
                    if (ch >= "0" && ch <= "9") digits += ch;
                    else {
                      const pIndex = persianDigits.indexOf(ch);
                      const aIndex = arabicDigits.indexOf(ch);
                      if (pIndex !== -1) digits += String(pIndex);
                      else if (aIndex !== -1) digits += String(aIndex);
                    }
                  }
                  digits = digits.slice(0, 15);
                  const amountRial = digits ? Number(digits) : 0;
                  setDepositAmountRial(amountRial);
                  setDepositAmountInput(digits ? formatNumber(amountRial) : "");
                }}
              />
              {depositShortfall > 0 && (
                <p className="text-xs text-muted-foreground">
                  مبلغ پیشنهادی: {formatNumber(depositShortfall)} تومان
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">موجودی فعلی: {formatNumber(mainWalletBalance)} تومان</p>
            <Button
              type="button"
              className="w-full"
              disabled={
                isProcessingDeposit ||
                !selectedCardForDeposit ||
                Math.floor(depositAmountRial / 10) <= 0
              }
              onClick={() => {
                const depositToman = Math.floor(depositAmountRial / 10);
                if (!selectedCardForDeposit || depositToman <= 0) return;
                setIsProcessingDeposit(true);
                setTimeout(() => {
                  const next = Math.max(0, useMainWalletStore.getState().mainWalletBalance + depositToman);
                  setMainWalletBalance(next);
                  appendMainWalletJournalEntry({
                    type: "deposit",
                    amount: depositToman,
                    source: "main",
                    description: "واریز به کیف پول",
                  });
                  setIsProcessingDeposit(false);
                  setIsDepositModalOpen(false);
                  setDepositAmountInput("");
                  setDepositAmountRial(0);
                  setSelectedCardForDeposit(null);
                }, 500);
              }}
            >
              {isProcessingDeposit ? "در حال پردازش..." : "پرداخت"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loan Agreement Modal */}
      {useLoan && loanDetails && (loanPeriod || loanType === "collateral") && (
        <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
          <DialogContent 
            className="max-w-md max-h-[90vh] overflow-y-auto"
            onClose={() => setIsLoanModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>قوانین و شرایط وام</DialogTitle>
              <DialogDescription>
                لطفاً قوانین و شرایط وام را به دقت مطالعه کنید
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loanType === "collateral" ? (
                <>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-sm">اطلاعات وام با وثیقه کریپتو:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">مبلغ وام:</span>
                        <span className="font-semibold tabular-nums">
                          {formatNumber(loanAmount)} تومان
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">مدت بازپرداخت:</span>
                        <span className="font-semibold">۱ سال</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">بازپرداخت:</span>
                        <span className="font-semibold">یک‌باره</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">سررسید:</span>
                        <span className="font-semibold tabular-nums">
                          {loanDetails.dueDate.toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">شرایط و قوانین:</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• مبلغی که به عنوان وثیقه قرار داده‌اید فریز می‌شود و تا پایان بازپرداخت قابل برداشت نیست.</p>
                      <p>• بازپرداخت وام به صورت یک‌باره در پایان مدت یک سال انجام می‌شود.</p>
                      <p>• در صورت عدم بازپرداخت به موقع، وثیقه شما به عنوان تسویه در نظر گرفته می‌شود.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-sm">اطلاعات وام:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">مبلغ وام:</span>
                        <span className="font-semibold tabular-nums">
                          {formatNumber(loanAmount)} تومان
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">نرخ سود:</span>
                        <span className="font-semibold tabular-nums">
                          {loanInterest}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">مدت بازپرداخت:</span>
                        <span className="font-semibold">
                          {loanPeriod != null && LOAN_OPTIONS.find(opt => opt.months === loanPeriod)?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">مبلغ هر قسط:</span>
                        <span className="font-bold tabular-nums text-primary">
                          {formatNumber(loanDetails.monthlyInstallment)} تومان
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">سررسید اول وام:</span>
                        <span className="font-semibold tabular-nums">
                          {loanDetails.dueDate.toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">شرایط و قوانین:</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• مبلغ وام معادل ۷۰ درصد از مبلغ سرمایه‌گذاری شما است.</p>
                      <p>• بازپرداخت وام به صورت اقساط ماهانه انجام می‌شود.</p>
                      <p>• در صورت تأخیر در پرداخت اقساط، جریمه دیرکرد اعمال می‌شود.</p>
                      <p>• امکان تسویه زودهنگام وام با پرداخت تمام مبلغ باقیمانده وجود دارد.</p>
                      <p>• در صورت عدم پرداخت اقساط، حساب شما مسدود خواهد شد.</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="loan-agreement"
                  checked={isAgreementAccepted}
                  onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <label
                  htmlFor="loan-agreement"
                  className="text-sm cursor-pointer"
                >
                  قرارداد را خواندم و با تمام شرایط و قوانین موافقم
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsLoanModalOpen(false)}
                variant="outline"
                className="w-full"
              >
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


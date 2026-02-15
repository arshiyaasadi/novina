"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Edit, ChevronDown, ChevronUp, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { CoinIcon } from "@/shared/components/coin-icon";
import { cn } from "@/shared/lib/utils";

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

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>فاکتور سرمایه‌گذاری</CardTitle>
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
              </div>
            </div>

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

            {/* Fund Breakdown - Accordion */}
            <div className="space-y-3">
              <button
                onClick={() => setIsDistributionOpen(!isDistributionOpen)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <h3 className="font-semibold text-sm">توزیع سرمایه:</h3>
                {isDistributionOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {isDistributionOpen && (
                <div className="space-y-2 pt-2">
                  {portfolio.map((item) => {
                    const fundAmount = calculateFundAmount(item.percentage);
                    return (
                      <div
                        key={item.fundId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.fundName}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(item.percentage)}% از کل
                          </p>
                        </div>
                        <div className="flex-shrink-0 mr-3 text-left">
                          <span className="text-sm font-bold tabular-nums">
                            {formatNumber(fundAmount)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">تومان</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Installments List - Only show if loan is selected */}
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
            </div>

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
                disabled={useLoan && !isAgreementAccepted}
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
      </div>

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


"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Calendar, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";
import { useTranslations } from "next-intl";

type InvestmentData = {
  amount: number;
  portfolio: Array<{
    fundId: number;
    fundName: string;
    percentage: number;
    category: string;
  }>;
  useLoan: boolean;
  loanAmount: number | null;
  loanPeriod: number | null;
  loanInterest: number | null;
  loanDetails: {
    interestAmount: number;
    totalPayable: number;
    monthlyInstallment: number;
    dueDate: string;
  } | null;
  investmentAmount: number;
  createdAt: string;
  status: string;
};

type Installment = {
  number: number;
  dueDate: Date;
  amount: number;
  isPaid: boolean;
  isOverdue: boolean;
};

function InstallmentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("app.installments");
  const tStatus = useTranslations("app.installments.status");
  const [investment, setInvestment] = useState<InvestmentData | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstallmentsExpanded, setIsInstallmentsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"installment" | "settlement" | "custom">("installment");
  const [customAmount, setCustomAmount] = useState<string>("");

  const loadInstallmentsData = useCallback(() => {
    try {
      const index = searchParams.get("index");
      if (index === null) {
        router.push("/app/activities");
        return;
      }

      const savedInvestments = localStorage.getItem("investments");
      if (savedInvestments) {
        const investments = JSON.parse(savedInvestments);
        const investmentIndex = parseInt(index, 10);
        
        if (investmentIndex >= 0 && investmentIndex < investments.length) {
          const selectedInvestment = investments[investmentIndex];
          setInvestment(selectedInvestment);

          // Calculate installments
          if (selectedInvestment.useLoan && selectedInvestment.loanDetails && selectedInvestment.loanPeriod) {
            const installmentsList: Installment[] = [];
            const firstDueDate = new Date(selectedInvestment.loanDetails.dueDate);
            const monthlyInstallment = selectedInvestment.loanDetails.monthlyInstallment;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < selectedInvestment.loanPeriod; i++) {
              const dueDate = new Date(firstDueDate);
              dueDate.setMonth(dueDate.getMonth() + i);
              dueDate.setHours(0, 0, 0, 0);

              const isOverdue = dueDate < today;
              // Check if installment is paid from localStorage
              // In real app, this would come from payment records/API
              const paymentKey = `installment_${investmentIndex}_${i + 1}_paid`;
              const isPaid = typeof window !== 'undefined' && localStorage.getItem(paymentKey) === 'true';

              installmentsList.push({
                number: i + 1,
                dueDate,
                amount: monthlyInstallment,
                isPaid,
                isOverdue: isOverdue && !isPaid,
              });
            }

            setInstallments(installmentsList);
          }
        } else {
          router.push("/app/activities");
        }
      } else {
        router.push("/app/activities");
      }
    } catch (error) {
      console.error("Failed to load investment data:", error);
      router.push("/app/activities");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    loadInstallmentsData();
  }, [loadInstallmentsData]);

  // Reload data when page becomes visible (e.g., returning from receipt page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadInstallmentsData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadInstallmentsData]);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate remaining installments and amounts (used in payment handlers)
  const unpaidInstallments = installments.filter((i) => !i.isPaid);
  const totalRemainingAmount = unpaidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const nextInstallment = unpaidInstallments[0];

  // Payment handlers
  const handleInstallmentPayment = () => {
    if (!nextInstallment || !investment) return;

    try {
      const index = searchParams.get("index");
      if (!index) return;

      const savedInvestments = localStorage.getItem("investments");
      if (!savedInvestments) return;

      const investments = JSON.parse(savedInvestments);
      const investmentIndex = parseInt(index, 10);

      // Mark installment as paid in localStorage
      const paymentKey = `installment_${investmentIndex}_${nextInstallment.number}_paid`;
      localStorage.setItem(paymentKey, "true");

      // Update investment data
      const updatedInvestment = { ...investments[investmentIndex] };
      if (!updatedInvestment.paidInstallments) {
        updatedInvestment.paidInstallments = [];
      }
      updatedInvestment.paidInstallments.push({
        number: nextInstallment.number,
        amount: nextInstallment.amount,
        paidAt: new Date().toISOString(),
      });
      investments[investmentIndex] = updatedInvestment;
      localStorage.setItem("investments", JSON.stringify(investments));

      // Save activity
      const activity = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: "installment_payment",
        title: `پرداخت قسط ${nextInstallment.number}`,
        amount: nextInstallment.amount,
        investmentIndex: investmentIndex,
        installmentNumber: nextInstallment.number,
        createdAt: new Date().toISOString(),
        description: `پرداخت قسط ${nextInstallment.number} از ${installments.length}`,
      };
      const savedActivities = localStorage.getItem("activities");
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      activities.push(activity);
      localStorage.setItem("activities", JSON.stringify(activities));

      // Navigate to receipt page with callback to return to this page
      const currentUrl = `/app/activities/installments?index=${investmentIndex}`;
      const receiptUrl = `/app/investment/receipt?amount=${nextInstallment.amount}&status=success&callback=${encodeURIComponent(currentUrl)}`;
      router.push(receiptUrl);
    } catch (error) {
      console.error("Failed to process payment:", error);
      alert(t("errors.paymentError"));
    }
  };

  const handleFullSettlement = () => {
    const unpaidInstallmentsForSettlement = installments.filter((i) => !i.isPaid);
    if (!investment || unpaidInstallmentsForSettlement.length === 0) return;

    try {
      const index = searchParams.get("index");
      if (!index) return;

      const savedInvestments = localStorage.getItem("investments");
      if (!savedInvestments) return;

      const investments = JSON.parse(savedInvestments);
      const investmentIndex = parseInt(index, 10);

      // Mark all unpaid installments as paid
      unpaidInstallmentsForSettlement.forEach((installment) => {
        const paymentKey = `installment_${investmentIndex}_${installment.number}_paid`;
        localStorage.setItem(paymentKey, "true");
      });

      // Update investment data
      const updatedInvestment = { ...investments[investmentIndex] };
      if (!updatedInvestment.paidInstallments) {
        updatedInvestment.paidInstallments = [];
      }
      unpaidInstallmentsForSettlement.forEach((installment) => {
        updatedInvestment.paidInstallments.push({
          number: installment.number,
          amount: installment.amount,
          paidAt: new Date().toISOString(),
        });
      });
      investments[investmentIndex] = updatedInvestment;
      localStorage.setItem("investments", JSON.stringify(investments));

      // Calculate total for message
      const totalForSettlement = unpaidInstallmentsForSettlement.reduce((sum, i) => sum + i.amount, 0);
      
      // Save activity
      const activity = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: "loan_settlement",
        title: t("settlement.title"),
        amount: totalForSettlement,
        investmentIndex: investmentIndex,
        createdAt: new Date().toISOString(),
        description: `تسویه کامل وام (${unpaidInstallmentsForSettlement.length} قسط)`,
      };
      const savedActivities = localStorage.getItem("activities");
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      activities.push(activity);
      localStorage.setItem("activities", JSON.stringify(activities));

      // Navigate to receipt page with callback to return to this page
      const currentUrl = `/app/activities/installments?index=${investmentIndex}`;
      const receiptUrl = `/app/investment/receipt?amount=${totalForSettlement}&status=success&callback=${encodeURIComponent(currentUrl)}`;
      router.push(receiptUrl);
    } catch (error) {
      console.error("Failed to process settlement:", error);
      alert(t("errors.settlementError"));
    }
  };

  const handleCustomPayment = () => {
    const customAmountNum = parseInt(customAmount) || 0;
    const unpaidInstallmentsForCustom = installments.filter((i) => !i.isPaid);
    const totalRemainingForCustom = unpaidInstallmentsForCustom.reduce((sum, i) => sum + i.amount, 0);
    if (customAmountNum <= 0 || customAmountNum > totalRemainingForCustom) {
      alert(t("errors.invalidAmount"));
      return;
    }

    if (!investment) return;

    try {
      const index = searchParams.get("index");
      if (!index) return;

      const savedInvestments = localStorage.getItem("investments");
      if (!savedInvestments) return;

      const investments = JSON.parse(savedInvestments);
      const investmentIndex = parseInt(index, 10);

      // Distribute custom amount across unpaid installments
      let remainingAmount = customAmountNum;
      const paidInstallments: Array<{ number: number; amount: number; paidAt: string }> = [];

      for (const installment of unpaidInstallmentsForCustom) {
        if (remainingAmount <= 0) break;

        const paymentAmount = Math.min(remainingAmount, installment.amount);
        remainingAmount -= paymentAmount;

        // If full installment is paid
        if (paymentAmount >= installment.amount) {
          const paymentKey = `installment_${investmentIndex}_${installment.number}_paid`;
          localStorage.setItem(paymentKey, "true");
          paidInstallments.push({
            number: installment.number,
            amount: installment.amount,
            paidAt: new Date().toISOString(),
          });
        } else {
          // Partial payment - store partial amount
          const partialKey = `installment_${investmentIndex}_${installment.number}_partial`;
          const existingPartial = localStorage.getItem(partialKey);
          const existingAmount = existingPartial ? parseInt(existingPartial) : 0;
          localStorage.setItem(partialKey, (existingAmount + paymentAmount).toString());
        }
      }

      // Update investment data
      const updatedInvestment = { ...investments[investmentIndex] };
      if (!updatedInvestment.paidInstallments) {
        updatedInvestment.paidInstallments = [];
      }
      paidInstallments.forEach((inst) => {
        updatedInvestment.paidInstallments.push(inst);
      });
      investments[investmentIndex] = updatedInvestment;
      localStorage.setItem("investments", JSON.stringify(investments));

      // Save activity
      const activity = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: "custom_payment",
        title: t("customPayment.title"),
        amount: customAmountNum,
        investmentIndex: investmentIndex,
        createdAt: new Date().toISOString(),
        description: `پرداخت مبلغ دلخواه به مبلغ ${formatNumber(customAmountNum)} تومان`,
      };
      const savedActivities = localStorage.getItem("activities");
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      activities.push(activity);
      localStorage.setItem("activities", JSON.stringify(activities));

      // Reset custom amount
      setCustomAmount("");

      // Navigate to receipt page with callback to return to this page
      const currentUrl = `/app/activities/installments?index=${investmentIndex}`;
      const receiptUrl = `/app/investment/receipt?amount=${customAmountNum}&status=success&callback=${encodeURIComponent(currentUrl)}`;
      router.push(receiptUrl);
    } catch (error) {
      console.error("Failed to process custom payment:", error);
      alert("خطا در پردازش پرداخت. لطفاً دوباره تلاش کنید.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">سرمایه‌گذاری وجود ندارد</p>
            <Button
              onClick={() => router.push("/app/activities")}
              variant="outline"
            >
              بازگشت به فعالیت‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!investment.useLoan || !investment.loanDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">این سرمایه‌گذاری از وام استفاده نکرده است</p>
            <Button
              onClick={() => router.push("/app/activities")}
              variant="outline"
            >
              بازگشت به فعالیت‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paidCount = installments.filter((i) => i.isPaid).length;
  const unpaidCount = installments.filter((i) => !i.isPaid).length;
  const overdueCount = installments.filter((i) => i.isOverdue).length;

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">اقساط وام</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/app/activities")}
            className="gap-2"
          >
            بازگشت
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>اطلاعات وام</CardTitle>
              {unpaidCount === 0 && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  تسویه
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مبلغ وام:</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatNumber(investment.loanAmount || 0)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نرخ سود:</span>
              <span className="text-sm font-semibold tabular-nums">
                {investment.loanInterest}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مدت بازپرداخت:</span>
              <span className="text-sm font-semibold tabular-nums">
                {investment.loanPeriod} ماه
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مبلغ هر قسط:</span>
              <span className="text-sm font-bold tabular-nums text-primary">
                {formatNumber(investment.loanDetails.monthlyInstallment)} تومان
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">تاریخ دریافت وام:</span>
                <span className="text-sm font-semibold tabular-nums">
                  {new Date(investment.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{paidCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{tStatus("paid")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{unpaidCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{tStatus("unpaid")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{tStatus("overdue")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Tabs - Only show if there are unpaid installments */}
        {unpaidCount > 0 && (
        <Card>
          <CardContent className="p-0">
            {/* Tab Headers */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("installment")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "installment"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                پرداخت قسط
              </button>
              <button
                onClick={() => setActiveTab("settlement")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "settlement"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                تسویه وام
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "custom"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                مقدار دلخواه
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === "installment" && nextInstallment && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">قسط پیش رو:</span>
                      <span className="font-semibold">قسط {nextInstallment.number} از {installments.length}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">تاریخ سررسید:</span>
                      <span className="text-sm font-semibold">
                        {nextInstallment.dueDate.toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">مبلغ قسط:</span>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {formatNumber(nextInstallment.amount)} تومان
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settlement" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">تعداد اقساط باقی‌مانده:</span>
                      <span className="font-semibold">{unpaidCount} قسط</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">مجموع اقساط پرداخت نشده:</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(totalRemainingAmount)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">مبلغ کل تسویه:</span>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {formatNumber(totalRemainingAmount)} تومان
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom-amount">مبلغ پرداخت (تومان)</Label>
                    <Input
                      id="custom-amount"
                      type="text"
                      value={customAmount ? formatNumber(parseInt(customAmount) || 0) : ""}
                      onChange={(e) => {
                        const converted = convertToEnglishDigits(e.target.value);
                        const value = converted.replace(/[^\d]/g, "");
                        setCustomAmount(value);
                      }}
                      placeholder={t("customPayment.placeholder")}
                      className="text-center text-lg font-semibold"
                    />
                  </div>
                  {investment && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">حداکثر مبلغ قابل پرداخت:</span>
                        <span className="font-semibold tabular-nums">
                          {formatNumber(totalRemainingAmount)} تومان
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Installments List */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setIsInstallmentsExpanded(!isInstallmentsExpanded)}
              className="w-full flex items-center justify-between"
            >
              <CardTitle>لیست اقساط</CardTitle>
              {isInstallmentsExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {isInstallmentsExpanded && (
            <CardContent className="space-y-2">
              {installments.length > 0 ? installments.map((installment) => {
              const isPastDue = installment.dueDate < new Date();
              const isToday = installment.dueDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={installment.number}
                  className={`p-4 rounded-lg border ${
                    installment.isPaid
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : installment.isOverdue
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : isToday
                      ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          installment.isPaid
                            ? "bg-green-100 dark:bg-green-900"
                            : installment.isOverdue
                            ? "bg-red-100 dark:bg-red-900"
                            : "bg-muted"
                        }`}
                      >
                        {installment.isPaid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          قسط {installment.number} از {installments.length}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
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
                      <div className="font-bold tabular-nums">
                        {formatNumber(installment.amount)} تومان
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          installment.isPaid
                            ? "text-green-600"
                            : installment.isOverdue
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {installment.isPaid
                          ? tStatus("paid")
                          : installment.isOverdue
                          ? tStatus("overdue")
                          : isToday
                          ? tStatus("today")
                          : tStatus("unpaid")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                هیچ قسطی یافت نشد
              </div>
            )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Fixed Payment Button */}
      {installments.length > 0 && unpaidCount > 0 && (() => {
        let buttonText = "";
        let buttonAmount = 0;
        let isDisabled = false;
        let onClickHandler = () => {};

        if (activeTab === "installment" && nextInstallment) {
          buttonText = `پرداخت قسط پیش رو: ${formatNumber(nextInstallment.amount)} تومان`;
          buttonAmount = nextInstallment.amount;
          onClickHandler = handleInstallmentPayment;
        } else if (activeTab === "settlement") {
          buttonText = `تسویه کامل وام: ${formatNumber(totalRemainingAmount)} تومان`;
          buttonAmount = totalRemainingAmount;
          onClickHandler = handleFullSettlement;
        } else if (activeTab === "custom") {
          const customAmountNum = parseInt(customAmount) || 0;
          if (customAmountNum > 0 && customAmountNum <= totalRemainingAmount) {
            buttonText = `پرداخت: ${formatNumber(customAmountNum)} تومان`;
            buttonAmount = customAmountNum;
            onClickHandler = handleCustomPayment;
            isDisabled = false;
          } else {
            buttonText = t("customPayment.enterAmount");
            isDisabled = true;
          }
        }

        if (!buttonText) return null;

        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 pb-safe-area-inset-bottom">
            <div className="max-w-md mx-auto">
              <Button
                onClick={onClickHandler}
                className="w-full gap-2"
                size="lg"
                disabled={isDisabled}
              >
                <CreditCard className="h-4 w-4" />
                {buttonText}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function InstallmentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <InstallmentsPageContent />
    </Suspense>
  );
}


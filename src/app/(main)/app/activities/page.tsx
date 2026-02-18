"use client";

import { useEffect, useState } from "react";
import { Activity, Calendar, Filter, DollarSign, CreditCard, ChevronDown, ChevronUp, ChevronLeft, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { getTradeOrders, type StoredTradeOrder } from "../assets/lib/trade-orders-storage";

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

type ActivityType = "all" | "investment" | "loan" | "installment_payment" | "trade";

type ActivityRecord = {
  id: string;
  type: "investment" | "loan" | "installment_payment" | "loan_settlement" | "custom_payment";
  title: string;
  amount: number;
  investmentIndex?: number;
  installmentNumber?: number;
  createdAt: string;
  description?: string;
};

export default function ActivitiesPage() {
  const t = useTranslations("app.activities");
  const tActivities = useTranslations("app.activities.types");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType>("all");
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "trade") setActivityTypeFilter("trade");
  }, [searchParams]);

  useEffect(() => {
    try {
      const savedInvestments = localStorage.getItem("investments");
      if (savedInvestments) {
        const parsed = JSON.parse(savedInvestments);
        // Sort by date, newest first
        const sorted = parsed.sort((a: InvestmentData, b: InvestmentData) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setInvestments(sorted);
      }

      // Load activities
      const savedActivities = localStorage.getItem("activities");
      if (savedActivities) {
        try {
          const parsed = JSON.parse(savedActivities);
          // Sort by date, newest first
          const sorted = parsed.sort((a: ActivityRecord, b: ActivityRecord) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setActivities(sorted);
        } catch (error) {
          console.error("Failed to parse activities:", error);
          setActivities([]);
        }
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toggleActivity = (id: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedActivities(newExpanded);
  };

  const ORDER_STATUS_LABEL: Record<StoredTradeOrder["status"], string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار",
  completed: "تکمیل شده",
  expired: "منقضی شده",
  cancelled: "لغو شده",
};

  // Combine investments, activities, and trade orders into a single list
  const allActivities: Array<{
    id: string;
    type: "investment" | "loan" | "installment_payment" | "loan_settlement" | "custom_payment" | "trade";
    title: string;
    amount: number;
    createdAt: string;
    investment?: InvestmentData;
    activity?: ActivityRecord;
    tradeOrder?: StoredTradeOrder;
    description?: string;
  }> = [];

  // Add investments as activities
  investments.forEach((investment, index) => {
    allActivities.push({
      id: `investment-${index}`,
      type: "investment",
      title: tActivities("investment"),
      amount: investment.investmentAmount,
      createdAt: investment.createdAt,
      investment,
    });

    // Add loan as separate activity if exists
    if (investment.useLoan && investment.loanDetails) {
      allActivities.push({
        id: `loan-${index}`,
        type: "loan",
        title: tActivities("loan"),
        amount: investment.loanAmount || 0,
        createdAt: investment.createdAt,
        investment,
      });
    }
  });

  // Add payment activities
  activities.forEach((activity) => {
    allActivities.push({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      amount: activity.amount,
      createdAt: activity.createdAt,
      activity,
      description: activity.description,
    });
  });

  // Add trade orders (تاریخچه معاملات)
  const tradeOrders = getTradeOrders();
  tradeOrders.forEach((order) => {
    allActivities.push({
      id: order.id,
      type: "trade",
      title: order.type === "issue" ? "صدور" : "ابطال",
      amount: order.amount,
      createdAt: order.createdAt,
      tradeOrder: order,
    });
  });

  // Sort all activities by date, newest first
  allActivities.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter activities based on type
  const filteredActivities = allActivities.filter((item) => {
    if (activityTypeFilter === "all") return true;
    if (activityTypeFilter === "investment") return item.type === "investment";
    if (activityTypeFilter === "loan") return item.type === "loan" || item.type === "loan_settlement" || item.type === "custom_payment";
    if (activityTypeFilter === "installment_payment") return item.type === "installment_payment";
    if (activityTypeFilter === "trade") return item.type === "trade";
    return true;
  });

  const hasActivities = filteredActivities.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Filter Section */}
      <div className="border-b bg-background p-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">فیلتر:</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>تاریخ</span>
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
              >
              <Filter className="h-4 w-4" />
              <span>نوع</span>
                <ChevronLeft className={`h-4 w-4 transition-transform ${isTypeFilterOpen ? 'rotate-90' : '-rotate-90'}`} />
            </Button>
              {isTypeFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-background border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setActivityTypeFilter("all");
                      setIsTypeFilterOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      activityTypeFilter === "all" ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => {
                      setActivityTypeFilter("investment");
                      setIsTypeFilterOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      activityTypeFilter === "investment" ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    سرمایه گذاری
                  </button>
                  <button
                    onClick={() => {
                      setActivityTypeFilter("loan");
                      setIsTypeFilterOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      activityTypeFilter === "loan" ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    دریافت وام
                  </button>
                  <button
                    onClick={() => {
                      setActivityTypeFilter("installment_payment");
                      setIsTypeFilterOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      activityTypeFilter === "installment_payment" ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    پرداخت قسط
                  </button>
                  <button
                    onClick={() => {
                      setActivityTypeFilter("trade");
                      setIsTypeFilterOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors rounded-b-lg ${
                      activityTypeFilter === "trade" ? "bg-muted font-semibold" : ""
                    }`}
                  >
                    تاریخچه معاملات
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        ) : !hasActivities ? (
          <div className="flex flex-col items-center justify-center p-8 text-center flex-1">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Activity className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("emptyState.title")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredActivities.map((item) => {
              const isExpanded = expandedActivities.has(item.id);
              const hasLoan = item.investment?.useLoan && item.investment?.loanDetails;

              // Get icon and color based on activity type
              let icon = DollarSign;
              let iconBg = "bg-primary/10";
              let iconColor = "text-primary";

              if (item.type === "loan") {
                icon = CreditCard;
                iconBg = "bg-green-500/10";
                iconColor = "text-green-600";
              } else if (item.type === "installment_payment") {
                icon = CreditCard;
                iconBg = "bg-blue-500/10";
                iconColor = "text-blue-600";
              } else if (item.type === "loan_settlement") {
                icon = CreditCard;
                iconBg = "bg-purple-500/10";
                iconColor = "text-purple-600";
              } else if (item.type === "custom_payment") {
                icon = DollarSign;
                iconBg = "bg-orange-500/10";
                iconColor = "text-orange-600";
              } else if (item.type === "trade" && item.tradeOrder) {
                icon = item.tradeOrder.type === "issue" ? TrendingUp : TrendingDown;
                iconBg = item.tradeOrder.type === "issue" ? "bg-green-500/10" : "bg-red-500/10";
                iconColor = item.tradeOrder.type === "issue" ? "text-green-600" : "text-red-600";
              }

              const IconComponent = icon;

              return (
                <Card key={item.id}>
                  <CardHeader>
                    <button
                      onClick={() => toggleActivity(item.id)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full ${iconBg} p-2`}>
                          <IconComponent className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        <div className="text-right">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-4 pt-0">
                      {item.type === "investment" && item.investment && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">مبلغ سرمایه‌گذاری:</span>
                            <span className="text-lg font-bold tabular-nums">
                              {formatNumber(item.investment.investmentAmount)} تومان
                            </span>
                          </div>
                          {item.investment.portfolio && item.investment.portfolio.length > 0 && (
                            <div className="pt-3 border-t space-y-2">
                              <h4 className="text-sm font-semibold mb-2">صندوق‌های خریداری شده:</h4>
                              {item.investment.portfolio.map((fund, index) => {
                                const fundAmount = (item.investment!.investmentAmount * fund.percentage) / 100;
                                return (
                                  <div
                                    key={fund.fundId}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{fund.fundName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {Math.round(fund.percentage)}% از کل
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0 mr-3 text-left">
                                      <span className="text-sm font-bold tabular-nums">
                                        {formatNumber(Math.round(fundAmount))}
                                      </span>
                                      <span className="text-xs text-muted-foreground mr-1">تومان</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === "loan" && item.investment && hasLoan && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="rounded-full bg-green-500/10 p-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <span className="text-sm font-semibold text-green-600">دریافت وام</span>
                          </div>
                          <div className="space-y-2 pr-6">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">مبلغ وام:</span>
                              <span className="text-sm font-semibold tabular-nums">
                                {formatNumber(item.investment.loanAmount || 0)} تومان
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">نرخ سود:</span>
                              <span className="text-sm font-semibold tabular-nums">
                                {item.investment.loanInterest}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">مبلغ هر قسط:</span>
                              <span className="text-sm font-bold tabular-nums text-primary">
                                {formatNumber(item.investment.loanDetails?.monthlyInstallment || 0)} تومان
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">سررسید اول وام:</span>
                              <span className="text-sm font-semibold tabular-nums">
                                {item.investment.loanDetails?.dueDate
                                  ? new Date(item.investment.loanDetails.dueDate).toLocaleDateString("fa-IR", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 mt-3 border-t">
                            <Button
                              onClick={() => {
                                const savedInvestments = localStorage.getItem("investments");
                                if (savedInvestments) {
                                  const allInvestments = JSON.parse(savedInvestments);
                                  const actualIndex = allInvestments.findIndex(
                                    (inv: InvestmentData) => inv.createdAt === item.investment?.createdAt
                                  );
                                  if (actualIndex !== -1) {
                                    router.push(`/app/activities/installments?index=${actualIndex}`);
                                  }
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              مشاهده اقساط
                            </Button>
                          </div>
                        </div>
                      )}

                      {(item.type === "installment_payment" || item.type === "loan_settlement" || item.type === "custom_payment") && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">مبلغ:</span>
                            </div>
                            <span className="text-lg font-bold tabular-nums">
                              {formatNumber(item.amount)} تومان
                            </span>
                          </div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === "trade" && item.tradeOrder && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">صندوق</span>
                              <span className="font-medium">{item.tradeOrder.fundName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">نوع</span>
                              <span className={item.tradeOrder.type === "issue" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {item.tradeOrder.type === "issue" ? "صدور" : "ابطال"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">تعداد واحد</span>
                              <span className="tabular-nums">{Number(item.tradeOrder.units).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">مبلغ</span>
                              <span className="font-semibold tabular-nums">{formatNumber(item.tradeOrder.amount)} تومان</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">وضعیت</span>
                              <span className="text-xs font-medium">{ORDER_STATUS_LABEL[item.tradeOrder.status]}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/app/assets/trade?view=${item.tradeOrder!.id}`)}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            مشاهده فاکتور
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

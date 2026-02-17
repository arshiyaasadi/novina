"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export interface PortfolioItem {
  fundId: number;
  fundName: string;
  percentage: number;
  category: "conservative" | "balanced" | "aggressive";
}

interface PortfolioPieChartProps {
  items: PortfolioItem[];
  className?: string;
}

// Unique colors for each fund - using a diverse color palette
const fundColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange-red
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#ef4444", // red
  "#a855f7", // violet
];

const categoryLabels: Record<string, string> = {
  conservative: "محافظه‌کار",
  balanced: "متعادل",
  aggressive: "جسور",
};

type Installment = {
  number: number;
  dueDate: Date;
  amount: number;
  isPaid: boolean;
  isOverdue: boolean;
  investmentIndex: number;
};

export function PortfolioPieChart({ items, className }: PortfolioPieChartProps) {
  const router = useRouter();
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  
  const handleResetPortfolio = () => {
    try {
      localStorage.removeItem("portfolio");
      localStorage.removeItem("portfolioUpdatedAt");
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset portfolio:", error);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const loadAllInstallments = useCallback(() => {
    try {
      const savedInvestments = localStorage.getItem("investments");
      if (!savedInvestments) {
        setAllInstallments([]);
        return;
      }

      const investments = JSON.parse(savedInvestments);
      const installmentsList: Installment[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      investments.forEach((investment: any, investmentIndex: number) => {
        if (investment.useLoan && investment.loanDetails && investment.loanPeriod) {
          const firstDueDate = new Date(investment.loanDetails.dueDate);
          const monthlyInstallment = investment.loanDetails.monthlyInstallment;

          for (let i = 0; i < investment.loanPeriod; i++) {
            const dueDate = new Date(firstDueDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setHours(0, 0, 0, 0);

            const isOverdue = dueDate < today;
            const paymentKey = `installment_${investmentIndex}_${i + 1}_paid`;
            const isPaid = typeof window !== 'undefined' && localStorage.getItem(paymentKey) === 'true';

            installmentsList.push({
              number: i + 1,
              dueDate,
              amount: monthlyInstallment,
              isPaid,
              isOverdue: isOverdue && !isPaid,
              investmentIndex,
            });
          }
        }
      });

      // Sort by due date (earliest first)
      installmentsList.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setAllInstallments(installmentsList);
    } catch (error) {
      console.error("Failed to load installments:", error);
      setAllInstallments([]);
    }
  }, []);

  // Reload installments when dropdown is opened
  useEffect(() => {
    if (isDistributionOpen) {
      loadAllInstallments();
    }
  }, [isDistributionOpen, loadAllInstallments]);

  useEffect(() => {
    loadAllInstallments();
    
    // Reload installments when page becomes visible (e.g., returning from payment page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllInstallments();
      }
    };
    
    // Listen for storage changes (when payments are made)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('installment_') || e.key === 'investments') {
        loadAllInstallments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadAllInstallments();
    };
    window.addEventListener('installmentUpdated', handleCustomStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('installmentUpdated', handleCustomStorageChange);
    };
  }, [loadAllInstallments]);
  
  if (items.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>پورتفوی سرمایه‌گذاری</CardTitle>
            <button
              onClick={handleResetPortfolio}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>هیچ صندوقی انتخاب نشده است</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate pie chart segments
  let currentAngle = -90; // Start from top
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  const segments: Array<{
    fundId: number;
    fundName: string;
    percentage: number;
    category: string;
    path: string;
    startAngle: number;
    endAngle: number;
    textX: number;
    textY: number;
    color: string;
  }> = [];

  items.forEach((item, index) => {
    // Assign unique color to each fund based on index
    const color = fundColors[index % fundColors.length];
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const midAngle = startAngle + angle / 2; // Middle angle for text placement

    // Convert angles to radians
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const midAngleRad = (midAngle * Math.PI) / 180;

    // Special case: if percentage is 100%, draw a full circle
    let path: string;
    let textX: number;
    let textY: number;
    
    if (Math.abs(item.percentage - 100) < 0.01) {
      // Full circle path
      path = `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`;
      // For full circle, center the text
      textX = centerX;
      textY = centerY;
    } else {
      // Calculate text position (inside the segment, closer to center)
      const textRadius = radius * 0.6; // Position text at 60% of radius
      textX = centerX + textRadius * Math.cos(midAngleRad);
      textY = centerY + textRadius * Math.sin(midAngleRad);
      // Calculate start and end points
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);

      // Large arc flag (1 if angle > 180, 0 otherwise)
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Create path for this segment
      path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    segments.push({
      fundId: item.fundId,
      fundName: item.fundName,
      percentage: item.percentage,
      category: item.category,
      path,
      startAngle,
      endAngle,
      textX,
      textY,
      color,
    });

    currentAngle += angle;
  });

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>پورتفوی سرمایه‌گذاری</CardTitle>
          <button
            onClick={handleResetPortfolio}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {segments.map((segment, index) => (
                <g key={segment.fundId}>
                  {Math.abs(segment.percentage - 100) < 0.01 ? (
                    // Full circle - use circle element
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={radius}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-opacity hover:opacity-80"
                    />
                  ) : (
                    // Partial segment - use path
                    <path
                      d={segment.path}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-opacity hover:opacity-80"
                    />
                  )}
                  {/* Percentage text with background inside segment */}
                  <g transform={`rotate(90 ${segment.textX} ${segment.textY})`}>
                    {/* Background circle/rectangle for text */}
                    <rect
                      x={segment.textX - 20}
                      y={segment.textY - 8}
                      width="40"
                      height="16"
                      rx="8"
                      fill="rgba(0, 0, 0, 0.6)"
                    />
                    {/* Percentage text */}
                    <text
                      x={segment.textX}
                      y={segment.textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold text-xs"
                    >
                      {Math.round(segment.percentage)}%
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend - Only fund names */}
          <div className="w-full space-y-2">
            {items.map((item, index) => {
              const color = fundColors[index % fundColors.length];
              return (
                <div
                  key={item.fundId}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-medium">{item.fundName}</p>
                </div>
              );
            })}
          </div>

          {/* Action Button: فقط شروع سرمایه‌گذاری */}
          <div className="w-full flex pt-4">
            <Button
              onClick={() => router.push("/app/investment")}
              className="flex-1"
              size="lg"
            >
              شروع سرمایه‌گذاری
            </Button>
          </div>
        </div>

        {/* Distribution Section with Installments */}
        {/* حذف نمایش توزیع سرمایه طبق درخواست */}
        {/* <div className="space-y-3 pt-4 border-t">
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
              {allInstallments.length > 0 ? (
                allInstallments.map((installment) => {
                  const isPastDue = installment.dueDate < new Date();
                  const isToday = installment.dueDate.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={`${installment.investmentIndex}_${installment.number}`}
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
                              قسط {installment.number}
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
                              ? "پرداخت شده"
                              : installment.isOverdue
                              ? "سررسید گذشته"
                              : isToday
                              ? "امروز"
                              : "پرداخت نشده"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  هیچ قسطی یافت نشد
                </div>
              )}
            </div>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}


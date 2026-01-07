"use client";

import { useEffect, useState } from "react";
import { PortfolioPieChart, PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";
import { TrendingUp, Calendar, DollarSign, CreditCard, ChevronDown, ChevronUp, ArrowUp, ArrowDown, HelpCircle, ArrowLeft } from "lucide-react";
import { getAllFunds } from "@/app/risk-assessment/data/funds";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

type InvestmentData = {
  amount: number;
  portfolio: PortfolioItem[];
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

interface FundPrice {
  id: number;
  currentPrice: number;
  change24h: number;
}

// Mock prices - same as assets page
const mockPrices: FundPrice[] = [
  { id: 1, currentPrice: 125000, change24h: 0.5 },
  { id: 2, currentPrice: 118000, change24h: 0.3 },
  { id: 3, currentPrice: 2850000, change24h: -1.2 },
  { id: 4, currentPrice: 95000, change24h: 2.1 },
  { id: 5, currentPrice: 12500, change24h: 1.8 }, // توکن نقره TWIN
];

// Fund colors - same as portfolio pie chart
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

export default function AppPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestInvestment, setLatestInvestment] = useState<InvestmentData | null>(null);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPortfolioComparisonModalOpen, setIsPortfolioComparisonModalOpen] = useState(false);
  const [priceChartPeriod, setPriceChartPeriod] = useState<"1d" | "1w" | "1m">("1d");
  const [primaryColor, setPrimaryColor] = useState<string>("hsl(225, 68%, 22%)");

  useEffect(() => {
    // Load portfolio and latest investment from localStorage
    try {
      const savedPortfolio = localStorage.getItem("portfolio");
      if (savedPortfolio) {
        const parsed = JSON.parse(savedPortfolio);
        setPortfolio(parsed);
      }

      const savedInvestment = localStorage.getItem("latestInvestment");
      if (savedInvestment) {
        const parsed = JSON.parse(savedInvestment);
        setLatestInvestment(parsed);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    } finally {
      setIsLoading(false);
    }

    // Get primary color from CSS variable
    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue("--primary").trim();
    if (primary) {
      // CSS variable format: "225 68% 22%" -> convert to "hsl(225, 68%, 22%)"
      const hslValues = primary.split(" ");
      if (hslValues.length >= 3) {
        setPrimaryColor(`hsl(${hslValues[0]}, ${hslValues[1]}, ${hslValues[2]})`);
      }
    }
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getFundPrice = (fundId: number): FundPrice | undefined => {
    return mockPrices.find((p) => p.id === fundId);
  };

  const calculateFundValue = (fundId: number, investmentAmount: number, percentage: number): number => {
    const price = getFundPrice(fundId);
    if (!price) return 0;
    
    // Calculate number of units based on investment amount and percentage
    const fundInvestmentAmount = (investmentAmount * percentage) / 100;
    const units = fundInvestmentAmount / price.currentPrice;
    
    // Current value = units * current price
    return units * price.currentPrice;
  };

  const calculateProfitLoss = (investmentAmount: number, currentValue: number): number => {
    if (investmentAmount === 0) return 0;
    return ((currentValue - investmentAmount) / investmentAmount) * 100;
  };

  const toggleFund = (fundId: number) => {
    setExpandedFunds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fundId)) {
        newSet.delete(fundId);
      } else {
        newSet.add(fundId);
      }
      return newSet;
    });
  };

  // Mock chart data for different periods
  const generateChartData = (period: "1d" | "1w" | "1m") => {
    if (!latestInvestment) return [];
    const dataPoints = period === "1d" ? 24 : period === "1w" ? 7 : 30;
    const baseValue = latestInvestment.investmentAmount;
    const data: { time: number; value: number }[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const value = baseValue * (1 + variation * (i / dataPoints));
      data.push({
        time: i,
        value: Math.max(value, baseValue * 0.9), // Minimum 90% of base
      });
    }
    
    return data;
  };

  const chartData = latestInvestment ? generateChartData(priceChartPeriod) : [];
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.value), latestInvestment?.investmentAmount || 0)
    : latestInvestment?.investmentAmount || 0;
  const minValue = chartData.length > 0
    ? Math.min(...chartData.map(d => d.value), latestInvestment?.investmentAmount || 0)
    : latestInvestment?.investmentAmount || 0;
  const range = maxValue - minValue || 1;

  // Calculate percentage change for selected period
  const calculatePeriodChange = () => {
    if (!latestInvestment || chartData.length === 0) return 0;
    const startValue = chartData[0].value;
    const endValue = chartData[chartData.length - 1].value;
    return ((endValue - startValue) / startValue) * 100;
  };

  const periodChange = calculatePeriodChange();
  const isPeriodPositive = periodChange >= 0;

  // Calculate next installment
  const getNextInstallment = () => {
    if (!latestInvestment || !latestInvestment.useLoan || !latestInvestment.loanDetails || !latestInvestment.loanPeriod) {
      return null;
    }

    try {
      // Find investment index
      const savedInvestments = localStorage.getItem("investments");
      if (!savedInvestments) return null;
      
      const investments = JSON.parse(savedInvestments);
      const investmentIndex = investments.findIndex(
        (inv: InvestmentData) => inv.createdAt === latestInvestment.createdAt
      );
      
      if (investmentIndex === -1) return null;

      // Calculate installments
      const firstDueDate = new Date(latestInvestment.loanDetails.dueDate);
      const monthlyInstallment = latestInvestment.loanDetails.monthlyInstallment;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find next unpaid installment
      for (let i = 0; i < latestInvestment.loanPeriod; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setHours(0, 0, 0, 0);

        const paymentKey = `installment_${investmentIndex}_${i + 1}_paid`;
        const isPaid = typeof window !== 'undefined' && localStorage.getItem(paymentKey) === 'true';

        if (!isPaid) {
          return {
            number: i + 1,
            dueDate,
            amount: monthlyInstallment,
            investmentIndex,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to calculate next installment:", error);
      return null;
    }
  };

  const nextInstallment = getNextInstallment();

  // Prepare Chart.js data
  const chartLabels = chartData.map((_, index) => {
    if (priceChartPeriod === "1d") return `${index}:00`;
    if (priceChartPeriod === "1w") return `روز ${index + 1}`;
    return `روز ${index + 1}`;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${formatNumber(Math.round(context.parsed.y))} تومان`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 2.5,
        borderColor: "hsl(var(--primary))",
      },
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
  };

  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: "ارزش سرمایه",
        data: chartData.map((d) => d.value),
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          // Convert HSL to HSLA for transparency
          // primaryColor format: "hsl(225, 68%, 22%)" -> extract values
          const hslMatch = primaryColor.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
          if (hslMatch) {
            const [, h, s, l] = hslMatch;
            gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0.3)`);
            gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
          } else {
            // Fallback
            gradient.addColorStop(0, "hsla(225, 68%, 22%, 0.3)");
            gradient.addColorStop(1, "hsla(225, 68%, 22%, 0)");
          }
          return gradient;
        },
        borderColor: primaryColor,
        borderWidth: 2.5,
        tension: 0.4,
      },
    ],
  };

  if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-full">
      <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-full">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold">پورتفوی شما خالی است</h2>
              <p className="text-muted-foreground">
                برای شروع سرمایه‌گذاری، ابتدا ارزیابی ریسک را انجام دهید
              </p>
              <Button
                onClick={() => router.push("/risk-assessment")}
                className="mt-4"
                size="lg"
              >
                شروع ارزیابی ریسک
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Next Installment Due Date Card */}
        {nextInstallment && (
          <Card 
            className="border-primary/20 bg-primary/5 cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/30 active:scale-[0.98]"
            onClick={() => {
              router.push(`/app/activities/installments?index=${nextInstallment.investmentIndex}`);
            }}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">سررسید قسط بعدی</p>
                    <p className="text-base font-semibold">
                      {nextInstallment.dueDate.toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg flex-shrink-0">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Holdings Card */}
        {latestInvestment && latestInvestment.portfolio.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>دارایی‌های من</CardTitle>
                <button
                  onClick={() => setIsInfoModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestInvestment.portfolio.map((item) => {
                const price = getFundPrice(item.fundId);
                const currentValue = calculateFundValue(
                  item.fundId,
                  latestInvestment.investmentAmount,
                  item.percentage
                );
                const fundInvestmentAmount = (latestInvestment.investmentAmount * item.percentage) / 100;
                const profitLoss = calculateProfitLoss(fundInvestmentAmount, currentValue);
                const isExpanded = expandedFunds.has(item.fundId);
                const isProfit = profitLoss >= 0;

                const fundPercentage = latestInvestment.investmentAmount > 0
                  ? (fundInvestmentAmount / latestInvestment.investmentAmount) * 100
                  : 0;

                return (
                  <div
                    key={item.fundId}
                    className="rounded-lg border bg-muted/50 overflow-hidden relative"
                  >
                    <button
                      onClick={() => toggleFund(item.fundId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.fundName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {price && (
                          <div className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${
                            price.change24h >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {price.change24h >= 0 ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            <span>
                              {price.change24h >= 0 ? "+" : ""}
                              {price.change24h.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${fundPercentage}%` }}
                      />
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t">
                        <div className="space-y-1 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">مبلغ سرمایه‌گذاری:</span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatNumber(Math.round(fundInvestmentAmount))} تومان
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ارزش فعلی:</span>
                            <span className="text-sm font-bold tabular-nums text-primary">
                              {formatNumber(Math.round(currentValue))} تومان
                            </span>
                          </div>
                          {price && (
                            <div className="flex items-center justify-between pt-1 border-t">
                              <span className="text-xs text-muted-foreground">قیمت هر واحد:</span>
                              <span className="text-xs font-semibold tabular-nums">
                                {formatNumber(price.currentPrice)} تومان
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Price Changes Chart */}
        {latestInvestment && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>تغییرات قیمت</CardTitle>
                <div className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                  isPeriodPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {isPeriodPositive ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span>
                    {isPeriodPositive ? "+" : ""}
                    {periodChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Period Filters */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setPriceChartPeriod("1d")}
                  variant={priceChartPeriod === "1d" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  ۱ روزه
                </Button>
                <Button
                  onClick={() => setPriceChartPeriod("1w")}
                  variant={priceChartPeriod === "1w" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  ۱ هفته
                </Button>
                <Button
                  onClick={() => setPriceChartPeriod("1m")}
                  variant={priceChartPeriod === "1m" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  ۱ ماه
                </Button>
              </div>

              {/* Chart */}
              <div className="relative h-48 w-full">
                {chartData.length > 0 ? (
                  <Line data={chartDataConfig} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <span className="text-sm">داده‌ای برای نمایش وجود ندارد</span>
                  </div>
                )}
                
                {/* Current value display */}
                {chartData.length > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <div className="bg-background/80 backdrop-blur-sm rounded px-2 py-1 border">
                      <span className="text-xs font-semibold tabular-nums">
                        {formatNumber(Math.round(chartData[chartData.length - 1].value))} تومان
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Comparison Chart */}
        {latestInvestment && latestInvestment.portfolio.length > 1 && latestInvestment.status === "completed" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مقایسه پورتفوی</CardTitle>
                <button
                  onClick={() => setIsPortfolioComparisonModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Prepare data for comparison chart
                const chartLabels = latestInvestment.portfolio.map(item => item.fundName);
                const portfolioPercentages = latestInvestment.portfolio.map(item => item.percentage);
                
                // Calculate active percentages (fundPercentage)
                const activePercentages = latestInvestment.portfolio.map((item) => {
                  const fundInvestmentAmount = (latestInvestment.investmentAmount * item.percentage) / 100;
                  return latestInvestment.investmentAmount > 0
                    ? (fundInvestmentAmount / latestInvestment.investmentAmount) * 100
                    : 0;
                });

                // Get colors for each fund
                const backgroundColors = latestInvestment.portfolio.map((_, index) => 
                  fundColors[index % fundColors.length]
                );

                const chartData = {
                  labels: chartLabels,
                  datasets: [
                    {
                      label: "درصد پورتفوی",
                      data: portfolioPercentages,
                      backgroundColor: backgroundColors.map(color => `${color}80`), // 50% opacity
                      borderColor: backgroundColors,
                      borderWidth: 1,
                      barThickness: 8,
                      maxBarThickness: 12,
                      borderRadius: {
                        topLeft: 4,
                        topRight: 4,
                        bottomLeft: 0,
                        bottomRight: 0,
                      },
                    },
                    {
                      label: "درصد فعالی",
                      data: activePercentages,
                      backgroundColor: backgroundColors.map(color => `${color}CC`), // 80% opacity
                      borderColor: backgroundColors,
                      borderWidth: 1,
                      barThickness: 8,
                      maxBarThickness: 12,
                      borderRadius: {
                        topLeft: 4,
                        topRight: 4,
                        bottomLeft: 0,
                        bottomRight: 0,
                      },
                    },
                  ],
                };

                const chartOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      rtl: true,
                      callbacks: {
                        label: function (context: any) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2) + "%";
                          }
                          return label;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      stacked: false,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          size: 11,
                        },
                      },
                      categoryPercentage: 0.5,
                      barPercentage: 0.6,
                    },
                    y: {
                      stacked: false,
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        display: false,
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                };

                // Calculate change percentage for each fund (activePercentage - portfolioPercentage)
                const fundChanges = latestInvestment.portfolio.map((item, index) => {
                  const portfolioPercentage = item.percentage;
                  const activePercentage = activePercentages[index];
                  const changePercentage = activePercentage - portfolioPercentage;
                  return {
                    fundName: item.fundName,
                    changePercentage,
                    color: backgroundColors[index],
                  };
                });

                return (
                  <>
                    <div className="relative h-64 w-full">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                    
                    {/* Fund Changes Info */}
                    <div className="mt-6 space-y-2 pt-4 border-t">
                      {fundChanges.map((fund, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: fund.color }}
                            />
                            <span className="text-sm font-medium">{fund.fundName}</span>
                          </div>
                          <div className={`text-sm font-semibold tabular-nums ${
                            fund.changePercentage > 0 ? "text-green-600" : 
                            fund.changePercentage < 0 ? "text-red-600" : 
                            "text-muted-foreground"
                          }`}>
                            {fund.changePercentage > 0 ? "+" : ""}
                            {fund.changePercentage.toFixed(2)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        

        {/* Info Modal */}
        <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
          <DialogContent onClose={() => setIsInfoModalOpen(false)}>
            <DialogHeader>
              <DialogTitle>راهنمای دارایی‌های من</DialogTitle>
              <DialogDescription>
                توضیحات مربوط به نمایش دارایی‌ها
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">درصد تغییرات:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  درصد نمایشی رو به روی اسم هر سهم - نمایانگر درصد تغییرات اون سهم هست از زمان خریداری شده تا به امروز
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">سهم دارایی:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  نوار پیشرفت در پایین هر کارت صندوق، نشان‌دهنده درصد سهم هر دارایی از کل موجودی شما است. 
                  این نوار به شما کمک می‌کند تا به راحتی ببینید که چه مقدار از سرمایه‌گذاری شما در هر صندوق قرار دارد.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Portfolio Pie Chart - Only show before investment */}
        {(!latestInvestment || latestInvestment.status !== "completed") && (
          <PortfolioPieChart items={portfolio} />
        )}
        
        {/* Loan Banner - Only show before investment */}
        {(!latestInvestment || latestInvestment.status !== "completed") && (
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full rounded-lg overflow-hidden">
                <img
                  src="/images/banner_1.png"
                  alt="وام تا ۷۰٪ مبلغ سرمایه‌گذاری شما"
                  className="w-full h-auto object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


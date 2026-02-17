"use client";

import { useEffect, useState } from "react";
import { PortfolioPieChart, PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  ArrowLeft,
  Wallet,
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  Banknote,
  Landmark,
  Coins,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { CoinIcon } from "@/shared/components/coin-icon";
import { getWalletState, formatBtcDisplay, type WalletBalances } from "./wallet/lib/wallet-storage";
import { getAllFunds } from "@/app/risk-assessment/data/funds";
import LogoLoop from "@/shared/components/logo-loop";
import { handlerBank, maskPanHandler } from "@/shared/lib/bank-card";
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

const creditSliderItems = [
  {
    id: "loan",
    title: "وام",
    description: "اعتبار نقدی فوری برای شروع.",
    icon: Banknote,
    href: "/app/credit/loan",
  },
  {
    id: "funds",
    title: "اوراق صندوق‌ها",
    description: "استفاده از اوراق صندوق‌های نوین.",
    icon: Landmark,
    href: "/app/credit/funds",
  },
  {
    id: "crypto",
    title: "دارایی کریپتو",
    description: "وثیقه‌گذاری کریپتو برای اعتبار.",
    icon: Coins,
    href: "/app/credit/crypto",
  },
  {
    id: "twin",
    title: "توکن تیوین TWIN",
    description: "اعتبار بر اساس ارزش TWIN.",
    icon: Sparkles,
    href: "/app/credit/twin",
  },
] as const;

export default function AppPage() {
  const router = useRouter();
  const tWallet = useTranslations("app.wallet");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestInvestment, setLatestInvestment] = useState<InvestmentData | null>(null);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPortfolioComparisonModalOpen, setIsPortfolioComparisonModalOpen] = useState(false);
  const [priceChartPeriod, setPriceChartPeriod] = useState<"1d" | "1w" | "1m">("1d");
  const [primaryColor, setPrimaryColor] = useState<string>("hsl(225, 68%, 22%)");
  const [walletRegistered, setWalletRegistered] = useState(false);
  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(null); // فقط برای کیف پول کریپتو
  const [isWalletBalanceVisible, setIsWalletBalanceVisible] = useState(true);
  const [isWalletMoreInfoOpen, setIsWalletMoreInfoOpen] = useState(false);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [mainWalletCards, setMainWalletCards] = useState<string[]>([]);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [mainWalletBalance, setMainWalletBalance] = useState<number>(0); // موجودی کیف پول اصلی (تومان)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedCardForDeposit, setSelectedCardForDeposit] = useState<string | null>(null);
  const [selectedCardForWithdraw, setSelectedCardForWithdraw] = useState<string | null>(null);
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositAmountRial, setDepositAmountRial] = useState(0);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [withdrawAmountToman, setWithdrawAmountToman] = useState(0);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [walletInlineMessage, setWalletInlineMessage] = useState<string | null>(null);
  const [isWalletDetailsOpen, setIsWalletDetailsOpen] = useState(false);
  const [walletCredits, setWalletCredits] = useState({
    loan: 0,
    funds: 0,
    crypto: 0,
    twin: 0,
  });
  const [activeCreditSlide, setActiveCreditSlide] = useState(0);

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

      const walletState = getWalletState();
      setWalletRegistered(walletState.walletRegistered);
      setWalletBalances(walletState.walletBalances);

      if (typeof window !== "undefined") {
        // Load main wallet bank cards (کیف پول اصلی غیرکریپتو)
        const storedCards = localStorage.getItem("mainWalletCards");
        if (storedCards) {
          try {
            const parsedCards = JSON.parse(storedCards);
            if (Array.isArray(parsedCards)) {
              setMainWalletCards(parsedCards);
            }
          } catch {
            // ignore parse errors
          }
        }

        // Load main wallet balance (تومان)
        const storedBalance = localStorage.getItem("mainWalletBalanceToman");
        if (storedBalance != null) {
          const parsedBalance = Number(storedBalance);
          if (!Number.isNaN(parsedBalance) && parsedBalance >= 0) {
            setMainWalletBalance(Math.floor(parsedBalance));
          }
        }

        const storedCredits = localStorage.getItem("walletCredits");
        if (storedCredits) {
          try {
            const parsedCredits = JSON.parse(storedCredits);
            if (
              parsedCredits &&
              typeof parsedCredits === "object" &&
              ["loan", "funds", "crypto", "twin"].every((k) => typeof parsedCredits[k] === "number")
            ) {
              setWalletCredits({
                loan: parsedCredits.loan,
                funds: parsedCredits.funds,
                crypto: parsedCredits.crypto,
                twin: parsedCredits.twin,
              });
            }
          } catch {
            // ignore
          }
        }
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

  useEffect(() => {
    if (creditSliderItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCreditSlide((prev) => (prev + 1) % creditSliderItems.length);
    }, 5000);
    return () => clearInterval(interval);
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

  const toPersianDigits = (value: string): string => {
    const persianDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
    return value.replace(/\d/g, (d) => persianDigits[Number(d)]);
  };

  // تبدیل عدد به حروف فارسی (مبنای ریال/تومان)
  const wordifyfa = (num: string | number, level = 0): string => {
    const toEnglishDigits = (val: string | number): number => {
      if (typeof val !== "string") {
        return val;
      }
      const faDigits = "۰۱۲۳۴۵۶۷۸۹";
      const arDigits = "٠١٢٣٤٥٦٧٨٩";
      let output = "";
      for (const n of val) {
        const faIndex = faDigits.indexOf(n);
        if (faIndex >= 0) {
          output += faIndex.toString();
          continue;
        }
        const arIndex = arDigits.indexOf(n);
        if (arIndex >= 0) {
          output += arIndex.toString();
          continue;
        }
        output += n;
      }
      return parseInt(output.replace(/,/g, ""));
    };

    if (num === null) {
      return "";
    }

    num = toEnglishDigits(num);

    if (num < 0) {
      num = num * -1;
      return "منفی " + wordifyfa(num, level);
    }
    if (num === 0) {
      if (level === 0) {
        return "صفر";
      }
      return "";
    }

    let result = "";
    const yekan = [" یک ", " دو ", " سه ", " چهار ", " پنج ", " شش ", " هفت ", " هشت ", " نه "];
    const dahgan = [" بیست ", " سی ", " چهل ", " پنجاه ", " شصت ", " هفتاد ", " هشتاد ", " نود "];
    const sadgan = [" یکصد ", " دویست ", " سیصد ", " چهارصد ", " پانصد ", " ششصد ", " هفتصد ", " هشتصد ", " نهصد "];
    const dah = [
      " ده ",
      " یازده ",
      " دوازده ",
      " سیزده ",
      " چهارده ",
      " پانزده ",
      " شانزده ",
      " هفده ",
      " هیجده ",
      " نوزده ",
    ];

    if (level > 0) {
      result += " و ";
      level -= 1;
    }

    if (num < 10) {
      result += yekan[num - 1];
    } else if (num < 20) {
      result += dah[num - 10];
    } else if (num < 100) {
      result += dahgan[Math.floor(num / 10) - 2] + wordifyfa(num % 10, level + 1);
    } else if (num < 1000) {
      result += sadgan[Math.floor(num / 100) - 1] + wordifyfa(num % 100, level + 1);
    } else if (num < 1_000_000) {
      result += wordifyfa(Math.floor(num / 1000), level) + " هزار " + wordifyfa(num % 1000, level + 1);
    } else if (num < 1_000_000_000) {
      result += wordifyfa(Math.floor(num / 1_000_000), level) + " میلیون " + wordifyfa(num % 1_000_000, level + 1);
    } else if (num < 1_000_000_000_000) {
      result += wordifyfa(Math.floor(num / 1_000_000_000), level) + " میلیارد " + wordifyfa(num % 1_000_000_000, level + 1);
    } else if (num < 1_000_000_000_000_000) {
      result +=
        wordifyfa(Math.floor(num / 1_000_000_000_000), level) +
        " تریلیارد " +
        wordifyfa(num % 1_000_000_000_000, level + 1);
    }

    return result;
  };

  const formatTomanInWords = (amount: number): string => {
    if (!amount || amount <= 0) return "";
    return `${wordifyfa(amount, 0)} تومان`;
  };

  // نرمال‌سازی ورودی مبلغ (حذف جداکننده‌ها و تبدیل ارقام فارسی/عربی به انگلیسی)
  const normalizeAmountInput = (raw: string): number => {
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
    if (!digits) return 0;
    return Number(digits);
  };

  const normalizeCardInput = (value: string): { digits: string; formatted: string } => {
    // تبدیل ارقام فارسی/عربی به انگلیسی و حذف کاراکترهای غیرعددی
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
    let digits = "";
    for (const ch of value) {
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

    // محدود کردن به حداکثر ۱۶ رقم (ماسک 9999 9999 9999 9999)
    digits = digits.slice(0, 16);

    // فرمت کردن برای نمایش به صورت 4-4-4-4
    let formatted = digits;
    if (digits.length > 0) {
      const part1 = digits.slice(0, 4);
      const part2 = digits.slice(4, 8);
      const part3 = digits.slice(8, 12);
      const part4 = digits.slice(12, 16);
      formatted = part1;
      if (part2) formatted += " " + part2;
      if (part3) formatted += " " + part3;
      if (part4) formatted += " " + part4;
    }

    return { digits, formatted };
  };

  const handleAddMainWalletCard = () => {
    const digitsOnly = newCardNumber.replace(/\D/g, "");
    // فرمت کارت: 9999 9999 9999 9999 → ۱۶ رقم (۴+۴+۴+۴)
    if (digitsOnly.length !== 16) {
      return;
    }
    // اعتبارسنجی BIN از روی لیست بانک‌ها
    const bank = handlerBank(digitsOnly);
    const isValidBin = !!bank.bankName && bank.id !== "pasinno";
    if (!isValidBin) {
      return;
    }
    const updated = Array.from(new Set([...mainWalletCards, digitsOnly]));
    setMainWalletCards(updated);
    setNewCardNumber("");
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("mainWalletCards", JSON.stringify(updated));
      }
    } catch {
      // ignore storage errors
    }
  };

  const formatCardNumberForDisplay = (card: string): string => {
    const digits = card.replace(/\D/g, "");
    // نمایش به صورت 9999 9999 9999 9999 (۴-۴-۴-۴)
    if (digits.length !== 16) return card;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
  };

  const removeMainWalletCard = (cardToRemove: string) => {
    setMainWalletCards((prev) => {
      const updated = prev.filter((c) => c !== cardToRemove);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("mainWalletCards", JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
    setSelectedCardForDeposit((prev) => (prev === cardToRemove ? null : prev));
    setSelectedCardForWithdraw((prev) => (prev === cardToRemove ? null : prev));
    setDeleteConfirmCard((prev) => (prev === cardToRemove ? null : prev));
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

  // Funds ticker data for home screen (duplicated for longer loop)
  const allFunds = getAllFunds();
  const tickerItems =
    allFunds.length > 0
      ? allFunds
          .map((fund) => {
            const price = getFundPrice(fund.id);
            if (!price) return null;
            const isPositive = price.change24h >= 0;
            return {
              node: (
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-medium whitespace-nowrap">
                    {fund.name}
                  </span>
                  <span className="tabular-nums text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatNumber(price.currentPrice)} تومان
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {price.change24h.toFixed(2)}%
                    </span>
                  </span>
                </div>
              ),
              title: fund.name,
            };
          })
          .filter(Boolean) as { node: React.ReactNode; title: string }[]
      : [];

  const tickerLogos =
    tickerItems.length > 0
      ? Array.from({ length: 6 }, () => tickerItems).flat()
      : [];

  const getCardBankMeta = (card: string) => {
    const pan = card.replace(/\D/g, "");
    const bank = handlerBank(pan);
    const masked = maskPanHandler(pan);
    return {
      bank,
      pan,
      masked,
    };
  };

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
      <>
        <div className="flex flex-col items-center justify-center p-4 min-h-full">
          <div className="w-full max-w-md space-y-6">
          {/* Main Wallet Card – بالای صفحه اصلی */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ارزش کل دارایی کیف پول
                </CardTitle>
                <button
                  type="button"
                  className="text-[11px] font-medium text-primary hover:underline"
                  onClick={() => setIsWalletDetailsOpen((prev) => !prev)}
                >
                  {isWalletDetailsOpen ? "بستن جزئیات" : "نمایش جزئیات"}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums">
                  {isWalletBalanceVisible ? (
                    <>
                      {formatNumber(mainWalletBalance)}{" "}
                      <span className="text-base font-normal">تومان</span>
                    </>
                  ) : (
                    "•••••••"
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setIsWalletBalanceVisible((v) => !v)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label={isWalletBalanceVisible ? "مخفی کردن موجودی" : "نمایش موجودی"}
                >
                  {isWalletBalanceVisible ? (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isWalletDetailsOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">موجودی کیف پول</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(mainWalletBalance)} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اعتبار وام</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(walletCredits.loan)} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اعتبار اوراق صندوق</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(walletCredits.funds)} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اعتبار کریپتو</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(walletCredits.crypto)} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اعتبار TWIN</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(walletCredits.twin)} تومان
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-stretch justify-between gap-2">
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
                  onClick={() => {
                    if (mainWalletCards.length === 0) {
                      setWalletInlineMessage("برای واریز ابتدا باید کارت بانکی اضافه کنید.");
                      return;
                    }
                    setWalletInlineMessage(null);
                    setSelectedCardForDeposit(null);
                    setDepositAmountInput("");
                    setDepositAmountRial(0);
                    setIsDepositModalOpen(true);
                  }}
                >
                  <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">واریز</span>
                </button>
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
                  onClick={() => {
                    if (mainWalletCards.length === 0) {
                      setWalletInlineMessage("برای برداشت ابتدا باید کارت بانکی اضافه کنید.");
                      return;
                    }
                    setWalletInlineMessage(null);
                    setSelectedCardForWithdraw(null);
                    setWithdrawAmountInput("");
                    setWithdrawAmountToman(0);
                    setIsWithdrawModalOpen(true);
                  }}
                >
                  <ArrowUpFromLine className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">برداشت</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWalletInlineMessage(null);
                    setIsCardsModalOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
                >
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">کارت‌ها</span>
                </button>
              </div>

              {walletInlineMessage && (
                <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {walletInlineMessage}
                </div>
              )}

              {isWalletMoreInfoOpen && (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">موجودی قابل برداشت</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {isWalletBalanceVisible ? (
                        <>
                          {formatNumber(mainWalletBalance)}{" "}
                          <span className="text-xs font-normal">تومان</span>
                        </>
                      ) : (
                        "•••••••"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Wallet Cards Modal – فقط برای حالت پورتفوی خالی نیز رندر شود */}
          <Dialog open={isCardsModalOpen} onOpenChange={setIsCardsModalOpen}>
            <DialogContent onClose={() => setIsCardsModalOpen(false)}>
              <DialogHeader>
                <DialogTitle>افزودن کارت بانکی</DialogTitle>
                <DialogDescription>لیست کارت‌های بانکی متصل به کیف پول اصلی شما.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="main-wallet-card-number-empty">
                    شماره کارت
                  </label>
                  <input
                    id="main-wallet-card-number-empty"
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="0000 0000 0000 0000"
                    value={newCardNumber}
                    onChange={(e) => {
                      const { formatted } = normalizeCardInput(e.target.value);
                      setNewCardNumber(formatted);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    کارت بانکی باید به نام دارنده حساب اصلی باشد.
                  </p>
                  {(() => {
                    const digitsLen = newCardNumber.replace(/\D/g, "").length;
                    if (digitsLen < 6) return null;
                    const { bank } = getCardBankMeta(newCardNumber);
                    const isValidBin = !!bank.bankName && bank.id !== "pasinno";
                    if (!isValidBin) {
                      return (
                        <p className="text-xs text-destructive mt-1">
                          شماره کارت اشتباه است.
                        </p>
                      );
                    }
                    const logoSrc = `/images/bankLogos/${bank.logo}`;
                    return (
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <div className="relative h-5 w-5 overflow-hidden rounded-full bg-muted">
                          <Image
                            src={logoSrc}
                            alt={bank.bankName || "لوگوی بانک"}
                            fill
                            sizes="20px"
                            className="object-contain"
                          />
                        </div>
                        <span className="font-medium">
                          {bank.bankName || "کارت بانکی"}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleAddMainWalletCard}
                  disabled={(() => {
                    const digitsLen = newCardNumber.replace(/\D/g, "").length;
                    if (digitsLen !== 16) return true;
                    const { bank } = getCardBankMeta(newCardNumber);
                    const isValidBin = !!bank.bankName && bank.id !== "pasinno";
                    return !isValidBin;
                  })()}
                >
                  ثبت شماره کارت
                </Button>

                {mainWalletCards.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium">لیست کارت‌های بانکی</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {mainWalletCards.map((card) => {
                        const { bank, masked } = getCardBankMeta(card);
                        const logoSrc = `/images/bankLogos/${bank.logo}`;
                        const isConfirming = deleteConfirmCard === card;
                        return (
                          <div
                            key={card}
                            className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
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
                                <span className="text-[11px] font-medium">
                                  {bank.bankName || "کارت بانکی"}
                                </span>
                                <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                                  {formatCardNumberForDisplay(masked)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isConfirming) {
                                  removeMainWalletCard(card);
                                } else {
                                  setDeleteConfirmCard(card);
                                }
                              }}
                              className="ml-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] leading-none"
                              >
                                ×
                              </span>
                              <span
                                className={`overflow-hidden text-[11px] transition-all duration-200 ${
                                  isConfirming
                                    ? "max-w-[200px] opacity-100 ml-1"
                                    : "max-w-0 opacity-0"
                                }`}
                              >
                                برای حذف مجددا کلیک کنید
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Deposit Modal */}
          <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
            <DialogContent onClose={() => setIsDepositModalOpen(false)}>
              <DialogHeader>
                <DialogTitle>واریز به کیف پول</DialogTitle>
                <DialogDescription>از بین کارت‌های بانکی خود یک کارت را انتخاب کنید و مبلغ را وارد کنید.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Card selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">انتخاب کارت بانکی</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {mainWalletCards.map((card) => {
                      const selected = selectedCardForDeposit === card;
                      const { bank, masked } = getCardBankMeta(card);
                      const logoSrc = `/images/bankLogos/${bank.logo}`;
                      return (
                        <button
                          key={card}
                          type="button"
                          onClick={() => setSelectedCardForDeposit(card)}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-muted bg-muted/40 hover:bg-muted/70"
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
                              <span className="text-[11px] font-medium">
                                {bank.bankName || "کارت بانکی"}
                              </span>
                              <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                                {formatCardNumberForDisplay(masked)}
                              </span>
                            </div>
                          </div>
                          {selected && (
                            <span className="text-xs text-primary font-medium">انتخاب شده</span>
                          )}
                        </button>
                      );
                    })}
                    {mainWalletCards.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        هیچ کارتی ثبت نشده است. ابتدا کارت بانکی اضافه کنید.
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount input (rial) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="deposit-amount-input">
                    مبلغ واریز (ریال)
                  </label>
                  <input
                    id="deposit-amount-input"
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
                      digits = digits.slice(0, 15);
                      const amountRial = digits ? Number(digits) : 0;
                      setDepositAmountRial(amountRial);
                      setDepositAmountInput(digits ? formatNumber(amountRial) : "");
                    }}
                  />
                  {Math.floor(depositAmountRial / 10) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      معادل:{" "}
                      <span className="font-medium">
                        {formatTomanInWords(Math.floor(depositAmountRial / 10))}
                      </span>
                    </p>
                  )}
                </div>

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
                      setMainWalletBalance((prev) => {
                        const next = Math.max(0, prev + depositToman);
                        try {
                          if (typeof window !== "undefined") {
                            localStorage.setItem(
                              "mainWalletBalanceToman",
                              String(next)
                            );
                          }
                        } catch {
                          // ignore
                        }
                        return next;
                      });
                      setIsProcessingDeposit(false);
                      setIsDepositModalOpen(false);
                      setDepositAmountInput("");
                      setDepositAmountRial(0);
                      setSelectedCardForDeposit(null);
                    }, 2000);
                  }}
                >
                  {isProcessingDeposit ? "در حال پردازش..." : "پرداخت"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Withdraw Modal */}
          <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
            <DialogContent onClose={() => setIsWithdrawModalOpen(false)}>
              <DialogHeader>
                <DialogTitle>برداشت به کارت بانکی</DialogTitle>
                <DialogDescription>کارت مقصد را انتخاب کرده و مبلغ برداشت را وارد کنید.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                  <span>فقط موجودی کیف پول اصلی قابل برداشت است.</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(mainWalletBalance)} تومان
                  </span>
                </div>

                {/* Card selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">انتخاب کارت بانکی</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {mainWalletCards.map((card) => {
                      const selected = selectedCardForWithdraw === card;
                      const { bank, masked } = getCardBankMeta(card);
                      const logoSrc = `/images/bankLogos/${bank.logo}`;
                      return (
                        <button
                          key={card}
                          type="button"
                          onClick={() => setSelectedCardForWithdraw(card)}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-muted bg-muted/40 hover:bg-muted/70"
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
                              <span className="text-[11px] font-medium">
                                {bank.bankName || "کارت بانکی"}
                              </span>
                              <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                                {formatCardNumberForDisplay(masked)}
                              </span>
                            </div>
                          </div>
                          {selected && (
                            <span className="text-xs text-primary font-medium">انتخاب شده</span>
                          )}
                        </button>
                      );
                    })}
                    {mainWalletCards.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        هیچ کارتی ثبت نشده است. ابتدا کارت بانکی اضافه کنید.
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount input (toman) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="withdraw-amount-input">
                      مبلغ برداشت (تومان)
                    </label>
                    <button
                      type="button"
                      disabled={mainWalletBalance <= 0}
                      onClick={() => {
                        const maxAmount = mainWalletBalance;
                        setWithdrawAmountToman(maxAmount);
                        setWithdrawAmountInput(
                          maxAmount > 0 ? formatNumber(maxAmount) : ""
                        );
                      }}
                      className="text-[11px] font-medium text-primary disabled:text-muted-foreground hover:underline"
                    >
                      حداکثر قابل برداشت
                    </button>
                  </div>
                  <input
                    id="withdraw-amount-input"
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="مثلاً ۱۰۰,۰۰۰"
                    value={withdrawAmountInput}
                    onChange={(e) => {
                      const raw = e.target.value;
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
                      digits = digits.slice(0, 15);
                      const amountToman = digits ? Number(digits) : 0;
                      setWithdrawAmountToman(amountToman);
                      setWithdrawAmountInput(digits ? formatNumber(amountToman) : "");
                    }}
                  />
                  {withdrawAmountToman > 0 && (
                    <p className="text-xs text-muted-foreground">
                      مبلغ انتخابی:{" "}
                      <span className="font-medium">
                        {formatTomanInWords(withdrawAmountToman)}
                      </span>
                    </p>
                  )}
                  {withdrawAmountToman > mainWalletBalance && (
                    <p className="text-xs text-red-600">
                      مبلغ بیشتر از موجودی کیف پول است.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    isProcessingWithdraw ||
                    !selectedCardForWithdraw ||
                    withdrawAmountToman <= 0 ||
                    withdrawAmountToman > mainWalletBalance
                  }
                  onClick={() => {
                    if (
                      !selectedCardForWithdraw ||
                      withdrawAmountToman <= 0 ||
                      withdrawAmountToman > mainWalletBalance
                    ) {
                      return;
                    }
                    setIsProcessingWithdraw(true);
                    setTimeout(() => {
                      setMainWalletBalance((prev) => {
                        const next = Math.max(0, prev - withdrawAmountToman);
                        try {
                          if (typeof window !== "undefined") {
                            localStorage.setItem(
                              "mainWalletBalanceToman",
                              String(next)
                            );
                          }
                        } catch {
                          // ignore
                        }
                        return next;
                      });
                      setIsProcessingWithdraw(false);
                      setIsWithdrawModalOpen(false);
                      setWithdrawAmountInput("");
                      setWithdrawAmountToman(0);
                      setSelectedCardForWithdraw(null);
                    }, 2000);
                  }}
                >
                  {isProcessingWithdraw ? "در حال پردازش..." : "درخواست برداشت"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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

          {/* Credit teaser widget */}
          <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
              <div className="text-right space-y-1">
                <p className="text-xs font-medium text-primary">
                  با هر روشی که دوست داری، می‌تونی اعتبار بگیری؛
                </p>
                <p className="text-xs text-muted-foreground">
                  نقدی، صندوق، کریپتو یا تیوین؛ سرمایه‌گذاری رو ادامه بده، حتی وقتی حسابت لَیـن.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  روش‌های مختلف دریافت اعتبار
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/app/credit")}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  مشاهده همه
                </button>
              </div>
              <div className="relative min-h-[92px]">
                {creditSliderItems.map((opt, index) => {
                  const Icon = opt.icon;
                  const isActive = index === activeCreditSlide;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => router.push(opt.href)}
                      className={`absolute inset-0 flex flex-col items-start rounded-lg border bg-muted/40 hover:bg-muted/70 transition-all px-3 py-3 text-right ${
                        isActive
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-semibold">{opt.title}</span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {creditSliderItems.map((item, index) => {
                  const isActive = index === activeCreditSlide;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveCreditSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        isActive ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      }`}
                      aria-label={item.title}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>

        {tickerLogos.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 z-40">
            <div className="mx-auto w-full max-w-[480px] border-t bg-background/95">
              <LogoLoop
                logos={tickerLogos}
                speed={45}
                gap={40}
                ariaLabel="صندوق‌ها و قیمت‌ها"
                className="px-3 py-1"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col p-4 space-y-6">
        <div className="w-full max-w-md mx-auto space-y-6">
        {/* Main Wallet Card – بالای صفحه اصلی */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ارزش کل دارایی کیف پول
              </CardTitle>
              <button
                type="button"
                className="text-[11px] font-medium text-primary hover:underline"
                onClick={() => setIsWalletDetailsOpen((prev) => !prev)}
              >
                {isWalletDetailsOpen ? "بستن جزئیات" : "نمایش جزئیات"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {isWalletBalanceVisible ? (
                  <>
                    {formatNumber(mainWalletBalance)}{" "}
                    <span className="text-base font-normal">تومان</span>
                  </>
                ) : (
                  "•••••••"
                )}
              </p>
              <button
                type="button"
                onClick={() => setIsWalletBalanceVisible((v) => !v)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label={isWalletBalanceVisible ? "مخفی کردن موجودی" : "نمایش موجودی"}
              >
                {isWalletBalanceVisible ? (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isWalletDetailsOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">موجودی کیف پول</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(mainWalletBalance)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اعتبار وام</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(walletCredits.loan)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اعتبار اوراق صندوق</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(walletCredits.funds)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اعتبار کریپتو</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(walletCredits.crypto)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اعتبار TWIN</span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(walletCredits.twin)} تومان
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-stretch justify-between gap-2">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
                onClick={() => {
                  if (mainWalletCards.length === 0) {
                    setWalletInlineMessage("برای واریز ابتدا باید کارت بانکی اضافه کنید.");
                    return;
                  }
                  setWalletInlineMessage(null);
                  setSelectedCardForDeposit(null);
                  setDepositAmountInput("");
                  setDepositAmountRial(0);
                  setIsDepositModalOpen(true);
                }}
              >
                <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">واریز</span>
              </button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
                onClick={() => {
                  if (mainWalletCards.length === 0) {
                    setWalletInlineMessage("برای برداشت ابتدا باید کارت بانکی اضافه کنید.");
                    return;
                  }
                  setWalletInlineMessage(null);
                  setSelectedCardForWithdraw(null);
                  setWithdrawAmountInput("");
                  setWithdrawAmountToman(0);
                  setIsWithdrawModalOpen(true);
                }}
              >
                <ArrowUpFromLine className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">برداشت</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletInlineMessage(null);
                  setIsCardsModalOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-background hover:bg-muted/40 transition-colors py-2.5 text-xs"
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">کارت‌ها</span>
              </button>
            </div>

            {walletInlineMessage && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {walletInlineMessage}
              </div>
            )}

            {isWalletMoreInfoOpen && (
              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">موجودی قابل برداشت</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {isWalletBalanceVisible ? (
                      <>
                        {formatNumber(mainWalletBalance)}{" "}
                        <span className="text-xs font-normal">تومان</span>
                      </>
                    ) : (
                      "•••••••"
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Credit teaser widget */}
        <Card className="mt-2">
          <CardContent className="p-4 space-y-4">
            <div className="text-right space-y-1">
              <p className="text-xs font-medium text-primary">
                با هر روشی که دوست داری، می‌تونی اعتبار بگیری؛
              </p>
              <p className="text-xs text-muted-foreground">
                نقدی، صندوق، کریپتو یا تیوین؛ سرمایه‌گذاری رو ادامه بده، حتی وقتی حسابت لَیـن.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                روش‌های مختلف دریافت اعتبار
              </p>
              <button
                type="button"
                onClick={() => router.push("/app/credit")}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                مشاهده همه
              </button>
            </div>
            <div className="relative min-h-[92px]">
              {creditSliderItems.map((opt, index) => {
                const Icon = opt.icon;
                const isActive = index === activeCreditSlide;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => router.push(opt.href)}
                    className={`absolute inset-0 flex flex-col items-start rounded-lg border bg-muted/40 hover:bg-muted/70 transition-all px-3 py-3 text-right ${
                      isActive
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-xs font-semibold">{opt.title}</span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {creditSliderItems.map((item, index) => {
                const isActive = index === activeCreditSlide;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCreditSlide(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      isActive ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                    aria-label={item.title}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

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

        {/* Main Wallet Cards Modal (افزودن کارت بانکی) */}
        <Dialog open={isCardsModalOpen} onOpenChange={setIsCardsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن کارت بانکی</DialogTitle>
              <DialogDescription>لیست کارت‌های بانکی متصل به کیف پول اصلی شما.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="main-wallet-card-number">
                  شماره کارت
                </label>
                <input
                  id="main-wallet-card-number"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="0000 0000 0000 0000"
                  value={newCardNumber}
                  onChange={(e) => {
                    const { formatted } = normalizeCardInput(e.target.value);
                    setNewCardNumber(formatted);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  کارت بانکی باید به نام دارنده حساب اصلی باشد.
                </p>
                {(() => {
                  const digitsLen = newCardNumber.replace(/\D/g, "").length;
                  if (digitsLen < 6) return null;
                  const { bank } = getCardBankMeta(newCardNumber);
                  const isValidBin = !!bank.bankName && bank.id !== "pasinno";
                  if (!isValidBin) {
                    return (
                      <p className="text-xs text-destructive mt-1">
                        شماره کارت اشتباه است.
                      </p>
                    );
                  }
                  const logoSrc = `/images/bankLogos/${bank.logo}`;
                  return (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <div className="relative h-5 w-5 overflow-hidden rounded-full bg-muted">
                        <Image
                          src={logoSrc}
                          alt={bank.bankName || "لوگوی بانک"}
                          fill
                          sizes="20px"
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium">
                        {bank.bankName || "کارت بانکی"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleAddMainWalletCard}
                disabled={(() => {
                  const digitsLen = newCardNumber.replace(/\D/g, "").length;
                  if (digitsLen !== 16) return true;
                  const { bank } = getCardBankMeta(newCardNumber);
                  const isValidBin = !!bank.bankName && bank.id !== "pasinno";
                  return !isValidBin;
                })()}
              >
                ثبت شماره کارت
              </Button>

              {mainWalletCards.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium">لیست کارت‌های بانکی</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {mainWalletCards.map((card) => {
                      const { bank, masked } = getCardBankMeta(card);
                      const logoSrc = `/images/bankLogos/${bank.logo}`;
                      const isConfirming = deleteConfirmCard === card;
                      return (
                        <div
                          key={card}
                          className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
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
                              <span className="text-[11px] font-medium">
                                {bank.bankName || "کارت بانکی"}
                              </span>
                              <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                                {formatCardNumberForDisplay(masked)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isConfirming) {
                                removeMainWalletCard(card);
                              } else {
                                setDeleteConfirmCard(card);
                              }
                            }}
                            className="ml-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] leading-none"
                            >
                              ×
                            </span>
                            <span
                              className={`overflow-hidden text-[11px] transition-all duration-200 ${
                                isConfirming
                                  ? "max-w-[200px] opacity-100 ml-1"
                                  : "max-w-0 opacity-0"
                              }`}
                            >
                              برای حذف مجددا کلیک کنید
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposit Modal – برای حالت داشتن پورتفوی نیز در دسترس است */}
        <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
          <DialogContent onClose={() => setIsDepositModalOpen(false)}>
            <DialogHeader>
              <DialogTitle>واریز به کیف پول</DialogTitle>
              <DialogDescription>
                از بین کارت‌های بانکی خود یک کارت را انتخاب کنید و مبلغ را وارد کنید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Card selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium">انتخاب کارت بانکی</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mainWalletCards.map((card) => {
                    const selected = selectedCardForDeposit === card;
                    const { bank, masked } = getCardBankMeta(card);
                    const logoSrc = `/images/bankLogos/${bank.logo}`;
                    return (
                      <button
                        key={card}
                        type="button"
                        onClick={() => setSelectedCardForDeposit(card)}
                        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-muted/40 hover:bg-muted/70"
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
                            <span className="text-[11px] font-medium">
                              {bank.bankName || "کارت بانکی"}
                            </span>
                            <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                              {formatCardNumberForDisplay(masked)}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <span className="text-xs text-primary font-medium">انتخاب شده</span>
                        )}
                      </button>
                    );
                  })}
                  {mainWalletCards.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      هیچ کارتی ثبت نشده است. ابتدا کارت بانکی اضافه کنید.
                    </p>
                  )}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="deposit-amount">
                    مبلغ واریز (ریال)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    موجودی فعلی:{" "}
                    <span className="font-medium tabular-nums">
                      {formatNumber(mainWalletBalance)} تومان
                    </span>
                  </span>
                </div>
                <input
                  id="deposit-amount"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  value={depositAmountInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDepositAmountInput(raw);
                    const normalized = normalizeAmountInput(raw);
                    setDepositAmountRial(normalized);
                  }}
                />
                {Math.floor(depositAmountRial / 10) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    معادل:{" "}
                    <span className="font-medium">
                      {formatTomanInWords(Math.floor(depositAmountRial / 10))}
                    </span>
                  </p>
                )}
              </div>

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
                    setMainWalletBalance((prev) => {
                      const next = Math.max(0, prev + depositToman);
                      try {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("mainWalletBalanceToman", String(next));
                        }
                      } catch {
                        // ignore
                      }
                      return next;
                    });
                    setIsProcessingDeposit(false);
                    setIsDepositModalOpen(false);
                    setDepositAmountInput("");
                    setDepositAmountRial(0);
                    setSelectedCardForDeposit(null);
                  }, 2000);
                }}
              >
                {isProcessingDeposit ? "در حال پردازش..." : "پرداخت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal – برای حالت داشتن پورتفوی نیز در دسترس است */}
        <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
          <DialogContent onClose={() => setIsWithdrawModalOpen(false)}>
            <DialogHeader>
              <DialogTitle>برداشت به کارت بانکی</DialogTitle>
              <DialogDescription>
                کارت مقصد را انتخاب کرده و مبلغ برداشت را وارد کنید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                <span>فقط موجودی کیف پول اصلی قابل برداشت است.</span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(mainWalletBalance)} تومان
                </span>
              </div>

              {/* Card selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium">انتخاب کارت بانکی</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mainWalletCards.map((card) => {
                    const selected = selectedCardForWithdraw === card;
                    const { bank, masked } = getCardBankMeta(card);
                    const logoSrc = `/images/bankLogos/${bank.logo}`;
                    return (
                      <button
                        key={card}
                        type="button"
                        onClick={() => setSelectedCardForWithdraw(card)}
                        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-muted/40 hover:bg-muted/70"
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
                            <span className="text-[11px] font-medium">
                              {bank.bankName || "کارت بانکی"}
                            </span>
                            <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                              {formatCardNumberForDisplay(masked)}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <span className="text-xs text-primary font-medium">انتخاب شده</span>
                        )}
                      </button>
                    );
                  })}
                  {mainWalletCards.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      هیچ کارتی ثبت نشده است. ابتدا کارت بانکی اضافه کنید.
                    </p>
                  )}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="withdraw-amount">
                    مبلغ برداشت (تومان)
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-primary disabled:text-muted-foreground hover:underline"
                    disabled={mainWalletBalance <= 0}
                    onClick={() => {
                      if (mainWalletBalance <= 0) return;
                      const formatted = mainWalletBalance.toLocaleString("fa-IR");
                      setWithdrawAmountInput(formatted);
                      setWithdrawAmountToman(mainWalletBalance);
                    }}
                  >
                    حداکثر قابل برداشت
                  </button>
                </div>
                <input
                  id="withdraw-amount"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  value={withdrawAmountInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setWithdrawAmountInput(raw);
                    const normalized = normalizeAmountInput(raw);
                    setWithdrawAmountToman(Math.floor(normalized / 10));
                  }}
                />
                {withdrawAmountToman > 0 && (
                  <p className="text-xs text-muted-foreground">
                    معادل:{" "}
                    <span className="font-medium">
                      {formatTomanInWords(withdrawAmountToman)}
                    </span>
                  </p>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={
                  isProcessingWithdraw ||
                  !selectedCardForWithdraw ||
                  withdrawAmountToman <= 0 ||
                  withdrawAmountToman > mainWalletBalance
                }
                onClick={() => {
                  if (
                    !selectedCardForWithdraw ||
                    withdrawAmountToman <= 0 ||
                    withdrawAmountToman > mainWalletBalance
                  ) {
                    return;
                  }
                  setIsProcessingWithdraw(true);
                  setTimeout(() => {
                    setMainWalletBalance((prev) => {
                      const next = Math.max(0, prev - withdrawAmountToman);
                      try {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("mainWalletBalanceToman", String(next));
                        }
                      } catch {
                        // ignore
                      }
                      return next;
                    });
                    setIsProcessingWithdraw(false);
                    setIsWithdrawModalOpen(false);
                    setWithdrawAmountInput("");
                    setWithdrawAmountToman(0);
                    setSelectedCardForWithdraw(null);
                  }, 2000);
                }}
              >
                {isProcessingWithdraw ? "در حال پردازش..." : "برداشت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Wallet: ساخت ولت or ولت من - above banner */}
        {!walletRegistered ? (
          <Card
            className="cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98] border-2 border-dashed border-primary/30"
            onClick={() => router.push("/app/wallet/register")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{tWallet("createWallet")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {tWallet("createWalletDescription")}
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <Card
            className="cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98]"
            onClick={() => router.push("/app/wallet")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {tWallet("myWallet")}
                </CardTitle>
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium flex items-center gap-2">
                  <CoinIcon symbol="USDT" size={18} />
                  {tWallet("usdt")}
                </span>
                <span className="font-bold tabular-nums">
                  {walletBalances?.usdt != null ? formatNumber(Number(walletBalances.usdt)) : "۰"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium flex items-center gap-2">
                  <CoinIcon symbol="BTC" size={18} />
                  {tWallet("btc")}
                </span>
                <span className="font-bold tabular-nums">
                  {formatBtcDisplay(walletBalances?.btc)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">{tWallet("goToWallet")}</p>
            </CardContent>
          </Card>
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

      {tickerLogos.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <div className="mx-auto w-full max-w-[480px] border-t bg-background/95">
            <LogoLoop
              logos={tickerLogos}
              speed={45}
              gap={40}
              ariaLabel="صندوق‌ها و قیمت‌ها"
              className="px-3 py-1"
            />
          </div>
        </div>
      )}
    </>
  );
}


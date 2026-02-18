"use client";

import { useEffect, useState } from "react";
import { PortfolioPieChart, PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { normalizeNumericInput, convertToEnglishDigits } from "@/shared/lib/number-utils";
import { useUserStore } from "@/shared/store/user-store";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  TrendingDown,
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
import { appendMainWalletJournalEntry } from "./wallet/lib/main-wallet-storage";
import { useMainWalletStore } from "./wallet/store/main-wallet-store";
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
import { ResponsivePie } from "@nivo/pie";

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
  { id: 5, currentPrice: 12500, change24h: 1.8 }, // Silver token TWIN
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

/** Shamsi date format with slashes: digits only (Persian/English) → YYYY/MM/DD */
function formatShamsiDateInput(raw: string): string {
  const digits = convertToEnglishDigits(raw).replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`;
}

function validateShamsiDate(value: string): boolean {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("/").map(Number);
  if (y < 1300 || y > 1450) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}

/** Mock portfolio after verification: random fund counts and percentages that sum to 100 */
function generateRandomPortfolioItems(): PortfolioItem[] {
  const funds = getAllFunds();
  const count = Math.min(2 + Math.floor(Math.random() * 3), funds.length); // 2 to 4 funds
  const indices: number[] = [];
  while (indices.length < count) {
    const i = Math.floor(Math.random() * funds.length);
    if (!indices.includes(i)) indices.push(i);
  }
  const selected = indices.map((i) => funds[i]);
  const rawPercentages = selected.map(() => Math.random() * 60 + 15);
  const sum = rawPercentages.reduce((a, b) => a + b, 0);
  const percentages = rawPercentages.map((p) => Math.round((p / sum) * 100));
  const fix = 100 - percentages.reduce((a, b) => a + b, 0);
  if (fix !== 0) percentages[0] += fix;
  return selected.map((fund, i) => ({
    fundId: fund.id,
    fundName: fund.name,
    percentage: Math.max(0, percentages[i]),
    category: fund.category,
  }));
}

export default function AppPage() {
  const router = useRouter();
  const tWallet = useTranslations("app.wallet");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestInvestment, setLatestInvestment] = useState<InvestmentData | null>(null);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());
  const [includeInvestableInChart, setIncludeInvestableInChart] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPortfolioComparisonModalOpen, setIsPortfolioComparisonModalOpen] = useState(false);
  const [priceChartPeriod, setPriceChartPeriod] = useState<"1d" | "1w" | "1m">("1d");
  const [primaryColor, setPrimaryColor] = useState<string>("hsl(225, 68%, 22%)");
  const [walletRegistered, setWalletRegistered] = useState(false);
  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(null); // for crypto wallet only
  const [isWalletBalanceVisible, setIsWalletBalanceVisible] = useState(true);
  const [isWalletMoreInfoOpen, setIsWalletMoreInfoOpen] = useState(false);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [mainWalletCards, setMainWalletCards] = useState<string[]>([]);
  const [newCardNumber, setNewCardNumber] = useState("");
  const mainWalletBalance = useMainWalletStore((s) => s.mainWalletBalance);
  const setMainWalletBalance = useMainWalletStore((s) => s.setMainWalletBalance);
  const walletCredits = useMainWalletStore((s) => s.walletCredits);
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
  const [isMainWalletHelpOpen, setIsMainWalletHelpOpen] = useState(false);
  const [activeCreditSlide, setActiveCreditSlide] = useState(0);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [completeProfileNationalId, setCompleteProfileNationalId] = useState("");
  const [completeProfileBirthDate, setCompleteProfileBirthDate] = useState("");
  const [completeProfileSuccess, setCompleteProfileSuccess] = useState(false);
  const [completeProfileError, setCompleteProfileError] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

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
        // Load main wallet bank cards (non-crypto main wallet)
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

        // Hydrate main wallet store from localStorage
        useMainWalletStore.getState().hydrate();
        useUserStore.getState().hydrate();
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

  // If we have only one bank card and deposit modal is open, auto-select that card
  useEffect(() => {
    if (isDepositModalOpen && !selectedCardForDeposit && mainWalletCards.length === 1) {
      setSelectedCardForDeposit(mainWalletCards[0] || null);
    }
  }, [isDepositModalOpen, selectedCardForDeposit, mainWalletCards]);

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

  // Convert number to Persian words (Rial/Toman base)
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

  // Normalize amount input (strip separators, convert Persian/Arabic digits to English)
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
    // Convert Persian/Arabic digits to English and strip non-digit characters
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

    // Limit to 16 digits (mask 9999 9999 9999 9999)
    digits = digits.slice(0, 16);

    // Format for display as 4-4-4-4
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
    // Card format: 9999 9999 9999 9999 → 16 digits (4+4+4+4)
    if (digitsOnly.length !== 16) {
      return;
    }
    // Validate BIN against bank list
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
    // Display as 9999 9999 9999 9999 (4-4-4-4)
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
          label: (context: { parsed: { y: number } }) => {
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
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
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
          {/* Main Wallet Card – top of main page */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ارزش کل دارایی کیف پول
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[11px] font-medium text-muted-foreground hover:text-primary hover:underline"
                    onClick={() => router.push("/app/activities")}
                  >
                    تراکنش‌ها
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-primary hover:underline"
                    onClick={() => setIsWalletDetailsOpen((prev) => !prev)}
                  >
                    {isWalletDetailsOpen ? "بستن جزئیات" : "نمایش جزئیات"}
                  </button>
                </div>
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

          {/* Main wallet guide */}
          <Dialog open={isMainWalletHelpOpen} onOpenChange={setIsMainWalletHelpOpen}>
            <DialogContent onClose={() => setIsMainWalletHelpOpen(false)}>
              <DialogHeader>
                <DialogTitle>راهنمای کیف پول کلی</DialogTitle>
                <DialogDescription>
                  ارزش کل کیف پول از موجودی نقدی و مجموع اعتبارها تشکیل می‌شود و همهٔ این منابع برای سرمایه‌گذاری (صدور واحد صندوق) قابل استفاده هستند.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">منابع</h4>
                  <p>موجودی کیف پول، اعتبار وام، اعتبار اوراق صندوق، اعتبار کریپتو و اعتبار TWIN. هر تغییری (واریز، برداشت، اعتبار، استفاده برای صدور) در جرنیش کیف پول ثبت می‌شود.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Main Wallet Cards Modal – also render when portfolio is empty */}
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
                      const next = Math.max(0, useMainWalletStore.getState().mainWalletBalance - withdrawAmountToman);
                      setMainWalletBalance(next);
                      appendMainWalletJournalEntry({
                        type: "withdraw",
                        amount: withdrawAmountToman,
                        source: "main",
                        description: "برداشت از کیف پول",
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

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Section 1: Empty portfolio */}
              <div className="flex flex-col items-center text-center p-6 pb-5 bg-muted/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/80 text-muted-foreground mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">پورتفوی شما خالی است</h2>
                <p className="text-sm text-muted-foreground max-w-[85%] leading-relaxed mb-4">
                  برای شروع سرمایه‌گذاری، ابتدا ارزیابی ریسک را انجام دهید
                </p>
                <Button
                  onClick={() => router.push("/risk-assessment")}
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5"
                >
                  شروع ارزیابی ریسک
                </Button>
              </div>

              <div className="h-px bg-border shrink-0" aria-hidden />

              {/* Section 2: Connect account */}
              <div className="flex flex-col items-center text-center p-6 pt-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">اتصال حساب</h3>
                <p className="text-sm text-muted-foreground text-right leading-relaxed max-w-[90%] mb-4">
                  اگر داخل nibmarket.com حساب دارید پروفایل خودتون رو کامل کنید تا دارایی‌های شما نمایش داده بشه.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5 w-full sm:w-auto min-w-[140px]"
                  onClick={() => {
                  setCompleteProfileSuccess(false);
                  setCompleteProfileError(null);
                  setIsCompleteProfileModalOpen(true);
                }}
                >
                  تکمیل پروفایل
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Complete profile modal (national ID + birth date) */}
          <Dialog
            open={isCompleteProfileModalOpen}
            onOpenChange={(open) => {
              setIsCompleteProfileModalOpen(open);
              if (!open) {
                setCompleteProfileNationalId("");
                setCompleteProfileBirthDate("");
                setCompleteProfileSuccess(false);
                setCompleteProfileError(null);
              }
            }}
          >
            <DialogContent onClose={() => setIsCompleteProfileModalOpen(false)} className="max-w-md space-y-6 p-6">
              <DialogHeader className="space-y-2">
                <DialogTitle>تکمیل پروفایل</DialogTitle>
                <DialogDescription className="leading-relaxed">
                  کد ملی و تاریخ تولد خود را وارد کنید تا استعلام انجام شود.
                </DialogDescription>
              </DialogHeader>

              {completeProfileSuccess ? (
                <p className="py-8 text-center text-lg font-medium text-primary">تایید شد</p>
              ) : (
                <>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="complete-profile-national-id">کد ملی</Label>
                      <Input
                        id="complete-profile-national-id"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="۱۲۳۴۵۶۷۸۹۰"
                        value={completeProfileNationalId}
                        onChange={(e) =>
                          setCompleteProfileNationalId(normalizeNumericInput(e.target.value).slice(0, 10))
                        }
                        dir="ltr"
                        className="font-medium tabular-nums"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete-profile-birth-date">تاریخ تولد (شمسی)</Label>
                      <Input
                        id="complete-profile-birth-date"
                        type="text"
                        inputMode="numeric"
                        placeholder="۱۳۷۰/۰۵/۱۵"
                        value={completeProfileBirthDate}
                        onChange={(e) =>
                          setCompleteProfileBirthDate(formatShamsiDateInput(e.target.value))
                        }
                        dir="ltr"
                        className="font-medium tabular-nums"
                      />
                    </div>
                    {completeProfileError && (
                      <p className="text-sm text-destructive">{completeProfileError}</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-start pt-2" dir="rtl">
                    <Button
                      type="button"
                      onClick={() => {
                        const nationalId = completeProfileNationalId.trim();
                        const birthDate = completeProfileBirthDate.trim();
                        if (nationalId.length !== 10) {
                          setCompleteProfileError("کد ملی باید ۱۰ رقم باشد.");
                          return;
                        }
                        if (!validateShamsiDate(birthDate)) {
                          setCompleteProfileError("تاریخ تولد معتبر نیست (مثال: ۱۳۷۰/۰۵/۱۵).");
                          return;
                        }
                        setCompleteProfileError(null);
                        setUser({
                          mobile: user?.mobile ?? "",
                          nationalId,
                          firstName: user?.firstName ?? "",
                          lastName: user?.lastName ?? "",
                          birthDate,
                        });
                        const fakePortfolio = generateRandomPortfolioItems();
                        const fakeInvestmentAmount = Math.floor(5_000_000 + Math.random() * 45_000_000);
                        const fakeLatestInvestment: InvestmentData = {
                          amount: fakeInvestmentAmount,
                          portfolio: fakePortfolio,
                          useLoan: false,
                          loanAmount: null,
                          loanPeriod: null,
                          loanInterest: null,
                          loanDetails: null,
                          investmentAmount: fakeInvestmentAmount,
                          createdAt: new Date().toISOString(),
                          status: "active",
                        };
                        setPortfolio(fakePortfolio);
                        setLatestInvestment(fakeLatestInvestment);
                        if (typeof window !== "undefined") {
                          try {
                            localStorage.setItem("portfolio", JSON.stringify(fakePortfolio));
                            localStorage.setItem("latestInvestment", JSON.stringify(fakeLatestInvestment));
                          } catch {
                            // ignore
                          }
                        }
                        setCompleteProfileSuccess(true);
                        setTimeout(() => {
                          setIsCompleteProfileModalOpen(false);
                          setCompleteProfileNationalId("");
                          setCompleteProfileBirthDate("");
                          setCompleteProfileSuccess(false);
                        }, 1500);
                      }}
                    >
                      استعلام
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCompleteProfileModalOpen(false);
                        setCompleteProfileNationalId("");
                        setCompleteProfileBirthDate("");
                        setCompleteProfileError(null);
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Credit teaser widget */}
          <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-primary">
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
        {/* Main Wallet Card – top of main page */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ارزش کل دارایی کیف پول
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary hover:underline"
                  onClick={() => router.push("/app/activities")}
                >
                  تراکنش‌ها
                </button>
                <button
                  type="button"
                  className="text-[11px] font-medium text-primary hover:underline"
                  onClick={() => setIsWalletDetailsOpen((prev) => !prev)}
                >
                  {isWalletDetailsOpen ? "بستن جزئیات" : "نمایش جزئیات"}
                </button>
              </div>
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

        {/* My assets — with portfolio (with or without investment) */}
        {portfolio.length > 0 && (() => {
          const hasInvestment = latestInvestment && latestInvestment.portfolio.length > 0;
          if (hasInvestment) {
            const totalNominalValue = latestInvestment!.portfolio.reduce((sum, item) => {
              return sum + calculateFundValue(
                item.fundId,
                latestInvestment!.investmentAmount,
                item.percentage
              );
            }, 0);
            const totalProfit24h = latestInvestment!.portfolio.reduce((sum, item) => {
              const currentValue = calculateFundValue(
                item.fundId,
                latestInvestment!.investmentAmount,
                item.percentage
              );
              const price = getFundPrice(item.fundId);
              if (!price) return sum;
              const valueYesterday = currentValue / (1 + price.change24h / 100);
              return sum + (currentValue - valueYesterday);
            }, 0);
            return (
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
              <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">ارزش اسمی دارایی</p>
                  <p className="text-base font-bold tabular-nums">{formatNumber(Math.round(totalNominalValue))} تومان</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">آخرین سود دریافتی</p>
                  <p className={`text-base font-bold tabular-nums ${totalProfit24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {totalProfit24h >= 0 ? "+" : ""}{formatNumber(Math.round(totalProfit24h))} تومان
                  </p>
                </div>
              </div>
              {/* Asset percentage chart — each asset share by estimated value vs total estimated value */}
              <div className="rounded-lg border bg-muted/30 overflow-hidden" dir="ltr">
                <div className="h-[280px] w-full min-h-[280px]">
                  {(() => {
                    const fundValues = latestInvestment.portfolio.map((item) =>
                      calculateFundValue(item.fundId, latestInvestment.investmentAmount, item.percentage)
                    );
                    const pieData = [
                      ...latestInvestment.portfolio.map((item, i) => ({
                        id: item.fundName,
                        label: item.fundName,
                        value: fundValues[i],
                        color: fundColors[i % fundColors.length],
                      })),
                      ...(includeInvestableInChart && mainWalletBalance > 0
                        ? [{ id: "قابل سرمایه‌گذاری", label: "قابل سرمایه‌گذاری", value: mainWalletBalance, color: "#64748b" }]
                        : []),
                    ];
                    const totalValue = pieData.reduce((s, d) => s + Number(d.value), 0);
                    const getPct = (v: number) => (totalValue > 0 ? Math.round((v / totalValue) * 100) : 0);
                    return (
                      <ResponsivePie
                        data={pieData}
                        margin={{ top: 24, right: 56, bottom: 24, left: 56 }}
                        colors={pieData.map((d) => d.color)}
                        theme={{ text: { fill: "hsl(var(--foreground))" }, tooltip: { container: { background: "hsl(var(--background))" } } }}
                        innerRadius={0.45}
                        padAngle={1}
                        cornerRadius={2}
                        activeOuterRadiusOffset={4}
                        enableArcLabels
                        arcLabelsSkipAngle={12}
                        arcLabelsRadiusOffset={0.65}
                        arcLabel={(d) => `${getPct(Number(d.value))}%`}
                        arcLabelsTextColor={{ from: "color" }}
                        arcLinkLabelsSkipAngle={12}
                        arcLinkLabelsOffset={2}
                        arcLinkLabelsDiagonalLength={12}
                        arcLinkLabelsStraightLength={10}
                        arcLinkLabelsTextColor={{ from: "color" }}
                        arcLinkLabelsThickness={1}
                        arcLinkLabelsColor={{ from: "color" }}
                        valueFormat={(v) => `${formatNumber(Math.round(Number(v)))} تومان`}
                        tooltip={({ datum }) => (
                          <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-right">
                            <span className="font-medium">{datum.label}</span>
                            <span className="text-muted-foreground mr-1"> — </span>
                            <span className="tabular-nums font-semibold">
                              {getPct(Number(datum.value))}% · {formatNumber(Math.round(Number(datum.value)))} تومان
                            </span>
                          </div>
                        )}
                      />
                    );
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center px-3 py-3 border-t bg-muted/20 text-center" dir="rtl">
                  {(() => {
                    const fundValues = latestInvestment.portfolio.map((item) =>
                      calculateFundValue(item.fundId, latestInvestment.investmentAmount, item.percentage)
                    );
                    const totalValue =
                      fundValues.reduce((s, v) => s + v, 0) +
                      (includeInvestableInChart && mainWalletBalance > 0 ? mainWalletBalance : 0);
                    const getPct = (v: number) => (totalValue > 0 ? Math.round((v / totalValue) * 100) : 0);
                    return (
                      <>
                        {latestInvestment.portfolio.map((item, i) => (
                          <div key={item.fundId} className="flex items-center gap-1.5">
                            <span
                              className="shrink-0 w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: fundColors[i % fundColors.length] }}
                            />
                            <span className="text-xs text-foreground truncate max-w-[120px]" title={item.fundName}>
                              {item.fundName}
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{getPct(fundValues[i])}%</span>
                          </div>
                        ))}
                        {includeInvestableInChart && mainWalletBalance > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                            <span className="text-xs text-foreground">قابل سرمایه‌گذاری</span>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                              {getPct(mainWalletBalance)}%
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground w-full justify-center mt-2">
                    <input
                      type="checkbox"
                      checked={includeInvestableInChart}
                      onChange={(e) => setIncludeInvestableInChart(e.target.checked)}
                      className="rounded border-input"
                    />
                    <span>محاسبه دارایی قابل معامله</span>
                  </label>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[400px] border-collapse text-right" dir="rtl">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40">
                      <th className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground w-[1%] whitespace-nowrap">نام دارایی</th>
                      <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">موجودی کل</th>
                      <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">قیمت واحد</th>
                      <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">ارزش تخمینی</th>
                      <th className="py-2.5 pl-2 pr-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                {latestInvestment.portfolio.map((item, i) => {
                  const price = getFundPrice(item.fundId);
                  const pricePerUnit = price?.currentPrice ?? 0;
                  const fundInvestmentAmount = (latestInvestment.investmentAmount * item.percentage) / 100;
                  const units = pricePerUnit > 0 ? fundInvestmentAmount / pricePerUnit : 0;
                  const estimatedValue = units * pricePerUnit;
                  const rowColor = fundColors[i % fundColors.length];

                  return (
                    <tr
                      key={item.fundId}
                      className="border-b border-border/40 last:border-b-0 bg-card hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5 min-w-0" dir="rtl">
                          <span
                            className="shrink-0 w-2.5 h-2.5 rounded-full order-2"
                            style={{ backgroundColor: rowColor }}
                          />
                          <span className="text-sm font-medium text-foreground order-1 shrink-0" title={item.fundName}>
                            {item.fundName.length > 12 ? `${item.fundName.slice(0, 12)}…` : item.fundName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap text-center">{units.toFixed(1)}</td>
                      <td className="py-3 px-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap text-center">
                        {price ? formatNumber(price.currentPrice) : "—"}
                      </td>
                      <td className="py-3 px-2 text-sm tabular-nums font-semibold text-foreground whitespace-nowrap text-center">
                        {formatNumber(Math.round(estimatedValue))}
                      </td>
                      <td className="py-3 pl-2 pr-3 align-middle">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-medium border-primary/50 text-primary hover:bg-primary/10 h-8 px-2.5"
                          onClick={() => router.push(`/app/assets/trade?fundId=${item.fundId}`)}
                        >
                          معامله
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          );
          }
          // Portfolio built but not yet invested
          const displayItems = portfolio;
          const pieData = displayItems.map((item, i) => ({
            id: item.fundName,
            label: item.fundName,
            value: item.percentage,
            color: fundColors[i % fundColors.length],
          }));
          return (
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
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/30 overflow-hidden" dir="ltr">
                  <div className="h-[200px] w-full min-h-[200px]">
                    <ResponsivePie
                      data={pieData}
                      margin={{ top: 16, right: 48, bottom: 16, left: 48 }}
                      colors={pieData.map((d) => d.color)}
                      theme={{ text: { fill: "hsl(var(--foreground))" }, tooltip: { container: { background: "hsl(var(--background))" } } }}
                      innerRadius={0.45}
                      padAngle={1}
                      cornerRadius={2}
                      activeOuterRadiusOffset={4}
                      enableArcLabels
                      arcLabelsSkipAngle={12}
                      arcLabelsRadiusOffset={0.65}
                      arcLabel={(d) => `${d.value}%`}
                      arcLabelsTextColor={{ from: "color" }}
                      valueFormat={(v) => `${v}%`}
                      tooltip={({ datum }) => (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-right">
                          <span className="font-medium">{datum.label}</span>
                          <span className="text-muted-foreground mr-1"> — </span>
                          <span className="tabular-nums font-semibold">{Number(datum.value)}%</span>
                        </div>
                      )}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center px-3 py-3 border-t bg-muted/20 text-center" dir="rtl">
                    {displayItems.map((item, i) => (
                      <div key={item.fundId} className="flex items-center gap-1.5">
                        <span
                          className="shrink-0 w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: fundColors[i % fundColors.length] }}
                        />
                        <span className="text-xs text-foreground truncate max-w-[120px]" title={item.fundName}>
                          {item.fundName}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-sm text-muted-foreground text-center">
                    با توجه به پورتفوی انتخابی، سرمایه‌گذاری خود را شروع کنید.
                  </p>
                  <Button
                    onClick={() => router.push("/app/investment")}
                    className="w-full"
                    size="lg"
                  >
                    شروع سرمایه‌گذاری
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Credit teaser widget */}
        <Card className="mt-2">
          <CardContent className="p-4 space-y-4">
            <div className="text-right space-y-1">
              <p className="text-sm font-medium text-primary">
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

        {/* Info Modal */}
        <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
          <DialogContent onClose={() => setIsInfoModalOpen(false)}>
            <DialogHeader>
              <DialogTitle>My assets guide</DialogTitle>
              <DialogDescription>
                Description of how assets are displayed
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

        {/* Separate investment portfolio removed — content shown inside My assets card */}

        {/* Main Wallet Cards Modal (add bank card) */}
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

        {/* Deposit Modal – also available when user has portfolio */}
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
                  }, 2000);
                }}
              >
                {isProcessingDeposit ? "در حال پردازش..." : "پرداخت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal – also available when user has portfolio */}
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
                    const next = Math.max(0, useMainWalletStore.getState().mainWalletBalance - withdrawAmountToman);
                    setMainWalletBalance(next);
                    appendMainWalletJournalEntry({
                      type: "withdraw",
                      amount: withdrawAmountToman,
                      source: "main",
                      description: "برداشت از کیف پول",
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

        {/* Wallet: My wallet - above banner (only when registered) */}
        {walletRegistered && (
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


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { ArrowLeft, Copy, QrCode, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CoinIcon } from "@/shared/components/coin-icon";
import { getWalletState, setWalletBalances } from "../lib/wallet-storage";
import { cn } from "@/shared/lib/utils";

type Coin = "usdt" | "btc";
type NetworkUsdt = "erc20" | "trc20";
type NetworkBtc = "bitcoin";

const COIN_OPTIONS: { value: Coin; label: string; symbol: "USDT" | "BTC" }[] = [
  { value: "usdt", label: "تتر (USDT)", symbol: "USDT" },
  { value: "btc", label: "بیت‌کوین (BTC)", symbol: "BTC" },
];

const NETWORKS_USDT: { value: NetworkUsdt; label: string }[] = [
  { value: "erc20", label: "ERC-20 (اتریوم)" },
  { value: "trc20", label: "TRC-20 (ترون)" },
];

const NETWORKS_BTC: { value: NetworkBtc; label: string }[] = [
  { value: "bitcoin", label: "بیت‌کوین" },
];

export default function WalletDepositPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [addresses, setAddresses] = useState<{ usdt: string; btc: string } | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin>("usdt");
  const [selectedNetworkUsdt, setSelectedNetworkUsdt] = useState<NetworkUsdt>("erc20");
  const [selectedNetworkBtc, setSelectedNetworkBtc] = useState<NetworkBtc>("bitcoin");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = getWalletState();
    if (!state.walletRegistered || !state.walletAddresses) {
      setAddresses(null);
      return;
    }
    setAddresses(state.walletAddresses);
  }, []);

  const currentAddress = selectedCoin === "usdt" ? addresses?.usdt : addresses?.btc;
  const networks = selectedCoin === "usdt" ? NETWORKS_USDT : NETWORKS_BTC;
  const activeNetwork = selectedCoin === "usdt" ? selectedNetworkUsdt : selectedNetworkBtc;
  const setActiveNetwork = selectedCoin === "usdt"
    ? (v: NetworkUsdt | NetworkBtc) => setSelectedNetworkUsdt(v as NetworkUsdt)
    : (v: NetworkUsdt | NetworkBtc) => setSelectedNetworkBtc(v as NetworkBtc);

  const handleCopy = async () => {
    if (!currentAddress) return;
    try {
      await navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleBackToWallet = () => {
    const state = getWalletState();
    const current = state.walletBalances ?? { usdt: "0", btc: "0" };
    const usdtNum = Number(current.usdt) || 0;
    const btcNum = Number(current.btc) || 0;
    setWalletBalances({
      usdt: String(usdtNum + 100),
      btc: String((btcNum + 0.001).toFixed(8)),
    });
    router.push("/app/wallet");
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[40vh]">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!addresses) {
    return (
      <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto">
        <div className="flex justify-end">
          <Button variant="ghost" asChild>
            <Link href="/app/wallet" className="gap-2">
              <ArrowLeft className="w-5 h-5" />
              بازگشت
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-center">ولت یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <QrCode className="w-6 h-6" />
          واریز
        </h1>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/wallet" className="shrink-0" aria-label="بازگشت">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      {/* انتخاب کوین */}
      <div className="space-y-2">
        <Label>کوین</Label>
        <div className="relative">
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value as Coin)}
            className={cn(
              "flex h-11 w-full appearance-none rounded-md border border-input bg-background ps-10 pe-10 py-2 text-sm ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {COIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <CoinIcon symbol={COIN_OPTIONS.find((o) => o.value === selectedCoin)?.symbol ?? "USDT"} size={20} />
          </div>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* انتخاب شبکه واریز */}
      <div className="space-y-2">
        <Label>شبکه واریز</Label>
        <div className="flex rounded-lg border bg-muted/30 p-1">
          {networks.map((net) => (
            <button
              key={net.value}
              type="button"
              onClick={() => setActiveNetwork(net.value)}
              className={cn(
                "flex-1 rounded-md py-2.5 text-sm font-medium transition-colors",
                activeNetwork === net.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {net.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinIcon symbol={selectedCoin === "usdt" ? "USDT" : "BTC"} size={20} />
            آدرس ولت برای واریز {selectedCoin === "usdt" ? "تتر" : "بیت‌کوین"}
            {selectedCoin === "usdt" && (
              <span className="text-sm font-normal text-muted-foreground">
                ({activeNetwork === "erc20" ? "ERC-20" : "TRC-20"})
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            {selectedCoin === "usdt"
              ? activeNetwork === "erc20"
                ? "فقط روی شبکه ERC-20 (اتریوم) واریز کنید؛ واریز روی شبکه دیگر باعث از دست رفتن دارایی می‌شود."
                : "فقط روی شبکه TRC-20 (ترون) واریز کنید؛ واریز روی شبکه دیگر باعث از دست رفتن دارایی می‌شود."
              : "فقط بیت‌کوین واریز کنید؛ واریز هر شبکه یا دارایی دیگر باعث از دست رفتن دارایی می‌شود."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
            {currentAddress && (
              <QRCodeSVG value={currentAddress} size={200} level="M" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all p-3 rounded-lg bg-muted/50 dir-ltr text-left">
              {currentAddress}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="کپی آدرس"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 dark:text-green-500">آدرس کپی شد.</p>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full" onClick={handleBackToWallet}>
        بازگشت به ولت
      </Button>
    </div>
  );
}

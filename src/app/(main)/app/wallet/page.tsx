"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Wallet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { CoinIcon } from "@/shared/components/coin-icon";
import { getWalletState, formatBtcDisplay } from "./lib/wallet-storage";

const BTC_PRICE_USD = 100_000; // قیمت تخمینی بیت‌کوین (دلار) برای نمایش

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function WalletPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [walletRegistered, setWalletRegistered] = useState(false);
  const [balances, setBalances] = useState<{ usdt: string; btc: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const state = getWalletState();
    setWalletRegistered(state.walletRegistered);
    setBalances(state.walletBalances);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!walletRegistered) {
      router.replace("/app/wallet/register");
    }
  }, [mounted, walletRegistered, router]);

  if (!mounted || !walletRegistered) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[40vh]">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          ولت من
        </h1>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app" className="shrink-0" aria-label="بازگشت">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>دارایی‌های شما</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-muted/50 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center p-3 text-sm">
              <span className="text-muted-foreground font-medium">نام کوین</span>
              <span className="text-muted-foreground font-medium text-left">موجودی کل</span>
              <span className="text-muted-foreground font-medium text-left">ارزش تخمینی</span>
            </div>
            <div className="border-t p-4 flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <span className="font-medium flex items-center gap-2">
                  <CoinIcon symbol="USDT" size={20} />
                  تتر (USDT)
                </span>
                <span className="font-bold tabular-nums dir-ltr text-left">
                  {balances?.usdt != null ? formatNumber(Number(balances.usdt)) : "۰"}
                </span>
                <span className="text-muted-foreground tabular-nums dir-ltr text-left">
                  ≈ {balances?.usdt != null ? formatNumber(Number(balances.usdt)) : "۰"} $
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <span className="font-medium flex items-center gap-2">
                  <CoinIcon symbol="BTC" size={20} />
                  بیت‌کوین (BTC)
                </span>
                <span className="font-bold tabular-nums dir-ltr text-left">
                  {formatBtcDisplay(balances?.btc)}
                </span>
                <span className="text-muted-foreground tabular-nums dir-ltr text-left">
                  ≈ {balances?.btc != null ? formatNumber(Math.round(Number(balances.btc) * BTC_PRICE_USD)) : "۰"} $
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/app/wallet/deposit">
            <ArrowDownToLine className="w-6 h-6" />
            واریز
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/app/wallet/withdraw">
            <ArrowUpFromLine className="w-6 h-6" />
            برداشت
          </Link>
        </Button>
      </div>
    </div>
  );
}

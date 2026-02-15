"use client";

import { TokenIcon } from "@web3icons/react/dynamic";

export type CoinSymbol = "USDT" | "BTC" | string;

interface CoinIconProps {
  symbol: CoinSymbol;
  size?: number | string;
  className?: string;
  variant?: "mono" | "branded" | "background";
}

/**
 * Renders the icon for a cryptocurrency (e.g. USDT, BTC).
 * Use wherever a coin is displayed in the app.
 */
export function CoinIcon({ symbol, size = 24, className, variant = "branded" }: CoinIconProps) {
  return (
    <TokenIcon
      symbol={symbol}
      size={size}
      variant={variant}
      className={className}
    />
  );
}

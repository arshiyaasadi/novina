"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Fund } from "@/app/risk-assessment/data/funds";
import { getFundPrice } from "../lib/fund-prices";
import { Search } from "lucide-react";

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface FundSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funds: Fund[];
  selectedFundId: string | null;
  onSelect: (fundId: string) => void;
}

export function FundSelectModal({
  open,
  onOpenChange,
  funds,
  selectedFundId,
  onSelect,
}: FundSelectModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return funds;
    const q = search.trim().toLowerCase();
    return funds.filter((f) => f.name.toLowerCase().includes(q));
  }, [funds, search]);

  const handleSelect = (fundId: string) => {
    onSelect(fundId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[85vh] flex flex-col p-6 sm:p-7 gap-6"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-lg">انتخاب صندوق</DialogTitle>
        </DialogHeader>
        <div className="relative mt-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 text-right h-11"
          />
        </div>
        <ul className="overflow-y-auto flex-1 border rounded-xl divide-y min-h-[200px] -mx-1 px-1">
          {filtered.map((fund) => {
            const price = getFundPrice(fund.id);
            const isSelected = selectedFundId === String(fund.id);
            return (
              <li key={fund.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(String(fund.id))}
                  className={`w-full flex items-center justify-between gap-4 p-4 text-right transition-colors rounded-lg hover:bg-muted/60 ${isSelected ? "bg-primary/10" : ""}`}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium text-sm truncate">{fund.name}</p>
                    {price && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatNumber(price.currentPrice)} تومان
                        </span>
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            price.change24h >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {price.change24h >= 0 ? "+" : ""}
                          {price.change24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

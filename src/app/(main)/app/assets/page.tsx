"use client";

import { useState, useEffect } from "react";
import { Info, X, Plus, Minus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { getAllFunds, Fund } from "@/app/risk-assessment/data/funds";
import { cn } from "@/shared/lib/utils";

interface FundPrice {
  id: number;
  currentPrice: number;
  change24h: number; // percentage change
}

// Mock prices - in real app, this would come from an API
const mockPrices: FundPrice[] = [
  { id: 1, currentPrice: 125000, change24h: 0.5 },
  { id: 2, currentPrice: 118000, change24h: 0.3 },
  { id: 3, currentPrice: 2850000, change24h: -1.2 },
  { id: 4, currentPrice: 95000, change24h: 2.1 },
];

export default function AssetsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const allFunds = getAllFunds();
    setFunds(allFunds);
  }, []);

  const getFundPrice = (fundId: number): FundPrice | undefined => {
    return mockPrices.find((p) => p.id === fundId);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatPrice = (price: number): string => {
    return formatNumber(price);
  };

  const handleInfoClick = (fund: Fund) => {
    setSelectedFund(fund);
    setIsModalOpen(true);
  };

  const handleIssueClick = () => {
    setShowToast(true);
  };

  const handleCancelClick = () => {
    setShowToast(true);
  };

  const handleCloseToast = () => {
    setShowToast(false);
  };

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">صندوق‌ها</h2>
        <div className="space-y-3">
          {funds.map((fund) => {
            const price = getFundPrice(fund.id);
            if (!price) return null;

            const isPositive = price.change24h >= 0;

            return (
              <div
                key={fund.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{fund.name}</h3>
                      <button
                        onClick={() => handleInfoClick(fund)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums">
                          {formatPrice(price.currentPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">تومان</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {price.change24h.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">۲۴ ساعت گذشته</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleIssueClick}
                    className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    صدور
                  </Button>
                  <Button
                    onClick={handleCancelClick}
                    className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    size="sm"
                    variant="outline"
                  >
                    <Minus className="w-4 h-4 ml-2" />
                    ابطال
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fund Info Modal */}
      {selectedFund && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-md max-h-[90vh] overflow-y-auto"
            onClose={() => setIsModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>{selectedFund.name}</DialogTitle>
              <DialogDescription>{selectedFund.shortDescription}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">توضیحات کامل:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedFund.fullDescription}
                </p>
              </div>

              {(() => {
                const price = getFundPrice(selectedFund.id);
                if (!price) return null;

                return (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">قیمت فعلی:</span>
                      <span className="text-lg font-bold tabular-nums">
                        {formatPrice(price.currentPrice)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تغییر ۲۴ ساعت گذشته:</span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          price.change24h >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {price.change24h >= 0 ? "+" : ""}
                        {price.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-top-5">
          <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center justify-between gap-3 min-w-[200px]">
            <span className="text-sm font-medium">در حال توسعه</span>
            <button
              onClick={handleCloseToast}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          </div>
        )}
    </div>
  );
}


"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllFunds } from "../data/funds";
import { FundAllocationItem } from "./fund-allocation-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Save } from "lucide-react";

interface AllocationPageProps {
  selectedFundIds: number[];
  onBack?: () => void;
  onContinue?: (allocations: Map<number, number>) => void;
  className?: string;
}

/**
 * Distribute percentage changes - when one fund changes, adjust others proportionally
 * Each fund must be between 5% and 95%
 * Algorithm ensures total is always exactly 100%
 */
function distributePercentage(
  changedFundId: number,
  newPercentage: number,
  currentAllocations: Map<number, number>,
  allFundIds: number[]
): Map<number, number> {
  const newAllocations = new Map(currentAllocations);
  const otherFundIds = allFundIds.filter(id => id !== changedFundId);
  
  if (otherFundIds.length === 0) {
    // Only one fund, set to 100%
    newAllocations.set(changedFundId, 100);
    return newAllocations;
  }
  
  const MIN_PERCENTAGE = 5;
  const MAX_PERCENTAGE = 95;
  
  // Clamp the new percentage between 5% and 95% (integer only)
  const clampedNewPercentage = Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, newPercentage));
  
  // Get current percentages of other funds
  const otherFundsData = otherFundIds.map(id => ({
    id,
    current: currentAllocations.get(id) || 0
  }));
  
  const otherFundsTotal = otherFundsData.reduce((sum, f) => sum + f.current, 0);
  
  // Integer-only: clamp changed value to integer
  const clampedNewInt = Math.round(clampedNewPercentage);
  newAllocations.set(changedFundId, Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, clampedNewInt)));
  const remainingInt = 100 - (newAllocations.get(changedFundId) ?? 0);

  if (otherFundsTotal === 0 || Math.abs(otherFundsTotal) < 0.01) {
    const equalShare = remainingInt / otherFundIds.length;
    otherFundIds.forEach(id => {
      const clamped = Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, Math.round(equalShare)));
      newAllocations.set(id, clamped);
    });
  } else {
    otherFundsData.forEach(({ id, current }) => {
      const proportion = current / otherFundsTotal;
      const targetPercent = remainingInt * proportion;
      const clamped = Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, Math.round(targetPercent)));
      newAllocations.set(id, clamped);
    });
  }

  // Final pass: integers only, total exactly 100
  const roundedAllocations = new Map<number, number>();
  let roundedTotal = 0;

  newAllocations.forEach((value, id) => {
    const rounded = Math.round(value);
    roundedAllocations.set(id, rounded);
    roundedTotal += rounded;
  });

  const roundingDiff = 100 - roundedTotal;
  if (roundingDiff !== 0) {
    const firstEntry = Array.from(roundedAllocations.entries())[0];
    if (firstEntry) {
      const [firstId, firstValue] = firstEntry;
      roundedAllocations.set(firstId, Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, firstValue + roundingDiff)));
    }
  }

  return roundedAllocations;
}

/** Slider step: integer percentages only */
function calculateStep(_fundCount: number): number {
  return 1;
}

export function AllocationPage({
  selectedFundIds,
  onBack,
  onContinue,
  className,
}: AllocationPageProps) {
  const router = useRouter();
  const allFunds = getAllFunds();
  
  // Memoize selectedFunds to prevent unnecessary re-renders
  const selectedFunds = useMemo(() => {
    return allFunds.filter(fund => selectedFundIds.includes(fund.id));
  }, [selectedFundIds, allFunds]);
  
  // Initialize with equal distribution (clamped between 5 and 95)
  const initialPercentage = useMemo(() => {
    return selectedFunds.length > 0 ? Math.floor(100 / selectedFunds.length) : 0;
  }, [selectedFunds.length]);
  
  const initialAllocations = useMemo(() => {
    const map = new Map<number, number>();
    if (selectedFunds.length === 1) {
      map.set(selectedFunds[0].id, 100);
      return map;
    }
    const clampedInitial = Math.max(5, Math.min(95, Math.round(initialPercentage)));
    selectedFunds.forEach((fund, index) => {
      if (index === selectedFunds.length - 1) {
        const sum = Array.from(map.values()).reduce((s, v) => s + v, 0);
        const remainder = 100 - sum;
        map.set(fund.id, Math.max(5, Math.min(95, Math.round(remainder))));
      } else {
        map.set(fund.id, clampedInitial);
      }
    });
    // Ensure total is exactly 100 (integer)
    let total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    if (total !== 100 && selectedFunds.length > 0) {
      const firstId = selectedFunds[0].id;
      map.set(firstId, (map.get(firstId) ?? 0) + (100 - total));
    }
    return map;
  }, [selectedFunds, initialPercentage]);
  
  const [allocations, setAllocations] = useState<Map<number, number>>(initialAllocations);
  const allocationsRef = useRef<Map<number, number>>(initialAllocations);
  const previousFundIdsRef = useRef<string>("");

  // Keep ref in sync with state
  useEffect(() => {
    allocationsRef.current = allocations;
  }, [allocations]);
  
  // Re-initialize when selected funds change - only when fund IDs actually change
  useEffect(() => {
    const currentFundIds = selectedFundIds.sort().join(",");
    
    // Only re-initialize if fund IDs actually changed
    if (previousFundIdsRef.current === currentFundIds) {
      return;
    }
    
    previousFundIdsRef.current = currentFundIds;
    
    const newAllocations = new Map<number, number>();
    
    // If only one fund, set to 100%
    if (selectedFunds.length === 1) {
      newAllocations.set(selectedFunds[0].id, 100);
      setAllocations(newAllocations);
      allocationsRef.current = newAllocations;
      return;
    }
    
    const clampedInitial = Math.max(5, Math.min(95, Math.round(initialPercentage)));
    selectedFunds.forEach((fund, index) => {
      if (index === selectedFunds.length - 1) {
        const sum = Array.from(newAllocations.values()).reduce((s, v) => s + v, 0);
        const remainder = 100 - sum;
        newAllocations.set(fund.id, Math.max(5, Math.min(95, Math.round(remainder))));
      } else {
        newAllocations.set(fund.id, clampedInitial);
      }
    });
    let total = Array.from(newAllocations.values()).reduce((s, v) => s + v, 0);
    if (total !== 100 && selectedFunds.length > 0) {
      newAllocations.set(selectedFunds[0].id, (newAllocations.get(selectedFunds[0].id) ?? 0) + (100 - total));
    }
    setAllocations(newAllocations);
    allocationsRef.current = newAllocations;
  }, [selectedFundIds, selectedFunds, initialPercentage]);
  
  const totalPercentage = useMemo(() => {
    const total = Array.from(allocations.values()).reduce((sum, val) => sum + val, 0);
    return Math.round(total);
  }, [allocations]);

  // Calculate step based on number of funds
  const sliderStep = useMemo(() => {
    return calculateStep(selectedFunds.length);
  }, [selectedFunds.length]);
  
  const handlePercentageChange = (fundId: number, newPercentage: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/67f948b8-794c-4178-a942-4c9f88678cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'allocation-page.tsx:220',message:'handlePercentageChange called',data:{fundId,newPercentage,currentAllocations:Object.fromEntries(allocationsRef.current)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    // Use the ref to get the latest allocations, avoiding stale closures from batched updates
    const currentAllocations = allocationsRef.current;
    const newAllocations = distributePercentage(fundId, newPercentage, currentAllocations, selectedFundIds);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/67f948b8-794c-4178-a942-4c9f88678cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'allocation-page.tsx:225',message:'calculated new allocations',data:{newAllocations:Object.fromEntries(newAllocations)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    // Update ref IMMEDIATELY before setState to ensure next call sees updated value
    allocationsRef.current = newAllocations;
    setAllocations(newAllocations);
  };
  
  const handleContinue = () => {
    if (totalPercentage !== 100) {
      alert(`مجموع درصدها باید دقیقاً 100% باشد. مجموع فعلی: ${totalPercentage}%`);
      return;
    }

    // Prepare portfolio data for localStorage
    const portfolioData = Array.from(allocations.entries())
      .map(([fundId, percentage]) => {
        const fund = selectedFunds.find(f => f.id === fundId);
        return {
          fundId,
          fundName: fund?.name || "",
          percentage: Math.round(percentage),
          category: fund?.category || "conservative",
        };
      })
      .filter(item => item.fundName !== ""); // Remove invalid entries

    // Save to localStorage
    try {
      localStorage.setItem("portfolio", JSON.stringify(portfolioData));
      localStorage.setItem("portfolioUpdatedAt", new Date().toISOString());
    } catch (error) {
      console.error("Failed to save portfolio to localStorage:", error);
      alert("خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.");
      return;
    }

    // Call original callback if provided (for wizard flow)
    if (onContinue) {
      try {
      onContinue(allocations);
      } catch (error) {
        console.error("Error in onContinue callback:", error);
      }
    }

    // Navigate to dashboard
    router.push("/app");
  };
  
  if (selectedFunds.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center px-4 py-8", className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">هیچ صندوقی انتخاب نشده است</p>
            {onBack && (
              <Button onClick={onBack} variant="outline" className="mt-4">
                بازگشت
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <div className={cn("flex-1 flex items-start justify-center px-4 py-8 pb-24 overflow-y-auto", className)}>
        <div className="w-full max-w-2xl space-y-6">
          <Card className="border-2">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">تخصیص درصد سرمایه</CardTitle>
              <p className="text-muted-foreground mt-2">
                درصد سرمایه‌گذاری خود را برای هر صندوق مشخص کنید
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="space-y-4">
                {selectedFunds.map((fund) => {
                  const fundPercentage = allocations.get(fund.id) || 0;
                  return (
                    <FundAllocationItem
                      key={fund.id}
                      fund={fund}
                      percentage={fundPercentage}
                      step={sliderStep}
                      isSingleFund={selectedFunds.length === 1}
                      onPercentageChange={(percentage) => handlePercentageChange(fund.id, percentage)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-10 pb-safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Button clicked, totalPercentage:", totalPercentage);
              handleContinue();
            }}
            disabled={totalPercentage !== 100}
            className="flex-1"
            size="lg"
          >
            <Save className="w-4 h-4 ml-2" />
            ذخیره و سرمایه‌گذاری
            {totalPercentage !== 100 && (
              <span className="mr-2 text-xs opacity-75">
                ({totalPercentage}%)
              </span>
            )}
          </Button>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex-1">
              تغییر صندوق
            </Button>
          )}
        </div>
      </div>
    </>
  );
}


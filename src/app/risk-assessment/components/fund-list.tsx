"use client";

import { RiskProfile } from "../data/questions";
import { getAllFunds, getFundsByCategory, Fund } from "../data/funds";
import { FundCard } from "./fund-card";
import { cn } from "@/shared/lib/utils";

interface FundListProps {
  profile: RiskProfile;
  selectedFundIds: number[];
  onToggleFund: (fundId: number) => void;
  className?: string;
}

export function FundList({ profile, selectedFundIds, onToggleFund, className }: FundListProps) {
  const recommendedFunds = getFundsByCategory(profile);
  const allFunds = getAllFunds();
  
  // Remove recommended funds from all funds list
  const recommendedFundIds = recommendedFunds.map(f => f.id);
  const otherFunds = allFunds.filter(fund => !recommendedFundIds.includes(fund.id));

  if (allFunds.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-lg">صندوق‌های پیشنهادی:</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recommendedFunds.map((fund) => (
          <FundCard
            key={fund.id}
            fund={fund}
            isSelected={selectedFundIds.includes(fund.id)}
            onToggle={() => onToggleFund(fund.id)}
          />
        ))}
      </div>
      
      {/* All Funds List */}
      {otherFunds.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-lg mb-4">صندوق‌ها:</h3>
          <div className="space-y-4">
            {Array.from({ length: Math.ceil(otherFunds.length / 2) }).map((_, rowIndex) => {
              const startIndex = rowIndex * 2;
              const rowFunds = otherFunds.slice(startIndex, startIndex + 2);
              
              return (
                <div key={rowIndex}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rowFunds.map((fund) => (
                      <FundCard
                        key={fund.id}
                        fund={fund}
                        isSelected={selectedFundIds.includes(fund.id)}
                        onToggle={() => onToggleFund(fund.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


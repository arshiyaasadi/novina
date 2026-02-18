export interface FundPrice {
  id: number;
  currentPrice: number;
  change24h: number;
}

export const fundPrices: FundPrice[] = [
  { id: 1, currentPrice: 125000, change24h: 0.5 },
  { id: 2, currentPrice: 118000, change24h: 0.3 },
  { id: 3, currentPrice: 2850000, change24h: -1.2 },
  { id: 4, currentPrice: 95000, change24h: 2.1 },
  { id: 5, currentPrice: 12500, change24h: 1.8 },
];

export function getFundPrice(fundId: number): FundPrice | undefined {
  return fundPrices.find((p) => p.id === fundId);
}

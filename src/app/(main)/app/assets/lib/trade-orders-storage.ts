export type TradeOrderType = "issue" | "redeem";
export type TradeOrderStatus = "draft" | "pending" | "completed" | "expired" | "cancelled";

export interface StoredTradeOrder {
  id: string;
  type: TradeOrderType;
  fundId: number;
  fundName: string;
  pricePerUnit: number;
  units: number;
  amount: number;
  status: TradeOrderStatus;
  createdAt: string; // ISO
  expiresAt: string; // ISO, invoice validity (e.g. 2 min)
}

const STORAGE_KEY = "assetTradeOrders";

function getOrders(): StoredTradeOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getTradeOrders(): StoredTradeOrder[] {
  return getOrders();
}

export function addTradeOrder(order: Omit<StoredTradeOrder, "id" | "createdAt" | "expiresAt">): StoredTradeOrder {
  const created: StoredTradeOrder = {
    ...order,
    id: `trade-${Date.now()}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 min
  };
  const list = getOrders();
  list.unshift(created);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return created;
}

export function updateTradeOrderStatus(id: string, status: TradeOrderStatus): void {
  const list = getOrders();
  const idx = list.findIndex((o) => o.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

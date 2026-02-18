const MAIN_WALLET_BALANCE_KEY = "mainWalletBalanceToman";
const WALLET_CREDITS_KEY = "walletCredits";
const MAIN_WALLET_JOURNAL_KEY = "mainWalletJournal";

export interface WalletCredits {
  loan: number;
  funds: number;
  crypto: number;
  twin: number;
}

export type JournalEntryType =
  | "deposit"
  | "withdraw"
  | "use_for_issue"
  | "credit_loan"
  | "credit_funds"
  | "credit_crypto"
  | "credit_twin"
  | "redeem";

export type JournalEntrySource = "main" | "loan" | "funds" | "crypto" | "twin";

export interface MainWalletJournalEntry {
  id: string;
  type: JournalEntryType;
  amount: number;
  source: JournalEntrySource;
  createdAt: string;
  description?: string;
  reference?: string;
}

const DEFAULT_CREDITS: WalletCredits = {
  loan: 0,
  funds: 0,
  crypto: 0,
  twin: 0,
};

export function getMainWalletBalance(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MAIN_WALLET_BALANCE_KEY);
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isNaN(n) || n < 0 ? 0 : Math.floor(n);
  } catch {
    return 0;
  }
}

export function setMainWalletBalance(value: number): void {
  if (typeof window === "undefined") return;
  const n = Math.max(0, Math.floor(value));
  localStorage.setItem(MAIN_WALLET_BALANCE_KEY, String(n));
}

export function getWalletCredits(): WalletCredits {
  if (typeof window === "undefined") return { ...DEFAULT_CREDITS };
  try {
    const raw = localStorage.getItem(WALLET_CREDITS_KEY);
    if (!raw) return { ...DEFAULT_CREDITS };
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && ["loan", "funds", "crypto", "twin"].every((k) => k in parsed && typeof (parsed as Record<string, unknown>)[k] === "number")) {
      return {
        loan: Math.max(0, Math.floor((parsed as WalletCredits).loan)),
        funds: Math.max(0, Math.floor((parsed as WalletCredits).funds)),
        crypto: Math.max(0, Math.floor((parsed as WalletCredits).crypto)),
        twin: Math.max(0, Math.floor((parsed as WalletCredits).twin)),
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CREDITS };
}

export function setWalletCredits(credits: WalletCredits): void {
  if (typeof window === "undefined") return;
  const next = {
    loan: Math.max(0, Math.floor(credits.loan)),
    funds: Math.max(0, Math.floor(credits.funds)),
    crypto: Math.max(0, Math.floor(credits.crypto)),
    twin: Math.max(0, Math.floor(credits.twin)),
  };
  localStorage.setItem(WALLET_CREDITS_KEY, JSON.stringify(next));
}

export function getTotalWalletValue(): number {
  const balance = getMainWalletBalance();
  const credits = getWalletCredits();
  return balance + credits.loan + credits.funds + credits.crypto + credits.twin;
}

export function getMainWalletJournal(): MainWalletJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MAIN_WALLET_JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as MainWalletJournalEntry[]).filter(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.type === "string" &&
        typeof e.amount === "number" &&
        typeof e.source === "string" &&
        typeof e.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function appendMainWalletJournalEntry(
  entry: Omit<MainWalletJournalEntry, "id" | "createdAt">
): MainWalletJournalEntry {
  const full: MainWalletJournalEntry = {
    ...entry,
    id: `j-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return full;
  try {
    const list = getMainWalletJournal();
    list.unshift(full);
    localStorage.setItem(MAIN_WALLET_JOURNAL_KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    // ignore
  }
  return full;
}

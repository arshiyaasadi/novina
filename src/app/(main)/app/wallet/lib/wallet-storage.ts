const WALLET_REGISTERED_KEY = "walletRegistered";
const WALLET_MNEMONIC_BACKED_UP_KEY = "walletMnemonicBackedUp";
const WALLET_ADDRESSES_KEY = "walletAddresses";
const WALLET_BALANCES_KEY = "walletBalances";

export interface WalletAddresses {
  usdt: string;
  btc: string;
}

export interface WalletBalances {
  usdt: string;
  btc: string;
}

export interface WalletState {
  walletRegistered: boolean;
  walletMnemonicBackedUp: boolean;
  walletAddresses: WalletAddresses | null;
  walletBalances: WalletBalances | null;
}

function generateMockAddress(prefix: string, length: number): string {
  const chars = "0123456789abcdef";
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function getWalletState(): WalletState {
  if (typeof window === "undefined") {
    return {
      walletRegistered: false,
      walletMnemonicBackedUp: false,
      walletAddresses: null,
      walletBalances: null,
    };
  }
  try {
    const registered = localStorage.getItem(WALLET_REGISTERED_KEY) === "true";
    const backedUp = localStorage.getItem(WALLET_MNEMONIC_BACKED_UP_KEY) === "true";
    let addresses: WalletAddresses | null = null;
    let balances: WalletBalances | null = null;
    const addressesRaw = localStorage.getItem(WALLET_ADDRESSES_KEY);
    const balancesRaw = localStorage.getItem(WALLET_BALANCES_KEY);
    if (addressesRaw) {
      try {
        addresses = JSON.parse(addressesRaw) as WalletAddresses;
      } catch {
        addresses = null;
      }
    }
    if (balancesRaw) {
      try {
        balances = JSON.parse(balancesRaw) as WalletBalances;
      } catch {
        balances = null;
      }
    }
    return {
      walletRegistered: registered,
      walletMnemonicBackedUp: backedUp,
      walletAddresses: addresses,
      walletBalances: balances,
    };
  } catch {
    return {
      walletRegistered: false,
      walletMnemonicBackedUp: false,
      walletAddresses: null,
      walletBalances: null,
    };
  }
}

export function setWalletRegistered(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_REGISTERED_KEY, value ? "true" : "false");
}

export function setWalletMnemonicBackedUp(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_MNEMONIC_BACKED_UP_KEY, value ? "true" : "false");
}

export function setWalletAddresses(addresses: WalletAddresses): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_ADDRESSES_KEY, JSON.stringify(addresses));
}

export function setWalletBalances(balances: WalletBalances): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_BALANCES_KEY, JSON.stringify(balances));
}

export function createMockWalletAddresses(): WalletAddresses {
  return {
    usdt: "0x" + generateMockAddress("", 40),
    btc: "bc1" + generateMockAddress("", 42),
  };
}

export function getDefaultWalletBalances(): WalletBalances {
  return { usdt: "0", btc: "0" };
}

/** Formats BTC balance for display (e.g. "0.00100000" → "0.001") */
export function formatBtcDisplay(btc: string | undefined | null): string {
  if (btc == null || btc === "") return "۰";
  const n = Number(btc);
  if (Number.isNaN(n)) return btc;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(8).replace(/0+$/, "");
}

export function completeWalletRegistration(): void {
  setWalletRegistered(true);
  setWalletMnemonicBackedUp(true);
  setWalletAddresses(createMockWalletAddresses());
  setWalletBalances(getDefaultWalletBalances());
}

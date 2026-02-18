"use client";

import { create } from "zustand";
import type { WalletCredits } from "../lib/main-wallet-storage";
import {
  getMainWalletBalance as getBalanceFromStorage,
  setMainWalletBalance as setBalanceInStorage,
  getWalletCredits as getCreditsFromStorage,
  setWalletCredits as setCreditsInStorage,
} from "../lib/main-wallet-storage";

interface MainWalletState {
  mainWalletBalance: number;
  walletCredits: WalletCredits;
  /** Sync state from localStorage (call once on client mount or when needing refresh) */
  hydrate: () => void;
  setMainWalletBalance: (value: number) => void;
  setWalletCredits: (credits: WalletCredits) => void;
}

export const useMainWalletStore = create<MainWalletState>((set) => ({
  mainWalletBalance: 0,
  walletCredits: { loan: 0, funds: 0, crypto: 0, twin: 0 },

  hydrate: () => {
    if (typeof window === "undefined") return;
    set({
      mainWalletBalance: getBalanceFromStorage(),
      walletCredits: getCreditsFromStorage(),
    });
  },

  setMainWalletBalance: (value: number) => {
    const n = Math.max(0, Math.floor(value));
    setBalanceInStorage(n);
    set({ mainWalletBalance: n });
  },

  setWalletCredits: (credits: WalletCredits) => {
    const next = {
      loan: Math.max(0, Math.floor(credits.loan)),
      funds: Math.max(0, Math.floor(credits.funds)),
      crypto: Math.max(0, Math.floor(credits.crypto)),
      twin: Math.max(0, Math.floor(credits.twin)),
    };
    setCreditsInStorage(next);
    set({ walletCredits: next });
  },
}));

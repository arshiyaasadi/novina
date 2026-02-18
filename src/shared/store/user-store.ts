"use client";

import { create } from "zustand";
import type { LoggedInUserDto } from "@/domains/auth/types";

const STORAGE_KEY = "loggedInUser";

interface UserState {
  user: LoggedInUserDto | null;
  setUser: (user: LoggedInUserDto | null) => void;
  clearUser: () => void;
  /** Hydrate from localStorage (once after load or after login) */
  hydrate: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,

  setUser: (user) => {
    set({ user });
    if (typeof window !== "undefined") {
      if (user) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch {
          // ignore
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  },

  clearUser: () => {
    set({ user: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ user: null });
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "mobile" in parsed &&
        "nationalId" in parsed &&
        "firstName" in parsed &&
        "lastName" in parsed &&
        "birthDate" in parsed
      ) {
        const u = parsed as LoggedInUserDto;
        set({
          user: {
            mobile: String(u.mobile),
            nationalId: String(u.nationalId),
            firstName: String(u.firstName),
            lastName: String(u.lastName),
            birthDate: String(u.birthDate),
          },
        });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    }
  },
}));

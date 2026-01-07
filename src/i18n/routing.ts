import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["fa", "en"],

  // Used when no locale matches
  defaultLocale: "fa",

  // Never show locale prefix - always use default locale at root
  localePrefix: "never",

  // Disable automatic locale detection to prevent redirects
  localeDetection: false,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);


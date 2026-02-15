import { routing } from "../src/i18n/routing";

/** Request config for next-intl (no import from next-intl here to avoid circular dependency) */
async function getRequestConfig() {
  const locale = routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../src/i18n/locales/${locale}.json`)).default,
    timeZone: "Asia/Tehran",
  };
}

export default getRequestConfig;

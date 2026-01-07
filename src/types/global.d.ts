// Global type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: "development" | "production" | "test";
      LOG_LEVEL?: "error" | "warn" | "info" | "debug";
      LOG_FILE_PATH?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_DEFAULT_LOCALE?: string;
      GAPGPT_API_KEY?: string;
      GAPGPT_BASE_URL?: string;
      GAPGPT_MODEL?: string;
    }
  }
}

export {};


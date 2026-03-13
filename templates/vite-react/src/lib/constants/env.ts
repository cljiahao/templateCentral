export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string | undefined,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

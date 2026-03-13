import { APIError } from '@/integrations/error';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createHttpsAgent, type HttpsAgentOptions } from './https-agent';

interface AxiosClientOptions {
  baseURL: string;
  timeout?: number;
  httpsAgentOptions?: HttpsAgentOptions;
  apiKey?: Record<string, string>;
  additionalHeaders?: Record<string, string>;
  enableLogging?: boolean;
}

interface AxiosErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

export function createAxiosClient(options: AxiosClientOptions): AxiosInstance {
  const {
    baseURL,
    timeout = 30_000,
    httpsAgentOptions,
    apiKey,
    additionalHeaders = {},
    enableLogging = process.env.NODE_ENV === 'development',
  } = options;

  const client = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json', ...additionalHeaders },
  });

  if (httpsAgentOptions) {
    client.defaults.httpsAgent = createHttpsAgent(httpsAgentOptions);
  }

  // ── Request Interceptor ─────────────────────────────────────────

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (apiKey) {
        for (const [key, value] of Object.entries(apiKey)) {
          config.headers[key] = value;
        }
      }

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }

      if (enableLogging) {
        console.log(
          `[Request] ${config.method?.toUpperCase()} ${config.url}`,
          { params: config.params, data: config.data }
        );
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('[Request Error]', error.message);
      return Promise.reject(error);
    }
  );

  // ── Response Interceptor ────────────────────────────────────────

  client.interceptors.response.use(
    (response) => {
      if (enableLogging) {
        console.log(
          `[Response] ${response.status} ${response.config.url}`,
          response.data
        );
      }
      return response;
    },
    (error: AxiosError<AxiosErrorResponse>) => {
      if (!error.response) {
        throw new APIError({
          statusCode: error.code === 'ECONNABORTED' ? 408 : 500,
          data: { message: `Request timeout after ${timeout}ms` },
        });
      }

      const statusCode = error.response.status || 500;
      let data: unknown = error.response.data;

      if (typeof data === 'string' && data.trimStart().startsWith('<')) {
        console.error(
          `[HTTP ${statusCode}] Received HTML error response from ${error.config?.url}`
        );
        data = { message: error.response.statusText || error.message };
      }

      if (enableLogging) {
        console.error(`[API Error ${statusCode}]`, {
          url: error.config?.url,
          message: error.message,
        });
      }

      if (statusCode === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }

      throw new APIError({ statusCode, data });
    }
  );

  return client;
}

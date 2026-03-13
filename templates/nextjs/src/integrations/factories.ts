/**
 * Factory functions for creating integration client instances.
 *
 * Pattern: Environment → factories.ts → clients/ → services/ → schemas/
 *
 * Example usage:
 *
 *   import { createAxiosClient } from '@/integrations/clients/base/axios-client';
 *
 *   export const myApiClient = createAxiosClient({
 *     baseURL: process.env.MY_API_URL!,
 *     apiKey: { 'x-api-key': process.env.MY_API_KEY! },
 *   });
 *
 * For fetch-based clients, extend FetchClient:
 *
 *   import { FetchClient } from '@/integrations/clients/base/fetch-client';
 *
 *   class MyClient extends FetchClient {
 *     async getItems() {
 *       return this.request<Item[]>('items');
 *     }
 *   }
 *
 *   export const myClient = new MyClient(
 *     process.env.MY_API_URL!,
 *     { Authorization: `Bearer ${process.env.MY_TOKEN}` }
 *   );
 */

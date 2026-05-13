// src/services/apiClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
const DEFAULT_GET_CACHE_TTL_MS = 60_000;

type CachedEntry<T = any> = {
  timestamp: number;
  data: T;
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private memoryCache = new Map<string, CachedEntry>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get token from AsyncStorage first (session context stores it there)
      const storedSession = await AsyncStorage.getItem('session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        return session.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const method = (options.method || 'GET').toUpperCase();
      const url = `${this.baseURL}${endpoint}`;
      const token = await this.getAuthToken();
      const cacheKey = `${method}:${endpoint}:${token || 'anonymous'}`;
      const shouldCache = method === 'GET';

      if (shouldCache) {
        const cached = this.memoryCache.get(cacheKey) || await this.readCache<T>(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.getCacheTtlMs(endpoint)) {
          return { success: true, data: cached.data };
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Merge with any additional headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Inspect content-type to avoid JSON parse errors when server redirects to HTML
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Non-JSON response (HTML or plain text) — capture text for diagnostics
        data = await response.text();
      }

      if (!response.ok) {
        // If unauthorized, clear local session and mark resume auth required
        if (response.status === 401) {
          try {
            await AsyncStorage.removeItem('session')
            await AsyncStorage.setItem('requiresResumeAuth', 'true')
          } catch (e) {
            console.error('Failed to clear session after 401:', e)
          }
          return { success: false, error: 'Unauthorized', data };
        }

        const serverError =
          (data && (data.error || data.message)) ||
          (data && data.details && (data.details.message || String(data.details))) ||
          // If data is HTML/text fallback to raw text
          (typeof data === 'string' ? data.substr(0, 500) : `HTTP ${response.status}`);

        return {
          success: false,
          error: serverError,
          data,
        };
      }

      const result = {
        success: true,
        data,
      };

      if (shouldCache) {
        const cachedEntry: CachedEntry<T> = { timestamp: Date.now(), data };
        this.memoryCache.set(cacheKey, cachedEntry);
        this.writeCache(cacheKey, cachedEntry).catch(() => undefined);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  private getCacheTtlMs(endpoint: string): number {
    if (endpoint.includes('/notifications/unread-count')) return 15_000;
    if (endpoint.includes('/notifications')) return 30_000;
    if (endpoint.includes('/price-comparison')) return 5 * 60_000;
    if (endpoint.includes('/spend-analytics')) return 5 * 60_000;
    if (endpoint.includes('/payscribe/analytics')) return 5 * 60_000;
    if (endpoint.includes('/payscribe/reports')) return 5 * 60_000;
    if (endpoint.includes('/reports')) return 5 * 60_000;
    if (endpoint.includes('/user/profile')) return 2 * 60_000;
    if (endpoint.includes('/payscribe/wallet')) return 30_000;
    if (endpoint.includes('/payscribe/virtual-accounts')) return 60_000;
    if (endpoint.includes('/payscribe/cards')) return 60_000;
    if (endpoint.includes('/services/data/plans')) return 10 * 60_000;
    return DEFAULT_GET_CACHE_TTL_MS;
  }

  private async readCache<T>(key: string): Promise<CachedEntry<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(`api-cache:${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as CachedEntry<T>;
    } catch {
      return null;
    }
  }

  private async writeCache<T>(key: string, entry: CachedEntry<T>): Promise<void> {
    try {
      await AsyncStorage.setItem(`api-cache:${key}`, JSON.stringify(entry));
    } catch {
      // ignore cache write failures
    }
  }

  async clearCache(prefix?: string): Promise<void> {
    try {
      this.memoryCache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('api-cache:'));
      if (prefix) {
        await AsyncStorage.multiRemove(cacheKeys.filter((key) => key.includes(prefix)));
      } else {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {
      // ignore cache clear failures
    }
  }

  // Upload FormData (files) without forcing JSON content-type
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData as any,
      });

      const data = await response.json();

      if (!response.ok) {
        const serverError = (data && (data.error || data.message)) || `HTTP ${response.status}`;
        return { success: false, error: serverError, data };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload error' };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Convenience function for making API calls
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};
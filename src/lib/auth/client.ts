"use client";

/**
 * Client-Side Authentication Utilities
 *
 * Provides hooks and utilities for making authenticated API requests.
 *
 * Usage with the hook:
 * ```typescript
 * const { authFetch, getAuthHeaders } = useAuthFetch();
 *
 * // Make authenticated requests
 * const response = await authFetch('/api/referrals/status');
 * ```
 *
 * Usage with AuthContext:
 * ```typescript
 * import { useAuth } from '@/context/AuthContext';
 * import { createAuthFetch } from '@/lib/auth/client';
 *
 * const { user } = useAuth();
 * // Pass authToken from useDynamicContext
 * ```
 */

import { useDynamicContext, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { useCallback, useMemo } from "react";

/**
 * Hook for making authenticated API requests.
 *
 * Returns utilities for adding auth headers to fetch requests.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { authFetch, isReady } = useAuthFetch();
 *
 *   const loadData = async () => {
 *     if (!isReady) return;
 *     const response = await authFetch('/api/referrals/status');
 *     const data = await response.json();
 *   };
 * }
 * ```
 */
export function useAuthFetch() {
  const { sdkHasLoaded, user } = useDynamicContext();

  /**
   * Get the authorization headers for authenticated requests.
   */
  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = getAuthToken();
    if (!token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

  /**
   * Make an authenticated fetch request.
   * Automatically adds the Authorization header if available.
   */
  const authFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ): Promise<Response> => {
      const headers = new Headers(options.headers);
      const token = getAuthToken();

      // Add auth header if token exists
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Ensure Content-Type for JSON requests
      if (
        options.body &&
        typeof options.body === "string" &&
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    []
  );

  /**
   * Whether the auth system is ready to make authenticated requests.
   */
  const isReady = useMemo(
    () => sdkHasLoaded && !!user,
    [sdkHasLoaded, user]
  );

  /**
   * Get the current auth token (if available).
   */
  const authToken = useMemo(() => getAuthToken(), []);

  return {
    authFetch,
    getAuthHeaders,
    isReady,
    authToken,
  };
}

/**
 * Create authenticated fetch headers from a token.
 * Useful when you have the token from context but don't want to use the hook.
 */
export function createAuthHeaders(authToken: string | null): HeadersInit {
  if (!authToken) {
    return {};
  }
  return {
    Authorization: `Bearer ${authToken}`,
  };
}

/**
 * Create an authenticated fetch function from a token.
 * Useful for one-off requests where you have the token.
 */
export function createAuthFetch(authToken: string | null) {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);

    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    if (
      options.body &&
      typeof options.body === "string" &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };
}

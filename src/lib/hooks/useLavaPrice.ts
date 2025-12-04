"use client";

// Hook for fetching LAVA token price
// Uses the internal API route which caches the price for 1 hour

import { useState, useEffect, useCallback } from "react";

export interface LavaPriceResult {
  // Price in USD
  price: number | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Last updated
  lastUpdated: Date | null;

  // Refresh function
  refetch: () => void;
}

export function useLavaPrice(): LavaPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    console.log("[useLavaPrice] Fetching LAVA price");
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const res = await fetch("/api/lava-price");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch LAVA price");
      }

      const data: { price: number; timestamp: number } = await res.json();

      console.log("[useLavaPrice] Fetched price:", data.price);
      setPrice(data.price);
      setLastUpdated(new Date(data.timestamp));
    } catch (err) {
      console.error("[useLavaPrice] Error fetching price:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch price"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch price on mount
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch: fetchPrice,
  };
}

// Helper to format price with appropriate decimals
export function formatLavaPrice(price: number | null): string {
  if (price === null) return "—";
  
  // Show more decimals for very small prices
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  } else if (price < 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
}

// Helper to calculate USD value from LAVA amount
export function calculateUsdValue(lavaAmount: number, price: number | null): number | null {
  if (price === null) return null;
  return lavaAmount * price;
}

// Helper to format USD value
export function formatUsdValue(value: number | null): string {
  if (value === null) return "—";
  
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  } else if (value < 100) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}


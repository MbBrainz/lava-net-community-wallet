"use client";

// Hook for fetching LAVA token balances
// Uses viem directly since Dynamic's useTokenBalances only shows top 1000 tokens by DEX volume
// and LAVA token is not in that list

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createPublicClient, http, formatUnits } from "viem";
import { arbitrum, base } from "viem/chains";
import { LAVA_TOKEN_ADDRESS, ERC20_ABI, CHAIN_CONFIGS } from "@/lib/chains/registry";

// Chain IDs we care about
const ARBITRUM_CHAIN_ID = 42161;
const BASE_CHAIN_ID = 8453;

const LAVA_DECIMALS = 6;

export interface LavaBalanceResult {
  // LAVA balances
  arbitrumLava: number;
  baseLava: number;
  totalLava: number;

  // Native ETH balances
  arbitrumEth: number;
  baseEth: number;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Last updated
  lastUpdated: Date | null;

  // Refresh function
  refetch: () => void;
}

// Create viem clients for each chain
const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(CHAIN_CONFIGS[ARBITRUM_CHAIN_ID].rpcUrl),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(CHAIN_CONFIGS[BASE_CHAIN_ID].rpcUrl),
});

export function useLavaBalance(): LavaBalanceResult {
  const { primaryWallet } = useDynamicContext();
  const walletAddress = primaryWallet?.address as `0x${string}` | undefined;

  const [arbitrumLava, setArbitrumLava] = useState(0);
  const [baseLava, setBaseLava] = useState(0);
  const [arbitrumEth, setArbitrumEth] = useState(0);
  const [baseEth, setBaseEth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) {
      console.log("[useLavaBalance] No wallet address, skipping balance fetch");
      return;
    }

    console.log("[useLavaBalance] Fetching balances for:", walletAddress);
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // Fetch all balances in parallel
      const [
        arbitrumLavaBalance,
        baseLavaBalance,
        arbitrumEthBalance,
        baseEthBalance,
      ] = await Promise.all([
        // LAVA on Arbitrum
        arbitrumClient.readContract({
          address: LAVA_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [walletAddress],
        }).catch((err) => {
          console.error("[useLavaBalance] Error fetching LAVA on Arbitrum:", err);
          return BigInt(0);
        }),

        // LAVA on Base
        baseClient.readContract({
          address: LAVA_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [walletAddress],
        }).catch((err) => {
          console.error("[useLavaBalance] Error fetching LAVA on Base:", err);
          return BigInt(0);
        }),

        // ETH on Arbitrum
        arbitrumClient.getBalance({ address: walletAddress }).catch((err) => {
          console.error("[useLavaBalance] Error fetching ETH on Arbitrum:", err);
          return BigInt(0);
        }),

        // ETH on Base
        baseClient.getBalance({ address: walletAddress }).catch((err) => {
          console.error("[useLavaBalance] Error fetching ETH on Base:", err);
          return BigInt(0);
        }),
      ]);

      // Format balances (LAVA has 18 decimals, ETH has 18 decimals)
      const formattedArbitrumLava = Number(formatUnits(arbitrumLavaBalance as bigint, LAVA_DECIMALS));
      const formattedBaseLava = Number(formatUnits(baseLavaBalance as bigint, LAVA_DECIMALS));
      const formattedArbitrumEth = Number(formatUnits(arbitrumEthBalance, 18));
      const formattedBaseEth = Number(formatUnits(baseEthBalance, 18));

      console.log("[useLavaBalance] Fetched balances:", {
        arbitrumLava: formattedArbitrumLava,
        baseLava: formattedBaseLava,
        totalLava: formattedArbitrumLava + formattedBaseLava,
        arbitrumEth: formattedArbitrumEth,
        baseEth: formattedBaseEth,
      });

      setArbitrumLava(formattedArbitrumLava);
      setBaseLava(formattedBaseLava);
      setArbitrumEth(formattedArbitrumEth);
      setBaseEth(formattedBaseEth);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[useLavaBalance] Error fetching balances:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch balances"));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    } else {
      // Reset balances when wallet disconnects
      setArbitrumLava(0);
      setBaseLava(0);
      setArbitrumEth(0);
      setBaseEth(0);
      setLastUpdated(null);
    }
  }, [walletAddress, fetchBalances]);

  return {
    arbitrumLava,
    baseLava,
    totalLava: arbitrumLava + baseLava,
    arbitrumEth,
    baseEth,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch: fetchBalances,
  };
}

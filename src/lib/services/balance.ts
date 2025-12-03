// EVM Balance Service
// Fetches native and token balances across multiple EVM chains using viem

import { createPublicClient, http, formatUnits, type PublicClient } from "viem";
import { arbitrum, base } from "viem/chains";
import {
  CHAIN_CONFIGS,
  ERC20_ABI,
  LAVA_TOKEN_ADDRESS,
  formatFromWei,
  type ChainId,
  type ChainConfig,
} from "@/lib/chains/registry";

// Balance types
export interface TokenBalance {
  symbol: string;
  name: string;
  balance: bigint;
  balanceFormatted: number;
  decimals: number;
  contractAddress: `0x${string}`;
  logoUrl?: string;
}

export interface ChainBalance {
  chainId: ChainId;
  chainName: string;
  nativeBalance: bigint;
  nativeBalanceFormatted: number;
  nativeSymbol: string;
  tokens: TokenBalance[];
  lastUpdated: Date;
}

export interface MultiChainBalance {
  address: string;
  chains: ChainBalance[];
  totalLavaBalance: number;
  lastUpdated: Date;
}

// Viem chain configs
const viemChains = {
  42161: arbitrum,
  8453: base,
} as const;

// Create a public client for a chain
function createClient(chainId: ChainId): PublicClient {
  const chainConfig = CHAIN_CONFIGS[chainId];
  const viemChain = viemChains[chainId];

  return createPublicClient({
    chain: viemChain,
    transport: http(chainConfig.rpcUrl),
  });
}

// Fetch native balance for an address on a specific chain
export async function fetchNativeBalance(
  address: `0x${string}`,
  chainId: ChainId
): Promise<{ balance: bigint; formatted: number }> {
  const client = createClient(chainId);
  const chainConfig = CHAIN_CONFIGS[chainId];

  try {
    const balance = await client.getBalance({ address });
    const formatted = formatFromWei(balance, chainConfig.nativeCurrency.decimals);

    console.log(`[Balance] Native balance on ${chainConfig.displayName}:`, {
      balance: balance.toString(),
      formatted,
    });

    return { balance, formatted };
  } catch (error) {
    console.error(`[Balance] Failed to fetch native balance on ${chainConfig.displayName}:`, error);
    throw error;
  }
}

// Fetch ERC20 token balance
export async function fetchTokenBalance(
  address: `0x${string}`,
  tokenAddress: `0x${string}`,
  chainId: ChainId
): Promise<TokenBalance> {
  const client = createClient(chainId);
  const chainConfig = CHAIN_CONFIGS[chainId];
  const tokenConfig = chainConfig.tokens.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  try {
    // Read balance
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    });

    // Get decimals (use config or read from contract)
    const decimals = tokenConfig?.decimals || 18;

    const balanceFormatted = Number(formatUnits(balance, decimals));

    console.log(`[Balance] Token balance on ${chainConfig.displayName}:`, {
      token: tokenConfig?.symbol || "Unknown",
      balance: balance.toString(),
      balanceFormatted,
    });

    return {
      symbol: tokenConfig?.symbol || "UNKNOWN",
      name: tokenConfig?.name || "Unknown Token",
      balance,
      balanceFormatted,
      decimals,
      contractAddress: tokenAddress,
      logoUrl: tokenConfig?.logoUrl,
    };
  } catch (error) {
    console.error(
      `[Balance] Failed to fetch token balance on ${chainConfig.displayName}:`,
      error
    );
    // Return zero balance on error
    return {
      symbol: tokenConfig?.symbol || "UNKNOWN",
      name: tokenConfig?.name || "Unknown Token",
      balance: 0n,
      balanceFormatted: 0,
      decimals: tokenConfig?.decimals || 18,
      contractAddress: tokenAddress,
      logoUrl: tokenConfig?.logoUrl,
    };
  }
}

// Fetch all balances for a single chain
export async function fetchChainBalance(
  address: `0x${string}`,
  chainId: ChainId
): Promise<ChainBalance> {
  const chainConfig = CHAIN_CONFIGS[chainId];

  console.log(`[Balance] Fetching balances on ${chainConfig.displayName} for ${address}`);

  // Fetch native balance
  const { balance: nativeBalance, formatted: nativeBalanceFormatted } = await fetchNativeBalance(
    address,
    chainId
  );

  // Fetch all token balances for this chain
  const tokenBalances = await Promise.all(
    chainConfig.tokens.map((token) => fetchTokenBalance(address, token.address, chainId))
  );

  return {
    chainId,
    chainName: chainConfig.displayName,
    nativeBalance,
    nativeBalanceFormatted,
    nativeSymbol: chainConfig.nativeCurrency.symbol,
    tokens: tokenBalances,
    lastUpdated: new Date(),
  };
}

// Fetch balances across all enabled chains
export async function fetchMultiChainBalance(
  address: `0x${string}`
): Promise<MultiChainBalance> {
  const enabledChains = Object.values(CHAIN_CONFIGS).filter((chain) => chain.isEnabled);

  console.log(`[Balance] Fetching multi-chain balances for ${address}`);
  console.log(`[Balance] Enabled chains:`, enabledChains.map((c) => c.displayName));

  // Fetch balances from all chains in parallel
  const chainBalances = await Promise.all(
    enabledChains.map((chain) => fetchChainBalance(address, chain.chainId))
  );

  // Calculate total LAVA balance across all chains
  const totalLavaBalance = chainBalances.reduce((total, chain) => {
    const lavaToken = chain.tokens.find((t) => t.symbol === "LAVA");
    return total + (lavaToken?.balanceFormatted || 0);
  }, 0);

  console.log(`[Balance] Total LAVA across all chains:`, totalLavaBalance);

  return {
    address,
    chains: chainBalances,
    totalLavaBalance,
    lastUpdated: new Date(),
  };
}

// Fetch only LAVA token balance across chains (lighter query)
export async function fetchLavaBalance(
  address: `0x${string}`
): Promise<{ arbitrum: number; base: number; total: number }> {
  console.log(`[Balance] Fetching LAVA balances for ${address}`);

  const [arbitrumBalance, baseBalance] = await Promise.all([
    fetchTokenBalance(address, LAVA_TOKEN_ADDRESS, 42161),
    fetchTokenBalance(address, LAVA_TOKEN_ADDRESS, 8453),
  ]);

  const result = {
    arbitrum: arbitrumBalance.balanceFormatted,
    base: baseBalance.balanceFormatted,
    total: arbitrumBalance.balanceFormatted + baseBalance.balanceFormatted,
  };

  console.log(`[Balance] LAVA balances:`, result);

  return result;
}

// Cache for balance data
const balanceCache = new Map<string, { data: MultiChainBalance; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Fetch balances with caching
export async function fetchBalanceWithCache(
  address: `0x${string}`,
  forceRefresh = false
): Promise<MultiChainBalance> {
  const cacheKey = address.toLowerCase();
  const cached = balanceCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Balance] Returning cached balance for ${address}`);
    return cached.data;
  }

  const balance = await fetchMultiChainBalance(address);

  balanceCache.set(cacheKey, {
    data: balance,
    timestamp: Date.now(),
  });

  return balance;
}

// Clear balance cache
export function clearBalanceCache(address?: string): void {
  if (address) {
    balanceCache.delete(address.toLowerCase());
  } else {
    balanceCache.clear();
  }
}


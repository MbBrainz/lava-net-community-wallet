// Balance Service
// Fetches and manages wallet balances from Lava RPC
//
// Error Handling: All functions throw exceptions on failure.
// Callers should wrap in try/catch.

import { LAVA_CHAIN_CONFIG, formatLavaFromMicro } from "@/lib/chains/lava";
import { WalletBalance } from "@/lib/wallet";

// Custom error class for balance service errors
export class BalanceServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "BalanceServiceError";
  }
}

// REST API response types
interface BalanceResponse {
  balances: Array<{
    denom: string;
    amount: string;
  }>;
}

interface DelegationsResponse {
  delegation_responses: Array<{
    delegation: {
      delegator_address: string;
      validator_address: string;
      shares: string;
    };
    balance: {
      denom: string;
      amount: string;
    };
  }>;
}

interface RewardsResponse {
  rewards: Array<{
    validator_address: string;
    reward: Array<{
      denom: string;
      amount: string;
    }>;
  }>;
  total: Array<{
    denom: string;
    amount: string;
  }>;
}

// Cache for balance data
interface BalanceCache {
  data: WalletBalance;
  timestamp: number;
}

const balanceCache = new Map<string, BalanceCache>();
const CACHE_TTL = 30000; // 30 seconds

// Fetch available balance from REST API
async function fetchAvailableBalance(address: string): Promise<number> {
  const restUrl = LAVA_CHAIN_CONFIG.restUrl;
  if (!restUrl) {
    throw new BalanceServiceError("REST URL not configured");
  }

  const response = await fetch(
    `${restUrl}/cosmos/bank/v1beta1/balances/${address}`
  );

  if (!response.ok) {
    throw new BalanceServiceError(
      `Failed to fetch available balance: HTTP ${response.status}`
    );
  }

  const data: BalanceResponse = await response.json();
  const lavaBalance = data.balances.find(
    (b) => b.denom === LAVA_CHAIN_CONFIG.denom
  );

  return lavaBalance ? formatLavaFromMicro(lavaBalance.amount) : 0;
}

// Fetch staked balance from REST API
async function fetchStakedBalance(address: string): Promise<number> {
  const restUrl = LAVA_CHAIN_CONFIG.restUrl;
  if (!restUrl) {
    throw new BalanceServiceError("REST URL not configured");
  }

  const response = await fetch(
    `${restUrl}/cosmos/staking/v1beta1/delegations/${address}`
  );

  if (!response.ok) {
    throw new BalanceServiceError(
      `Failed to fetch staked balance: HTTP ${response.status}`
    );
  }

  const data: DelegationsResponse = await response.json();
  const totalStaked = data.delegation_responses.reduce((sum, del) => {
    if (del.balance.denom === LAVA_CHAIN_CONFIG.denom) {
      return sum + parseInt(del.balance.amount, 10);
    }
    return sum;
  }, 0);

  return formatLavaFromMicro(totalStaked);
}

// Fetch pending rewards from REST API
async function fetchRewards(address: string): Promise<number> {
  const restUrl = LAVA_CHAIN_CONFIG.restUrl;
  if (!restUrl) {
    throw new BalanceServiceError("REST URL not configured");
  }

  const response = await fetch(
    `${restUrl}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
  );

  if (!response.ok) {
    throw new BalanceServiceError(
      `Failed to fetch rewards: HTTP ${response.status}`
    );
  }

  const data: RewardsResponse = await response.json();
  const lavaReward = data.total.find(
    (r) => r.denom === LAVA_CHAIN_CONFIG.denom
  );

  // Rewards come as decimal strings, need to parse and convert
  return lavaReward
    ? formatLavaFromMicro(Math.floor(parseFloat(lavaReward.amount)))
    : 0;
}

// Main function to fetch complete balance
export async function fetchLavaBalance(
  address: string,
  forceRefresh = false
): Promise<WalletBalance> {
  // Check cache first
  const cacheKey = `lava:${address}`;
  const cached = balanceCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch all balances in parallel
  const [available, staked, rewards] = await Promise.all([
    fetchAvailableBalance(address),
    fetchStakedBalance(address),
    fetchRewards(address),
  ]);

  const balance: WalletBalance = {
    chainName: "lava",
    chainType: "cosmos",
    address,
    available,
    staked,
    rewards,
    total: available + staked + rewards,
    denom: LAVA_CHAIN_CONFIG.displayDenom,
    lastUpdated: new Date(),
  };

  // Update cache
  balanceCache.set(cacheKey, {
    data: balance,
    timestamp: Date.now(),
  });

  return balance;
}

// Clear balance cache for an address
export function clearBalanceCache(address?: string): void {
  if (address) {
    balanceCache.delete(`lava:${address}`);
  } else {
    balanceCache.clear();
  }
}

// Subscribe to balance updates (polling-based for now)
export function subscribeToBalance(
  address: string,
  callback: (balance: WalletBalance) => void,
  intervalMs = 30000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const balance = await fetchLavaBalance(address, true);
      callback(balance);
    } catch (error) {
      console.error("[BalanceService] Polling error:", error);
      // Continue polling even on error
    }

    if (isActive) {
      setTimeout(poll, intervalMs);
    }
  };

  // Initial fetch
  poll();

  // Return unsubscribe function
  return () => {
    isActive = false;
  };
}

// Balance Types
// Type definitions for token and chain balances
// Note: Actual balance fetching is now handled by Dynamic SDK's useTokenBalances hook
// See: src/lib/hooks/useLavaBalance.ts

// Token balance interface
export interface TokenBalance {
  symbol: string;
  name: string;
  balance: bigint;
  balanceFormatted: number;
  decimals: number;
  contractAddress: `0x${string}`;
  logoUrl?: string;
}

// Balance for a single chain
export interface ChainBalance {
  chainId: number;
  chainName: string;
  nativeBalance: bigint;
  nativeBalanceFormatted: number;
  nativeSymbol: string;
  tokens: TokenBalance[];
  lastUpdated: Date;
}

// Multi-chain balance summary
export interface MultiChainBalance {
  address: string;
  chains: ChainBalance[];
  totalLavaBalance: number;
  lastUpdated: Date;
}

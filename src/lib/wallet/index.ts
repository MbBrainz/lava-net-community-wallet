// Wallet Service Index
// Unified wallet interface for EVM chains

import { type ChainId } from "@/lib/chains/registry";

// Re-export balance types
export type {
  TokenBalance,
  ChainBalance,
  MultiChainBalance,
} from "@/lib/services/balance";

// Address validation for EVM
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Transaction status enum
export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
}

// Generic transaction interface
export interface WalletTransaction {
  id: string;
  hash: string;
  type: "send" | "receive" | "swap" | "approve" | "unknown";
  status: TransactionStatus;
  amount: number;
  tokenSymbol: string;
  tokenAddress?: `0x${string}`;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  chainId: ChainId;
  chainName: string;
  fee?: number;
  blockNumber?: number;
}

// Simplified balance for UI display
export interface WalletBalance {
  address: string;
  // Native ETH balances per chain
  nativeBalances: {
    chainId: ChainId;
    chainName: string;
    balance: number;
    symbol: string;
  }[];
  // LAVA token balances per chain
  lavaBalances: {
    chainId: ChainId;
    chainName: string;
    balance: number;
  }[];
  // Totals
  totalLava: number;
  totalNativeEth: number;
  lastUpdated: Date;
}

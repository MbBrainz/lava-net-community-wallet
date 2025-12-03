// Wallet Service Index
// Unified wallet interface that abstracts over different chain types

export * from "./cosmos";

import { ChainType, getChainByName } from "@/lib/chains/registry";
import { isValidLavaAddress } from "@/lib/chains/lava";

// Address validation based on chain type
export function isValidAddress(address: string, chainName: string): boolean {
  const chain = getChainByName(chainName);
  if (!chain) return false;

  if (chain.type === "cosmos") {
    // For Lava specifically
    if (chain.name === "lava") {
      return isValidLavaAddress(address);
    }
    // Generic Cosmos validation (basic check)
    return address.startsWith(chain.bech32Prefix || "") && address.length > 10;
  }

  if (chain.type === "evm") {
    // EVM address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  return false;
}

// Get wallet type for a chain
export function getWalletType(chainName: string): ChainType | null {
  const chain = getChainByName(chainName);
  return chain?.type || null;
}

// Transaction status enum
export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
}

// Generic transaction interface (used across all chains)
export interface WalletTransaction {
  id: string;
  hash: string;
  type: "send" | "receive" | "stake" | "unstake" | "claim" | "unknown";
  status: TransactionStatus;
  amount: number;
  denom: string;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  chainName: string;
  chainType: ChainType;
  memo?: string;
  fee?: number;
  blockHeight?: number;
}

// Balance interface
export interface WalletBalance {
  chainName: string;
  chainType: ChainType;
  address: string;
  available: number;
  staked: number;
  rewards: number;
  total: number;
  denom: string;
  lastUpdated: Date;
}


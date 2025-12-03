// Lava Network Chain Configuration
// This file defines the Lava mainnet chain parameters for use with Dynamic SDK and CosmJS

export interface LavaChainConfig {
  chainId: string;
  chainName: string;
  rpcUrl: string;
  restUrl: string;
  bech32Prefix: string;
  denom: string;
  displayDenom: string;
  decimals: number;
  coinGeckoId?: string;
  explorerUrl: string;
  gasPrice: string;
}

export const LAVA_CHAIN_CONFIG: LavaChainConfig = {
  chainId: process.env.NEXT_PUBLIC_LAVA_CHAIN_ID || "lava-mainnet-1",
  chainName: "Lava Network",
  rpcUrl: process.env.NEXT_PUBLIC_LAVA_RPC_URL || "",
  restUrl: process.env.NEXT_PUBLIC_LAVA_REST_URL || "",
  bech32Prefix: "lava",
  denom: "ulava",
  displayDenom: "LAVA",
  decimals: 6,
  coinGeckoId: "lava-network",
  explorerUrl: "https://lava.explorers.guru",
  gasPrice: "0.025ulava",
};

// Convert ulava to LAVA (human readable)
export function formatLavaFromMicro(microAmount: string | number): number {
  const amount = typeof microAmount === "string" ? parseInt(microAmount, 10) : microAmount;
  return amount / Math.pow(10, LAVA_CHAIN_CONFIG.decimals);
}

// Convert LAVA to ulava (for transactions)
export function toLavaMicro(amount: number): string {
  return Math.floor(amount * Math.pow(10, LAVA_CHAIN_CONFIG.decimals)).toString();
}

// Validate Lava address format
export function isValidLavaAddress(address: string): boolean {
  if (!address) return false;
  return address.startsWith(LAVA_CHAIN_CONFIG.bech32Prefix) && address.length === 44;
}

// Get explorer URL for transaction
export function getTxExplorerUrl(txHash: string): string {
  return `${LAVA_CHAIN_CONFIG.explorerUrl}/transaction/${txHash}`;
}

// Get explorer URL for address
export function getAddressExplorerUrl(address: string): string {
  return `${LAVA_CHAIN_CONFIG.explorerUrl}/account/${address}`;
}


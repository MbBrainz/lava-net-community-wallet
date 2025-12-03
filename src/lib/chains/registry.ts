// Chain Registry
// Unified interface for managing multiple chain configurations
// Designed for easy EVM chain addition in the near future

export type ChainType = "cosmos" | "evm";

export interface ChainConfig {
  id: string;
  type: ChainType;
  name: string;
  displayName: string;
  rpcUrl: string;
  restUrl?: string; // Cosmos only
  nativeDenom: string;
  displayDenom: string;
  decimals: number;
  bech32Prefix?: string; // Cosmos only
  chainIdNumber?: number; // EVM only
  explorerUrl: string;
  iconPath: string;
  color: string;
  isEnabled: boolean;
}

// Registry of all supported chains
export const CHAIN_REGISTRY: Record<string, ChainConfig> = {
  lava: {
    id: "lava-mainnet-1",
    type: "cosmos",
    name: "lava",
    displayName: "Lava Network",
    rpcUrl: process.env.NEXT_PUBLIC_LAVA_RPC_URL || "",
    restUrl: process.env.NEXT_PUBLIC_LAVA_REST_URL || "",
    nativeDenom: "ulava",
    displayDenom: "LAVA",
    decimals: 6,
    bech32Prefix: "lava",
    explorerUrl: "https://lava.explorers.guru",
    iconPath: "/lava-brand-kit/logos/logo-symbol-color.png",
    color: "#FF3900",
    isEnabled: true,
  },
  // EVM chains will be added here soon
  // ethereum: {
  //   id: "1",
  //   type: "evm",
  //   name: "ethereum",
  //   displayName: "Ethereum",
  //   rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC_URL || "",
  //   nativeDenom: "wei",
  //   displayDenom: "ETH",
  //   decimals: 18,
  //   chainIdNumber: 1,
  //   explorerUrl: "https://etherscan.io",
  //   iconPath: "/icons/ethereum.svg",
  //   color: "#627EEA",
  //   isEnabled: false,
  // },
};

// Get all enabled chains
export function getEnabledChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY).filter((chain) => chain.isEnabled);
}

// Get chain by ID
export function getChainById(chainId: string): ChainConfig | undefined {
  return Object.values(CHAIN_REGISTRY).find((chain) => chain.id === chainId);
}

// Get chain by name
export function getChainByName(name: string): ChainConfig | undefined {
  return CHAIN_REGISTRY[name.toLowerCase()];
}

// Get all Cosmos chains
export function getCosmosChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY).filter(
    (chain) => chain.type === "cosmos" && chain.isEnabled
  );
}

// Get all EVM chains (for future use)
export function getEvmChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY).filter(
    (chain) => chain.type === "evm" && chain.isEnabled
  );
}

// Format amount from smallest unit to display unit
export function formatAmount(amount: string | number, chainName: string): number {
  const chain = getChainByName(chainName);
  if (!chain) return 0;
  const value = typeof amount === "string" ? parseInt(amount, 10) : amount;
  return value / Math.pow(10, chain.decimals);
}

// Convert display amount to smallest unit
export function toSmallestUnit(amount: number, chainName: string): string {
  const chain = getChainByName(chainName);
  if (!chain) return "0";
  return Math.floor(amount * Math.pow(10, chain.decimals)).toString();
}


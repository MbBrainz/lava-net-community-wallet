// Chain Registry
// Configuration for supported EVM chains and tokens

// LAVA Token contract address (same on Arbitrum and Base)
export const LAVA_TOKEN_ADDRESS = "0x11e969e9b3f89cb16d686a03cd8508c9fc0361af" as const;

// Standard ERC20 ABI for balance queries
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export type ChainId = 42161 | 8453; // Arbitrum One | Base

export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  displayName: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  iconPath: string;
  color: string;
  isEnabled: boolean;
  isDefault?: boolean;
  tokens: TokenConfig[];
}

// Chain configurations
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  // Arbitrum One (Main Chain)
  42161: {
    chainId: 42161,
    name: "arbitrum",
    displayName: "Arbitrum One",
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://arbiscan.io",
    iconPath: "/icons/arbitrum.svg",
    color: "#12AAFF",
    isEnabled: true,
    isDefault: true,
    tokens: [
      {
        address: LAVA_TOKEN_ADDRESS,
        symbol: "LAVA",
        name: "Lava Token",
        decimals: 18,
        logoUrl: "/lava-brand-kit/logos/logo-symbol-color.png",
      },
    ],
  },
  // Base
  8453: {
    chainId: 8453,
    name: "base",
    displayName: "Base",
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://basescan.org",
    iconPath: "/icons/base.svg",
    color: "#0052FF",
    isEnabled: true,
    tokens: [
      {
        address: LAVA_TOKEN_ADDRESS,
        symbol: "LAVA",
        name: "Lava Token",
        decimals: 18,
        logoUrl: "/lava-brand-kit/logos/logo-symbol-color.png",
      },
    ],
  },
};

// Get all enabled chains
export function getEnabledChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter((chain) => chain.isEnabled);
}

// Get the default chain
export function getDefaultChain(): ChainConfig {
  return Object.values(CHAIN_CONFIGS).find((chain) => chain.isDefault) || CHAIN_CONFIGS[42161];
}

// Get chain by ID
export function getChainById(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId as ChainId];
}

// Get chain by name
export function getChainByName(name: string): ChainConfig | undefined {
  return Object.values(CHAIN_CONFIGS).find(
    (chain) => chain.name.toLowerCase() === name.toLowerCase()
  );
}

// Format amount from smallest unit (wei) to display unit
export function formatFromWei(amount: bigint, decimals: number = 18): number {
  return Number(amount) / Math.pow(10, decimals);
}

// Convert display amount to wei
export function toWei(amount: number, decimals: number = 18): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

// Get explorer URL for transaction
export function getTxExplorerUrl(chainId: ChainId, txHash: string): string {
  const chain = CHAIN_CONFIGS[chainId];
  return `${chain.blockExplorerUrl}/tx/${txHash}`;
}

// Get explorer URL for address
export function getAddressExplorerUrl(chainId: ChainId, address: string): string {
  const chain = CHAIN_CONFIGS[chainId];
  return `${chain.blockExplorerUrl}/address/${address}`;
}

// Get explorer URL for token
export function getTokenExplorerUrl(chainId: ChainId, tokenAddress: string): string {
  const chain = CHAIN_CONFIGS[chainId];
  return `${chain.blockExplorerUrl}/token/${tokenAddress}`;
}

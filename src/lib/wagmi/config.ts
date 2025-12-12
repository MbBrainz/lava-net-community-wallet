// Wagmi Configuration for LI.FI Widget Integration
// This config bridges Dynamic embedded wallets with wagmi

import { createConfig, http } from "wagmi";
import { arbitrum, base } from "wagmi/chains";
import type { Chain } from "wagmi/chains";

// Define supported chains - configurable for future expansion
export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [arbitrum, base];

// Chain IDs for easy reference
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);

// Create wagmi config
// Note: Connectors are handled by DynamicWagmiConnector
export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc"
    ),
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
    ),
  },
});

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

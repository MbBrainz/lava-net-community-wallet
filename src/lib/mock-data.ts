// Mock data for UI demonstration
// All values are fake and for display purposes only
//
// NOTE: Transaction type and mockTransactions have been removed.
// Use WalletTransaction from @/lib/wallet for transaction types.

export interface CommunityPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  label: "Announcement" | "Event" | "Update" | "Governance";
  timestamp: Date;
  isPinned: boolean;
  imageUrl?: string;
}

export interface Notification {
  id: string;
  type: "community" | "app" | "transaction";
  title: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  linkTo?: string;
}

export interface DeFiApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  chains: string[];
  riskLevel: "Low" | "Medium" | "High";
  category: "Staking" | "Lending" | "DEX" | "Yield";
  apy?: string;
}

// Mock LAVA price
export const MOCK_LAVA_PRICE = 0.0847;

// Mock community posts
export const mockCommunityPosts: CommunityPost[] = [
  {
    id: "1",
    title: "LAVA Mainnet Launch Update",
    summary:
      "We're excited to announce the next phase of our mainnet rollout with enhanced staking features.",
    content: `We're thrilled to share the latest updates on our mainnet journey. After months of rigorous testing and community feedback, we're rolling out enhanced staking features that will revolutionize how you interact with the Lava Network.\n\nKey highlights include:\n- Improved validator selection\n- Reduced unbonding periods\n- Enhanced reward distribution\n\nStay tuned for more details in the coming weeks!`,
    label: "Announcement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    isPinned: true,
    imageUrl: "/lava-brand-kit/graphics/graphic-road-to-mainnet.webp",
  },
  {
    id: "2",
    title: "Community AMA This Friday",
    summary: "Join us for a live AMA session with the core team. Submit your questions now!",
    content: `Mark your calendars! This Friday at 4 PM UTC, the Lava core team will be hosting a live AMA session on Discord.\n\nTopics we'll cover:\n- Roadmap updates\n- Technical deep-dives\n- Community governance proposals\n\nSubmit your questions in advance on our Discord channel.`,
    label: "Event",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isPinned: false,
  },
  {
    id: "3",
    title: "Governance Proposal #42: Fee Structure Update",
    summary: "Vote on the new fee distribution model for network validators and delegators.",
    content: `Governance Proposal #42 is now live for voting. This proposal addresses the fee structure for validators and delegators.\n\nProposed changes:\n- Reduce minimum commission from 5% to 3%\n- Implement tiered rewards based on delegation amount\n- New community pool allocation\n\nVoting ends in 7 days.`,
    label: "Governance",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    isPinned: false,
  },
  {
    id: "4",
    title: "New DeFi Integrations Live",
    summary: "LAVA is now available on three new DeFi platforms across multiple chains.",
    content: `We're excited to announce that LAVA tokens are now integrated with:\n\n1. **AaveLend** - Lending and borrowing on Base\n2. **SushiSwap** - DEX trading on Arbitrum\n3. **Curve Finance** - Stable pools on Ethereum\n\nExplore these new opportunities through the LAVA tab in your wallet.`,
    label: "Update",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    isPinned: false,
    imageUrl: "/lava-brand-kit/graphics/graphic-future-is-modular.webp",
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "community",
    title: "New Announcement",
    body: "LAVA Mainnet Launch Update posted",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isRead: false,
    linkTo: "/community/1",
  },
  {
    id: "2",
    type: "app",
    title: "App Update",
    body: "New features available! Check out the redesigned LAVA tab.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    isRead: false,
  },
  {
    id: "3",
    type: "community",
    title: "Event Reminder",
    body: "Community AMA starts in 24 hours",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
    linkTo: "/community/2",
  },
  {
    id: "4",
    type: "community",
    title: "Governance Vote",
    body: "New proposal requires your attention",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    isRead: true,
    linkTo: "/community/3",
  },
];

// Mock DeFi apps directory
export const mockDeFiApps: DeFiApp[] = [
  {
    id: "1",
    name: "Lava Staking",
    description: "Stake your LAVA natively to earn rewards and secure the network",
    url: "https://staking.lavanet.xyz",
    icon: "🌋",
    chains: ["Lava"],
    riskLevel: "Low",
    category: "Staking",
    apy: "12-18%",
  },
  {
    id: "2",
    name: "AaveLend",
    description: "Supply LAVA as collateral and borrow against your position",
    url: "https://app.aave.com",
    icon: "👻",
    chains: ["Ethereum", "Base", "Arbitrum"],
    riskLevel: "Low",
    category: "Lending",
    apy: "4-8%",
  },
  {
    id: "3",
    name: "Uniswap",
    description: "Trade LAVA and provide liquidity on the leading DEX",
    url: "https://app.uniswap.org",
    icon: "🦄",
    chains: ["Ethereum", "Base", "Arbitrum", "Optimism", "Polygon"],
    riskLevel: "Medium",
    category: "DEX",
  },
  {
    id: "4",
    name: "Curve Finance",
    description: "Stable swaps and concentrated liquidity pools for LAVA",
    url: "https://curve.fi",
    icon: "🌀",
    chains: ["Ethereum"],
    riskLevel: "Medium",
    category: "DEX",
    apy: "6-12%",
  },
  {
    id: "5",
    name: "Yearn Vaults",
    description: "Automated yield optimization strategies for LAVA holders",
    url: "https://yearn.fi",
    icon: "🏦",
    chains: ["Ethereum", "Arbitrum"],
    riskLevel: "High",
    category: "Yield",
    apy: "15-25%",
  },
  {
    id: "6",
    name: "Compound",
    description: "Earn interest and borrow assets with LAVA collateral",
    url: "https://compound.finance",
    icon: "💚",
    chains: ["Ethereum", "Base"],
    riskLevel: "Low",
    category: "Lending",
    apy: "3-6%",
  },
];

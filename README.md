# Lava Community Wallet

A mobile-first Progressive Web App (PWA) for the Lava Network community. This demo showcases the user interface and experience for managing LAVA tokens, staking, and connecting to DeFi applications.

![Lava Wallet](./public/lava-brand-kit/graphics/graphic-lava-101.webp)

## Features

- **📱 Mobile-First PWA** - Installable on iOS and Android with native app experience
- **💰 LAVA Balance Tracking** - View your total LAVA position across all chains
- **🔒 Native Staking UI** - Stake and unstake LAVA on the Lava Network
- **🌐 DeFi Directory** - Curated list of yield opportunities
- **📢 Community Feed** - Stay updated with announcements and events
- **🔔 Push Notifications** - Get notified about important updates
- **🎨 Dark/Light Theme** - Automatic theme switching with manual override

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **PWA**: Serwist (next-pwa successor)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production (required for PWA features)
pnpm build

# Start production server
pnpm start
```

### Development

The app runs at `http://localhost:3000` by default.

**Note**: PWA features (service worker, offline support) are disabled in development mode to prevent caching issues. Build and run production to test PWA features.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home - Balance overview
│   ├── lava/              # LAVA tab - Staking & DeFi
│   ├── community/         # Community feed
│   ├── notifications/     # Notification center
│   ├── settings/          # User settings
│   └── offline/           # Offline fallback page
├── components/
│   ├── home/              # Home page components
│   ├── navigation/        # Bottom nav
│   ├── pwa/               # Install prompts
│   └── ui/                # Reusable UI components
├── context/               # React context providers
└── lib/                   # Utilities and mock data
```

## Mock Data

All wallet connections, blockchain queries, and API calls are **mocked** for demonstration purposes. The app simulates:

- User authentication
- LAVA balances across multiple chains
- Transaction history
- Staking positions
- Community posts and notifications

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the install banner or menu
3. Select "Install app"

## Brand Assets

The app uses official Lava Network brand assets located in `/public/lava-brand-kit/`:

- **Logos** - Various logo formats
- **Mascots** - Character illustrations
- **Graphics** - Marketing visuals
- **Colors** - Brand color palette

## License

This is a demo application created for UI/UX demonstration purposes.

## Links

- [Lava Network](https://lavanet.xyz)
- [Documentation](https://docs.lavanet.xyz)
- [Discord](https://discord.gg/lavanetwork)
- [Twitter](https://x.com/lavanetxyz)


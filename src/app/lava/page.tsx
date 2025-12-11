"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  ExternalLink,
  Info,
  Zap,
  RefreshCw,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { FEATURES } from "@/lib/features";
import { useApp } from "@/context/AppContext";
import { useSwap } from "@/context/SwapContext";
import { useLavaPrice, formatLavaPrice, formatUsdValue, calculateUsdValue } from "@/lib/hooks";
import { formatTokenAmount, getChainColor } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet, Modal } from "@/components/ui/Modal";
import { LAVA_TOKEN_ADDRESS, getTokenExplorerUrl } from "@/lib/chains/registry";

export default function LavaPage() {
  const {
    totalLavaBalance,
    arbitrumLavaBalance,
    baseLavaBalance,
    deFiApps,
    isOffline,
    refreshBalance,
    isRefreshing,
  } = useApp();

  const { price: lavaPrice, isLoading: isPriceLoading } = useLavaPrice();
  const { openSwap } = useSwap();

  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const riskColors = {
    Low: "success",
    Medium: "warning",
    High: "danger",
  } as const;

  // Calculate USD values
  const totalUsdValue = calculateUsdValue(totalLavaBalance, lavaPrice);

  // Chain balances for display
  const chainBalances = [
    {
      name: "Arbitrum",
      chainId: 42161,
      balance: arbitrumLavaBalance,
      icon: "🔷",
      color: getChainColor("arbitrum"),
    },
    {
      name: "Base",
      chainId: 8453,
      balance: baseLavaBalance,
      icon: "🔵",
      color: getChainColor("base"),
    },
  ];

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lava-gradient flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LAVA</h1>
              <p className="text-sm text-grey-200">Manage your LAVA tokens</p>
            </div>
          </div>
          <button
            onClick={() => refreshBalance()}
            disabled={isRefreshing || isOffline}
            className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-5">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-grey-200">Total LAVA</p>
                <p className="text-2xl font-bold text-white">
                  {formatTokenAmount(totalLavaBalance)}
                </p>
                <p className="text-sm text-grey-100">
                  {formatUsdValue(totalUsdValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-grey-200 mb-1">Price</p>
                <p className="text-lg font-semibold text-white">
                  {isPriceLoading ? "..." : formatLavaPrice(lavaPrice)}
                </p>
              </div>
            </div>

            {/* Chain breakdown */}
            <div className="space-y-2">
              {chainBalances.map((chain) => (
                <div
                  key={chain.chainId}
                  className="flex items-center justify-between py-2 px-3 bg-grey-650/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{chain.icon}</span>
                    <span className="text-sm text-grey-100">{chain.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">
                      {formatTokenAmount(chain.balance)} LAVA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => openSwap({ defaultToLava: true, title: "Get LAVA" })}
              variant="primary"
              className="flex-col h-auto py-4"
              disabled={isOffline}
            >
              <ArrowRightLeft className="w-5 h-5 mb-1" />
              <span>Get LAVA</span>
            </Button>
            <Button
              onClick={() => setShowBridgeModal(true)}
              variant="secondary"
              className="flex-col h-auto py-4"
              disabled={isOffline || totalLavaBalance <= 0}
            >
              <ArrowRightLeft className="w-5 h-5 mb-1" />
              <span>Bridge</span>
            </Button>
            <a
              href={getTokenExplorerUrl(42161, LAVA_TOKEN_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="secondary"
                className="flex-col h-auto py-4 w-full"
              >
                <ExternalLink className="w-5 h-5 mb-1" />
                <span>View Token</span>
              </Button>
            </a>
          </div>
        </motion.section>

        {/* Token Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card variant="glass">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-grey-200 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">About LAVA Token</p>
                <p className="text-xs text-grey-200">
                  LAVA is the native token of Lava Network, available on Arbitrum and Base.
                  Contract: <code className="text-lava-orange">0x11e9...1af</code>
                </p>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* DeFi Directory */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Use LAVA in DeFi</h2>
              {!FEATURES.DEFI && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-grey-650/90 rounded-full border border-white/10">
                  <Clock className="w-3 h-3 text-lava-orange" />
                  <span className="text-[10px] font-medium text-grey-100">Coming Soon</span>
                </span>
              )}
            </div>
            {FEATURES.DEFI && (
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-sm text-lava-orange hover:text-lava-spanish-orange flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                <span>How to connect</span>
              </button>
            )}
          </div>

          <div className={`space-y-3 ${!FEATURES.DEFI ? "opacity-50 pointer-events-none" : ""}`}>
            {deFiApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card
                  variant="glass"
                  padding="none"
                  onClick={FEATURES.DEFI ? () => window.open(app.url, "_blank") : undefined}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* App icon */}
                    <div className="w-12 h-12 rounded-xl bg-grey-425 flex items-center justify-center text-2xl">
                      {app.icon}
                    </div>

                    {/* App info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{app.name}</h3>
                        <Badge
                          variant={riskColors[app.riskLevel]}
                          size="sm"
                        >
                          {app.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-grey-200 line-clamp-1">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {app.apy && (
                          <span className="text-xs text-green-400 font-medium">
                            {app.apy} APY
                          </span>
                        )}
                        <span className="text-xs text-grey-200">
                          {app.chains.slice(0, 3).join(" • ")}
                          {app.chains.length > 3 && ` +${app.chains.length - 3}`}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ExternalLink className="w-5 h-5 text-grey-200 flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Bridge Modal */}
      <Sheet
        isOpen={showBridgeModal}
        onClose={() => setShowBridgeModal(false)}
        title="Bridge LAVA"
      >
        <div className="space-y-5">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-grey-650 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-grey-200" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Bridge Coming Soon
            </h3>
            <p className="text-sm text-grey-200">
              Cross-chain bridging for LAVA will be available soon. In the meantime,
              you can use third-party bridges.
            </p>
          </div>

          {/* External bridges */}
          <div className="space-y-2">
            <p className="text-sm text-grey-200">Popular bridges:</p>
            {[
              { name: "Arbitrum Bridge", url: "https://bridge.arbitrum.io" },
              { name: "Base Bridge", url: "https://bridge.base.org" },
            ].map((bridge) => (
              <a
                key={bridge.name}
                href={bridge.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-grey-650/50 rounded-xl hover:bg-grey-650 transition-colors"
              >
                <span className="text-sm text-white">{bridge.name}</span>
                <ExternalLink className="w-4 h-4 text-grey-200" />
              </a>
            ))}
          </div>

          <Button fullWidth variant="secondary" onClick={() => setShowBridgeModal(false)}>
            Close
          </Button>
        </div>
      </Sheet>

      {/* How to Connect Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Connect Lava Wallet to dApps"
      >
        <div className="space-y-5">
          {/* Intro */}
          <p className="text-sm text-grey-200">
            Your embedded wallet can connect to any dApp that supports WalletConnect.
            Here&apos;s how:
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Open dApp in Browser",
                desc: "Navigate to Aave, Uniswap, or any supported dApp",
                icon: "🌐",
              },
              {
                step: 2,
                title: "Click Connect Wallet",
                desc: 'Look for "WalletConnect" option',
                icon: "🔗",
              },
              {
                step: 3,
                title: "Scan QR or Copy Link",
                desc: "Use your mobile wallet to scan or copy the WC link",
                icon: "📱",
              },
              {
                step: 4,
                title: "Approve Connection",
                desc: "Review and approve the connection request",
                icon: "✅",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-lava-orange/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lava-orange font-bold">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-grey-200 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro tip */}
          <div className="p-3 bg-lava-orange/10 border border-lava-orange/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-lava-orange" />
              <span className="text-sm font-medium text-white">Pro Tip</span>
            </div>
            <p className="text-xs text-grey-200">
              Make sure you&apos;re connected to the right network (Arbitrum or Base)
              before interacting with dApps.
            </p>
          </div>

          <Button fullWidth onClick={() => setShowHelpModal(false)}>
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
}

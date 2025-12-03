"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  ExternalLink,
  Info,
  ChevronRight,
  Lock,
  Unlock,
  Gift,
  Shield,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatLavaAmount, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet, Modal } from "@/components/ui/Modal";

export default function LavaPage() {
  const {
    totalLava,
    totalUsdValue,
    availableLava,
    stakedLava,
    rewardsLava,
    stakedPercentage,
    deFiApps,
    isOffline,
  } = useApp();

  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");

  const riskColors = {
    Low: "success",
    Medium: "warning",
    High: "danger",
  } as const;

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lava-gradient flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">LAVA</h1>
            <p className="text-sm text-grey-200">Manage & grow your position</p>
          </div>
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
                  {formatLavaAmount(totalLava)}
                </p>
                <p className="text-sm text-grey-100">
                  {formatCurrency(totalUsdValue)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-lava-orange" />
                  <span className="text-sm text-grey-200">Staked</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {stakedPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-grey-200">
                  {formatLavaAmount(stakedLava)} LAVA
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-grey-650 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stakedPercentage}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-lava-gradient rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-grey-200">
              <span>Available: {formatLavaAmount(availableLava)}</span>
              <span>Staked: {formatLavaAmount(stakedLava)}</span>
            </div>
          </Card>
        </motion.div>

        {/* Native Staking Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Native Staking</h2>
            <Badge variant="lava">12-18% APY</Badge>
          </div>

          <Card variant="glass">
            <div className="space-y-4">
              {/* Rewards */}
              {rewardsLava > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Claimable Rewards
                      </p>
                      <p className="text-xs text-grey-200">
                        Accumulated staking rewards
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">
                      +{formatLavaAmount(rewardsLava)}
                    </p>
                    <Button size="sm" className="mt-1" disabled={isOffline}>
                      Claim
                    </Button>
                  </div>
                </div>
              )}

              {/* Staking Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowStakeModal(true)}
                  className="flex-col h-auto py-4"
                  disabled={availableLava <= 0 || isOffline}
                >
                  <Lock className="w-5 h-5 mb-1" />
                  <span>Stake</span>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-col h-auto py-4"
                  disabled={stakedLava <= 0 || isOffline}
                >
                  <Unlock className="w-5 h-5 mb-1" />
                  <span>Unstake</span>
                </Button>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-3 bg-grey-650/50 rounded-xl">
                <Info className="w-5 h-5 text-grey-200 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-grey-200">
                  Staking LAVA secures the network and earns you rewards. 
                  The unbonding period is 21 days.
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
            <h2 className="text-lg font-semibold text-white">Use LAVA in DeFi</h2>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-sm text-lava-orange hover:text-lava-spanish-orange flex items-center gap-1"
            >
              <Info className="w-4 h-4" />
              <span>How to connect</span>
            </button>
          </div>

          <div className="space-y-3">
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
                  onClick={() => window.open(app.url, "_blank")}
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

      {/* Stake Modal */}
      <Sheet
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        title="Stake LAVA"
      >
        <div className="space-y-5">
          {/* Amount input */}
          <div>
            <label className="block text-sm text-grey-200 mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-grey-650 border border-grey-425 rounded-xl px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-lava-orange transition-colors"
              />
              <button
                onClick={() => setStakeAmount(availableLava.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lava-orange font-semibold"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-grey-200 mt-2">
              Available: {formatLavaAmount(availableLava)} LAVA
            </p>
          </div>

          {/* Validator selection (mock) */}
          <div>
            <label className="block text-sm text-grey-200 mb-2">Validator</label>
            <div className="flex items-center gap-3 p-3 bg-grey-650 border border-grey-425 rounded-xl">
              <div className="w-10 h-10 bg-lava-orange/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-lava-orange" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Lava Foundation</p>
                <p className="text-xs text-grey-200">5% commission • 99.9% uptime</p>
              </div>
              <ChevronRight className="w-5 h-5 text-grey-200" />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-grey-650/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">Estimated APY</span>
              <span className="text-green-400 font-medium">~15.2%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">Unbonding Period</span>
              <span className="text-white">21 days</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-lava-yellow/10 border border-lava-yellow/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-lava-yellow flex-shrink-0" />
            <p className="text-xs text-grey-100">
              Staking transactions will be signed using your embedded wallet.
              Once staked, tokens are locked for the unbonding period.
            </p>
          </div>

          <Button fullWidth size="lg" disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}>
            Stake LAVA
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
            Your Lava Wallet can connect to any dApp that supports WalletConnect.
            Here&apos;s how:
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Install Lava Wallet",
                desc: "Add this app to your home screen for the best experience",
                icon: "📱",
              },
              {
                step: 2,
                title: "Open dApp in Browser",
                desc: "Navigate to Aave, Uniswap, or any supported dApp in Safari/Chrome",
                icon: "🌐",
              },
              {
                step: 3,
                title: "Click Connect Wallet",
                desc: 'Look for "WalletConnect" or "Lava Wallet" option',
                icon: "🔗",
              },
              {
                step: 4,
                title: "Approve in Lava App",
                desc: "The app will open for you to approve the connection",
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
              Once connected, your Lava Wallet will automatically sign transactions
              when you approve them in the app.
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

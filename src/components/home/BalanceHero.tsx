"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ChevronDown, Flame, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatLavaAmount, formatCurrency, getChainColor, timeAgo } from "@/lib/utils";
import { Sheet } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface BalanceHeroProps {
  onSend?: () => void;
  onReceive?: () => void;
}

export function BalanceHero({ onSend, onReceive }: BalanceHeroProps) {
  const {
    totalLava,
    totalUsdValue,
    availableLava,
    stakedLava,
    rewardsLava,
    lavaPrice,
    lastUpdated,
    refreshBalance,
    isRefreshing,
    isOffline,
    balance,
  } = useApp();

  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async () => {
    if (isOffline) return;
    await refreshBalance();
  };

  // Build balance breakdown for the sheet
  const balanceBreakdown = [
    {
      type: "Available",
      amount: availableLava,
      description: "Ready to send or stake",
    },
    {
      type: "Staked",
      amount: stakedLava,
      description: "Earning rewards",
    },
    {
      type: "Rewards",
      amount: rewardsLava,
      description: "Claimable",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-lava-orange/20 via-lava-spanish-orange/10 to-transparent rounded-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-lava-orange/30 rounded-full blur-3xl" />
        
        <div className="relative p-6 rounded-3xl border border-lava-orange/20 bg-grey-550/50 backdrop-blur-xl">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lava-gradient flex items-center justify-center shadow-lg">
                <Image
                  src="/lava-brand-kit/logos/logo-symbol-white.png"
                  alt="LAVA"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h2 className="text-sm font-medium text-grey-100">Total LAVA Position</h2>
                <p className="text-xs text-grey-200">
                  ${lavaPrice.toFixed(4)} per LAVA
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isOffline}
              className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Main balance */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tight">
                {formatLavaAmount(totalLava)}
              </span>
              <span className="text-xl font-semibold text-lava-orange">LAVA</span>
            </div>
            <p className="text-lg text-grey-100 mt-1">
              {formatCurrency(totalUsdValue)}
            </p>
          </div>

          {/* Send/Receive buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              onClick={onSend}
              className="flex items-center justify-center gap-2"
              disabled={availableLava <= 0}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send</span>
            </Button>
            <Button
              variant="secondary"
              onClick={onReceive}
              className="flex items-center justify-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receive</span>
            </Button>
          </div>

          {/* Footer with details toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-grey-425/50">
            <div className="flex items-center gap-2 text-xs text-grey-200">
              {isOffline ? (
                <Badge variant="warning" size="sm">Offline</Badge>
              ) : balance ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Updated {timeAgo(lastUpdated)}</span>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </div>
            
            <button
              onClick={() => setShowDetails(true)}
              className="flex items-center gap-1 text-sm text-lava-orange hover:text-lava-spanish-orange transition-colors"
            >
              <span>View breakdown</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Balance Details Sheet */}
      <Sheet
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="LAVA Breakdown"
      >
        <div className="space-y-6">
          {/* Lava balances */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: getChainColor("lava") }}
              >
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white">Lava Network</span>
            </div>
            
            <div className="space-y-2 pl-10">
              {balanceBreakdown.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-2 px-3 bg-grey-650/50 rounded-xl"
                >
                  <div>
                    <p className="text-sm text-white">{item.type}</p>
                    <p className="text-xs text-grey-200">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatLavaAmount(item.amount)}
                    </p>
                    <p className="text-xs text-grey-200">
                      {formatCurrency(item.amount * lavaPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-lava-orange/10 border border-lava-orange/20 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Total</span>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {formatLavaAmount(totalLava)} LAVA
                </p>
                <p className="text-sm text-grey-200">
                  {formatCurrency(totalUsdValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-grey-650/50 rounded-xl border border-grey-425/50">
            <p className="text-xs text-grey-200">
              <span className="text-grey-100 font-medium">Note:</span> Balances are fetched from 
              on-chain data and may have slight delays. Staking rewards update every epoch.
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
}

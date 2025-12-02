"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ChevronDown, ExternalLink, Flame } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatLavaAmount, formatCurrency, getChainColor, timeAgo } from "@/lib/utils";
import { Sheet } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

export function BalanceHero() {
  const {
    totalLava,
    totalUsdValue,
    lavaPrice,
    lastUpdated,
    refreshPortfolio,
    isLoading,
    chainBalances,
    isOffline,
  } = useApp();

  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isOffline) return;
    setIsRefreshing(true);
    await refreshPortfolio();
    setIsRefreshing(false);
  };

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

          {/* Footer with details toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-grey-425/50">
            <div className="flex items-center gap-2 text-xs text-grey-200">
              {isOffline ? (
                <Badge variant="warning" size="sm">Offline</Badge>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Updated {timeAgo(lastUpdated)}</span>
                </>
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
          {/* Group by chain */}
          {Object.entries(
            chainBalances.reduce((acc, balance) => {
              if (!acc[balance.chain]) {
                acc[balance.chain] = [];
              }
              acc[balance.chain].push(balance);
              return acc;
            }, {} as Record<string, typeof chainBalances>)
          ).map(([chain, balances]) => (
            <div key={chain}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getChainColor(chain) }}
                >
                  {chain === "Lava" ? (
                    <Flame className="w-4 h-4" />
                  ) : (
                    chain[0]
                  )}
                </div>
                <span className="font-semibold text-white">{chain}</span>
              </div>
              
              <div className="space-y-2 pl-10">
                {balances.map((balance, idx) => (
                  <div
                    key={`${balance.chain}-${balance.type}-${idx}`}
                    className="flex items-center justify-between py-2 px-3 bg-grey-650/50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm text-white capitalize">
                        {balance.type === "native" ? "Liquid" : balance.type}
                      </p>
                      <p className="text-xs text-grey-200">
                        {balance.type === "wrapped" ? "LAVA.w" : "LAVA"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatLavaAmount(balance.amount)}
                      </p>
                      <p className="text-xs text-grey-200">
                        {formatCurrency(balance.usdValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

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


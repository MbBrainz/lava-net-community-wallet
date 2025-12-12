"use client";

import { useState } from "react";
import { RefreshCw, ChevronDown, Flame, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useBalance } from "@/context/BalanceContext";
import { useOffline } from "@/context/OfflineContext";
import { useLavaPrice, formatLavaPrice, formatUsdValue, calculateUsdValue } from "@/lib/hooks";
import { formatTokenAmount, timeAgo, getChainColor } from "@/lib/utils";
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
    totalLavaBalance,
    arbitrumLavaBalance,
    baseLavaBalance,
    arbitrumEthBalance,
    baseEthBalance,
    lastUpdated,
    refreshBalance,
    isRefreshing,
  } = useBalance();
  const { isOffline } = useOffline();

  const { price: lavaPrice, isLoading: isPriceLoading } = useLavaPrice();

  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async () => {
    if (isOffline) return;
    await refreshBalance();
  };

  // Calculate USD value
  const totalUsdValue = calculateUsdValue(totalLavaBalance, lavaPrice);

  // Build balance breakdown for the sheet
  const chainBalances = [
    {
      chain: "Arbitrum",
      chainId: 42161,
      lavaBalance: arbitrumLavaBalance,
      ethBalance: arbitrumEthBalance,
      color: getChainColor("arbitrum"),
      icon: "🔷",
    },
    {
      chain: "Base",
      chainId: 8453,
      lavaBalance: baseLavaBalance,
      ethBalance: baseEthBalance,
      color: getChainColor("base"),
      icon: "🔵",
    },
  ];

  return (
    <>
      <div className="relative overflow-hidden animate-fade-in">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-lava-orange/20 via-lava-spanish-orange/10 to-transparent rounded-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-lava-orange/30 rounded-full blur-3xl" />
        
        <div className="relative p-6 rounded-3xl border border-lava-orange/20 bg-grey-550/50 backdrop-blur-xl backdrop-stable">
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
                <h2 className="text-sm font-medium text-grey-100">Total LAVA Balance</h2>
                <p className="text-xs text-grey-200">
                  {isPriceLoading ? "Loading price..." : `${formatLavaPrice(lavaPrice)} per LAVA`}
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
                {formatTokenAmount(totalLavaBalance)}
              </span>
              <span className="text-xl font-semibold text-lava-orange">LAVA</span>
            </div>
            <p className="text-lg text-grey-100 mt-1">
              {formatUsdValue(totalUsdValue)}
            </p>
          </div>

          {/* Chain badges - fixed height to prevent layout shift */}
          <div className="flex gap-2 mb-4 min-h-[20px]">
            {!lastUpdated ? (
              /* Skeleton while loading */
              <div className="h-5 w-32 rounded-full skeleton" />
            ) : (
              <>
                {arbitrumLavaBalance > 0 && (
                  <Badge variant="default" size="sm" className="bg-[#12AAFF]/20 text-[#12AAFF]">
                    🔷 {formatTokenAmount(arbitrumLavaBalance)} on Arbitrum
                  </Badge>
                )}
                {baseLavaBalance > 0 && (
                  <Badge variant="default" size="sm" className="bg-[#0052FF]/20 text-[#0052FF]">
                    🔵 {formatTokenAmount(baseLavaBalance)} on Base
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Send/Receive buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              onClick={onSend}
              className="flex items-center justify-center gap-2"
              disabled={totalLavaBalance <= 0}
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
              ) : isRefreshing ? (
                <span>Loading...</span>
              ) : lastUpdated ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Updated {timeAgo(lastUpdated)}</span>
                </>
              ) : (
                <span>Ready</span>
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
      </div>

      {/* Balance Details Sheet */}
      <Sheet
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Balance Breakdown"
      >
        <div className="space-y-6">
          {/* LAVA Token Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-lava-gradient flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-white">LAVA Token</span>
                <p className="text-xs text-grey-200">Across all chains</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {chainBalances.map((chain) => (
                <div
                  key={chain.chainId}
                  className="flex items-center justify-between py-3 px-4 bg-grey-650/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{chain.icon}</span>
                    <div>
                      <p className="text-sm text-white">{chain.chain}</p>
                      <p className="text-xs text-grey-200">
                        {chain.ethBalance.toFixed(6)} ETH available
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatTokenAmount(chain.lavaBalance)} LAVA
                    </p>
                    <p className="text-xs text-grey-200">
                      {formatUsdValue(calculateUsdValue(chain.lavaBalance, lavaPrice))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-lava-orange/10 border border-lava-orange/20 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Total LAVA</span>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {formatTokenAmount(totalLavaBalance)} LAVA
                </p>
                <p className="text-sm text-grey-200">
                  {formatUsdValue(totalUsdValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Info about token */}
          <div className="p-3 bg-grey-650/50 rounded-xl border border-grey-425/50">
            <p className="text-xs text-grey-200">
              <span className="text-grey-100 font-medium">LAVA Token:</span> The native token 
              of Lava Network, available on Arbitrum and Base at address{" "}
              <code className="text-lava-orange text-[10px]">0x11e9...1af</code>
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  Gift,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatLavaAmount, timeAgo, getChainColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WalletTransaction, TransactionStatus } from "@/lib/wallet";
import { getTxExplorerUrl } from "@/lib/chains/lava";

const txIcons: Record<WalletTransaction["type"], typeof ArrowUpRight> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  stake: Lock,
  unstake: Unlock,
  claim: Gift,
  unknown: HelpCircle,
};

const txLabels: Record<WalletTransaction["type"], string> = {
  send: "Sent",
  receive: "Received",
  stake: "Staked",
  unstake: "Unstaked",
  claim: "Claimed Rewards",
  unknown: "Transaction",
};

export function ActivityFeed() {
  const { transactions, isOffline } = useApp();

  if (transactions.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <div className="py-8 text-center">
          <p className="text-grey-200">No recent activity</p>
          <p className="text-sm text-grey-200 mt-1">
            {isOffline 
              ? "You&apos;re offline. Activity will load when connected."
              : "Your LAVA transactions will appear here"
            }
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="none">
      <div className="px-4 pt-4 pb-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <span className="text-xs text-grey-200">LAVA Network</span>
        </CardHeader>
      </div>

      <div className="divide-y divide-grey-425/30">
        {transactions.slice(0, 5).map((tx, index) => {
          const Icon = txIcons[tx.type];
          const isIncoming = tx.type === "receive" || tx.type === "claim";
          const isPending = tx.status === TransactionStatus.PENDING;
          const isFailed = tx.status === TransactionStatus.FAILED;

          return (
            <motion.a
              key={tx.id}
              href={getTxExplorerUrl(tx.hash)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-grey-425/20 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isFailed ? "bg-lava-red/20" : ""
                }`}
                style={{
                  backgroundColor: isFailed
                    ? undefined
                    : `${getChainColor(tx.chainName)}20`,
                }}
              >
                <Icon
                  className={`w-5 h-5 ${isFailed ? "text-lava-red" : ""}`}
                  style={{
                    color: isFailed ? undefined : getChainColor(tx.chainName),
                  }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {txLabels[tx.type]}
                  </p>
                  {isPending && (
                    <Badge variant="warning" size="sm">
                      Pending
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="danger" size="sm">
                      Failed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-grey-200">
                  <span className="capitalize">{tx.chainName}</span>
                  <span>•</span>
                  <span>{timeAgo(tx.timestamp)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    isFailed
                      ? "text-grey-200 line-through"
                      : isIncoming
                      ? "text-green-400"
                      : "text-white"
                  }`}
                >
                  {isIncoming ? "+" : "-"}
                  {formatLavaAmount(tx.amount)}
                </p>
                <p className="text-xs text-grey-200">{tx.denom}</p>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* View all link */}
      {transactions.length > 5 && (
        <div className="px-4 py-3 border-t border-grey-425/30">
          <button className="flex items-center justify-center gap-2 w-full text-sm text-lava-orange hover:text-lava-spanish-orange transition-colors">
            <span>View all activity</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );
}

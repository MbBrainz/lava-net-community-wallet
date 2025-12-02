"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  Gift,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatLavaAmount, timeAgo, getChainColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Transaction } from "@/lib/mock-data";

const txIcons: Record<Transaction["type"], typeof ArrowUpRight> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  stake: Lock,
  unstake: Unlock,
  claim: Gift,
};

const txLabels: Record<Transaction["type"], string> = {
  send: "Sent",
  receive: "Received",
  stake: "Staked",
  unstake: "Unstaked",
  claim: "Claimed Rewards",
};

export function ActivityFeed() {
  const { transactions } = useApp();

  if (transactions.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <div className="py-8 text-center">
          <p className="text-grey-200">No recent activity</p>
          <p className="text-sm text-grey-200 mt-1">
            Your LAVA transactions will appear here
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
          <span className="text-xs text-grey-200">LAVA only</span>
        </CardHeader>
      </div>

      <div className="divide-y divide-grey-425/30">
        {transactions.slice(0, 5).map((tx, index) => {
          const Icon = txIcons[tx.type];
          const isIncoming = tx.type === "receive" || tx.type === "claim";

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-grey-425/20 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${getChainColor(tx.chain)}20`,
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: getChainColor(tx.chain) }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {txLabels[tx.type]}
                  </p>
                  {tx.status === "pending" && (
                    <Badge variant="warning" size="sm">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-grey-200">
                  <span>{tx.chain}</span>
                  <span>•</span>
                  <span>{timeAgo(tx.timestamp)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    isIncoming ? "text-green-400" : "text-white"
                  }`}
                >
                  {isIncoming ? "+" : "-"}
                  {formatLavaAmount(tx.amount)}
                </p>
                <p className="text-xs text-grey-200">LAVA</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View all link */}
      <div className="px-4 py-3 border-t border-grey-425/30">
        <button className="flex items-center justify-center gap-2 w-full text-sm text-lava-orange hover:text-lava-spanish-orange transition-colors">
          <span>View all activity</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}


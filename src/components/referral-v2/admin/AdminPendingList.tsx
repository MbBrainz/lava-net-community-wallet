"use client";

/**
 * AdminPendingList Component (v2)
 *
 * Displays list of pending referrer requests with approve/reject actions.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PendingReferrer {
  referrerId: string;
  email: string;
  requestedAt: string;
}

interface AdminPendingListProps {
  pendingReferrers: PendingReferrer[];
  onAction: (
    referrerId: string,
    action: "approve" | "reject"
  ) => Promise<void>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminPendingList({
  pendingReferrers,
  onAction,
}: AdminPendingListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (
    referrerId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingId(referrerId);
    try {
      await onAction(referrerId, action);
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingReferrers.length === 0) {
    return (
      <Card variant="glass">
        <div className="py-6 text-center">
          <Clock className="w-8 h-8 text-grey-300 mx-auto mb-2" />
          <p className="text-grey-200">No pending requests</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="none">
      <div className="divide-y divide-grey-425/30">
        {pendingReferrers.map((referrer, index) => (
          <motion.div
            key={referrer.referrerId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{referrer.email}</p>
                <p className="text-xs text-grey-300 mt-0.5">
                  Requested {formatDate(referrer.requestedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {processingId === referrer.referrerId ? (
                  <Loader2 className="w-5 h-5 text-grey-300 animate-spin" />
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction(referrer.referrerId, "reject")}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction(referrer.referrerId, "approve")}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

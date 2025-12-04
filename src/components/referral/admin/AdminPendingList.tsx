"use client";

/**
 * AdminPendingList Component
 *
 * List of pending referral codes with approve/reject buttons.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/referral";

interface PendingCode {
  code: string;
  ownerEmail: string;
  requestedAt: string;
}

interface AdminPendingListProps {
  pendingCodes: PendingCode[];
  onAction: (code: string, action: "approve" | "reject") => Promise<void>;
}

export function AdminPendingList({ pendingCodes, onAction }: AdminPendingListProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (code: string, action: "approve" | "reject") => {
    setLoadingCode(code);
    setLoadingAction(action);
    try {
      await onAction(code, action);
    } finally {
      setLoadingCode(null);
      setLoadingAction(null);
    }
  };

  if (pendingCodes.length === 0) {
    return (
      <div className="py-8 text-center">
        <Clock className="w-10 h-10 text-grey-300 mx-auto mb-3" />
        <p className="text-grey-200">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {pendingCodes.map((item) => (
          <motion.div
            key={item.code}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card variant="glass" padding="none">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-lg truncate">
                      {item.code}
                    </p>
                    <p className="text-sm text-grey-200 truncate">{item.ownerEmail}</p>
                    <p className="text-xs text-grey-300 mt-1">
                      Requested {formatDate(item.requestedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(item.code, "reject")}
                      disabled={loadingCode === item.code}
                      className="!bg-red-500/10 hover:!bg-red-500/20 !text-red-400 border-red-500/30"
                    >
                      {loadingCode === item.code && loadingAction === "reject" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(item.code, "approve")}
                      disabled={loadingCode === item.code}
                      className="!bg-green-500/10 hover:!bg-green-500/20 !text-green-400 border-green-500/30"
                    >
                      {loadingCode === item.code && loadingAction === "approve" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


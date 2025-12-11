"use client";

/**
 * AdminApprovedList Component (v2)
 *
 * Displays list of approved referrers with notification toggle.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Loader2, Hash, Users, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";

interface ApprovedReferrer {
  referrerId: string;
  email: string;
  approvedAt: string;
  codeCount: number;
  totalReferrals: number;
  canSendNotifications: boolean;
}

interface AdminApprovedListProps {
  approvedReferrers: ApprovedReferrer[];
  onAction: (
    referrerId: string,
    action: "enable_notifications" | "disable_notifications"
  ) => Promise<void>;
}

export function AdminApprovedList({
  approvedReferrers,
  onAction,
}: AdminApprovedListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggleNotifications = async (
    referrerId: string,
    currentValue: boolean
  ) => {
    setProcessingId(referrerId);
    try {
      await onAction(
        referrerId,
        currentValue ? "disable_notifications" : "enable_notifications"
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (approvedReferrers.length === 0) {
    return (
      <Card variant="glass">
        <div className="py-6 text-center">
          <CheckCircle className="w-8 h-8 text-grey-300 mx-auto mb-2" />
          <p className="text-grey-200">No approved referrers yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="none">
      <div className="divide-y divide-grey-425/30">
        {approvedReferrers.map((referrer, index) => (
          <motion.div
            key={referrer.referrerId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{referrer.email}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge variant="default" size="sm" className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {referrer.codeCount}
                  </Badge>
                  <Badge variant="default" size="sm" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {referrer.totalReferrals}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {processingId === referrer.referrerId ? (
                  <Loader2 className="w-5 h-5 text-grey-300 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {referrer.canSendNotifications ? (
                      <Bell className="w-3.5 h-3.5 text-lava-orange" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-grey-400" />
                    )}
                    <Toggle
                      checked={referrer.canSendNotifications}
                      onChange={() =>
                        handleToggleNotifications(
                          referrer.referrerId,
                          referrer.canSendNotifications
                        )
                      }
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

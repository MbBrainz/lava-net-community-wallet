"use client";

/**
 * ReferralPendingStatus Component
 *
 * Displays pending status message for a referral code request.
 */

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/referral";

interface ReferralPendingStatusProps {
  code: string;
  requestedAt: string;
}

export function ReferralPendingStatus({
  code,
  requestedAt,
}: ReferralPendingStatusProps) {
  return (
    <Card variant="glass">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-2"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <Badge variant="warning" size="sm" className="mb-3">
          Pending Approval
        </Badge>

        <p className="text-white font-medium mb-1">
          Your referral code{" "}
          <span className="text-lava-orange font-semibold">{code}</span> is
          pending approval
        </p>

        <p className="text-sm text-grey-300">
          Requested on {formatDate(requestedAt)}
        </p>

        <div className="mt-4 p-3 bg-grey-650/50 rounded-lg w-full">
          <p className="text-xs text-grey-200">
            Our team will review your request and approve it shortly. You&apos;ll be
            able to see your dashboard once approved.
          </p>
        </div>
      </motion.div>
    </Card>
  );
}


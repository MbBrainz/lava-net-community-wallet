"use client";

/**
 * ReferrerPendingStatus Component (v2)
 *
 * Displays pending status while waiting for referrer approval.
 */

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ReferrerPendingStatusProps {
  requestedAt: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReferrerPendingStatus({ requestedAt }: ReferrerPendingStatusProps) {
  return (
    <Card variant="glass">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">Pending Approval</p>
              <p className="text-sm text-grey-200">Your request is being reviewed</p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        </div>

        <div className="p-3 bg-grey-650/50 rounded-lg">
          <p className="text-xs text-grey-300">Requested on</p>
          <p className="text-sm text-white mt-0.5">{formatDate(requestedAt)}</p>
        </div>

        <p className="text-xs text-grey-300 text-center">
          We&apos;ll notify you once your request has been reviewed.
        </p>
      </motion.div>
    </Card>
  );
}


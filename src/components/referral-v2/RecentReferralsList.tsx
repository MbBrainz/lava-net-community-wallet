"use client";

/**
 * RecentReferralsList Component (v2)
 *
 * Displays list of recent referrals.
 */

import { motion } from "framer-motion";
import { Users, Hash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Referral {
  id: string;
  userEmail: string;
  codeUsed: string;
  convertedAt: string;
}

interface RecentReferralsListProps {
  referrals: Referral[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function RecentReferralsList({ referrals }: RecentReferralsListProps) {
  if (referrals.length === 0) {
    return (
      <Card variant="glass">
        <div className="py-8 text-center">
          <Users className="w-10 h-10 text-grey-300 mx-auto mb-3" />
          <p className="text-grey-200">No referrals yet</p>
          <p className="text-sm text-grey-300 mt-1">
            Share your codes to start earning referrals
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="none">
      <div className="divide-y divide-grey-425/30">
        {referrals.map((referral, index) => (
          <motion.div
            key={referral.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {referral.userEmail}
                </p>
                <p className="text-xs text-grey-300 mt-0.5">
                  {formatDate(referral.convertedAt)}
                </p>
              </div>

              <Badge variant="default" size="sm" className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {referral.codeUsed}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}


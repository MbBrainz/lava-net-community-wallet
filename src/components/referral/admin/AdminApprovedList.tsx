"use client";

/**
 * AdminApprovedList Component
 *
 * List of approved referral codes with stats.
 */

import { motion } from "framer-motion";
import { CheckCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/referral";

interface ApprovedCode {
  code: string;
  ownerEmail: string;
  approvedAt: string | null;
  referralCount: number;
}

interface AdminApprovedListProps {
  approvedCodes: ApprovedCode[];
}

export function AdminApprovedList({ approvedCodes }: AdminApprovedListProps) {
  if (approvedCodes.length === 0) {
    return (
      <div className="py-8 text-center">
        <CheckCircle className="w-10 h-10 text-grey-300 mx-auto mb-3" />
        <p className="text-grey-200">No approved codes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvedCodes.map((item, index) => (
        <motion.div
          key={item.code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card variant="glass" padding="none">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold truncate">{item.code}</p>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-grey-200 truncate">{item.ownerEmail}</p>
                  {item.approvedAt && (
                    <p className="text-xs text-grey-300 mt-1">
                      Approved {formatDate(item.approvedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-grey-650/50 rounded-lg">
                  <Users className="w-4 h-4 text-lava-orange" />
                  <span className="text-white font-semibold">{item.referralCount}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}


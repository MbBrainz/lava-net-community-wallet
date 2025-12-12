"use client";

/**
 * UTMBreakdown Component
 *
 * Displays breakdown of referrals by UTM source/medium/campaign.
 */

import { motion } from "framer-motion";
import { BarChart3, Globe, Megaphone, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { UTMBreakdown as UTMBreakdownType } from "@/lib/referral/types";

interface UTMBreakdownProps {
  breakdown: UTMBreakdownType;
  totalReferrals: number;
}

interface BreakdownSectionProps {
  title: string;
  icon: React.ReactNode;
  items: Array<{ value: string | null; count: number }>;
  total: number;
}

function BreakdownSection({ title, icon, items, total }: BreakdownSectionProps) {
  // Filter out empty values and take top 5
  const filteredItems = items
    .filter((item) => item.value !== null)
    .slice(0, 5);

  // Calculate "other" or "unknown" count
  const knownCount = filteredItems.reduce((sum, item) => sum + item.count, 0);
  const unknownCount = total - knownCount;

  if (filteredItems.length === 0 && unknownCount === total) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-grey-200">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">
        {filteredItems.map((item) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.value} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-white truncate">{item.value}</span>
                  <span className="text-grey-300 ml-2">{item.count}</span>
                </div>
                <div className="h-1.5 bg-grey-650 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-lava-orange rounded-full"
                  />
                </div>
              </div>
            </div>
          );
        })}
        {unknownCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-grey-400 italic truncate">No tracking</span>
                <span className="text-grey-400 ml-2">{unknownCount}</span>
              </div>
              <div className="h-1.5 bg-grey-650 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((unknownCount / total) * 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-grey-500 rounded-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UTMBreakdown({ breakdown, totalReferrals }: UTMBreakdownProps) {
  const hasData =
    breakdown.source.some((s) => s.value !== null) ||
    breakdown.medium.some((m) => m.value !== null) ||
    breakdown.campaign.some((c) => c.value !== null);

  if (totalReferrals === 0) {
    return (
      <Card variant="glass">
        <div className="py-6 text-center">
          <BarChart3 className="w-8 h-8 text-grey-300 mx-auto mb-2" />
          <p className="text-sm text-grey-200">No data yet</p>
          <p className="text-xs text-grey-300 mt-1">
            Analytics will appear as you get referrals
          </p>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card variant="glass">
        <div className="py-6 text-center">
          <BarChart3 className="w-8 h-8 text-grey-300 mx-auto mb-2" />
          <p className="text-sm text-grey-200">No UTM tracking yet</p>
          <p className="text-xs text-grey-300 mt-1">
            Add UTM parameters to your links for analytics
          </p>
          <p className="text-xs text-grey-400 mt-2 font-mono">
            ?ref=CODE&utm_source=twitter
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <div className="space-y-4">
        <BreakdownSection
          title="Sources"
          icon={<Globe className="w-3.5 h-3.5" />}
          items={breakdown.source}
          total={totalReferrals}
        />
        <BreakdownSection
          title="Mediums"
          icon={<Megaphone className="w-3.5 h-3.5" />}
          items={breakdown.medium}
          total={totalReferrals}
        />
        <BreakdownSection
          title="Campaigns"
          icon={<Target className="w-3.5 h-3.5" />}
          items={breakdown.campaign}
          total={totalReferrals}
        />
      </div>
    </Card>
  );
}

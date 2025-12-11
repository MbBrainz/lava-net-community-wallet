"use client";

/**
 * ReferralCodeList Component
 *
 * Displays list of referral codes with UTM tracking info, copy and toggle actions.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Power, Hash, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { useAuthFetch } from "@/lib/auth/client";
import type { UTMParams } from "@/lib/referral/types";

interface CodeStats extends UTMParams {
  code: string;
  label: string | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

interface ReferralCodeListProps {
  codes: CodeStats[];
  onRefresh: () => void;
}

/**
 * Build the full referral URL with UTM parameters
 */
function buildReferralUrl(
  baseUrl: string,
  code: string,
  utm: UTMParams
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("ref", code);

  if (utm.utmSource) url.searchParams.set("utm_source", utm.utmSource);
  if (utm.utmMedium) url.searchParams.set("utm_medium", utm.utmMedium);
  if (utm.utmCampaign) url.searchParams.set("utm_campaign", utm.utmCampaign);

  return url.toString();
}

export function ReferralCodeList({ codes, onRefresh }: ReferralCodeListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const { authFetch, isReady } = useAuthFetch();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = async (code: CodeStats) => {
    try {
      const link = buildReferralUrl(baseUrl, code.code, {
        utmSource: code.utmSource,
        utmMedium: code.utmMedium,
        utmCampaign: code.utmCampaign,
      });
      await navigator.clipboard.writeText(link);
      setCopiedCode(code.code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleToggle = async (code: string, currentActive: boolean) => {
    if (!isReady || togglingCode) return;

    setTogglingCode(code);
    try {
      const response = await authFetch("/api/referrals/codes", {
        method: "PATCH",
        body: JSON.stringify({
          code,
          isActive: !currentActive,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle code:", error);
    } finally {
      setTogglingCode(null);
    }
  };

  const hasUtm = (code: CodeStats) =>
    code.utmSource || code.utmMedium || code.utmCampaign;

  if (codes.length === 0) {
    return (
      <Card variant="glass">
        <div className="py-8 text-center">
          <Hash className="w-10 h-10 text-grey-300 mx-auto mb-3" />
          <p className="text-grey-200">No codes yet</p>
          <p className="text-sm text-grey-300 mt-1">
            Create your first referral code to start sharing
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="none">
      <div className="divide-y divide-grey-425/30">
        {codes.map((code, index) => (
          <motion.div
            key={code.code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Code and badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-lava-orange font-mono">
                    {code.code}
                  </span>
                  {!code.isActive && (
                    <Badge variant="default" size="sm">
                      Inactive
                    </Badge>
                  )}
                  {code.expiresAt && new Date(code.expiresAt) < new Date() && (
                    <Badge variant="warning" size="sm">
                      Expired
                    </Badge>
                  )}
                  {hasUtm(code) && (
                    <Badge variant="success" size="sm">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      UTM
                    </Badge>
                  )}
                </div>

                {/* Label */}
                {code.label && (
                  <p className="text-sm text-grey-200 mt-0.5">{code.label}</p>
                )}

                {/* UTM tags */}
                {hasUtm(code) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {code.utmSource && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-grey-650 text-grey-200 border border-grey-425/50">
                        <span className="text-grey-400 mr-1">source:</span>
                        {code.utmSource}
                      </span>
                    )}
                    {code.utmMedium && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-grey-650 text-grey-200 border border-grey-425/50">
                        <span className="text-grey-400 mr-1">medium:</span>
                        {code.utmMedium}
                      </span>
                    )}
                    {code.utmCampaign && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-grey-650 text-grey-200 border border-grey-425/50">
                        <span className="text-grey-400 mr-1">campaign:</span>
                        {code.utmCampaign}
                      </span>
                    )}
                  </div>
                )}

                {/* Referral count */}
                <p className="text-xs text-grey-300 mt-2">
                  {code.usageCount} referral{code.usageCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(code)}
                  className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-colors"
                  title="Copy referral link"
                >
                  {copiedCode === code.code ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <Power className="w-3 h-3 text-grey-300" />
                  <Toggle
                    checked={code.isActive}
                    onChange={() => handleToggle(code.code, code.isActive)}
                    disabled={togglingCode === code.code}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

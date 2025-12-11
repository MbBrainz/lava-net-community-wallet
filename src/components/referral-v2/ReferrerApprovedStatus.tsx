"use client";

/**
 * ReferrerApprovedStatus Component (v2)
 *
 * Displays approved status with codes summary and dashboard link.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Copy, Check, ArrowRight, Bell, Hash } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ReferrerCode {
  code: string;
  label: string | null;
  isActive: boolean;
  usageCount: number;
}

interface ReferrerApprovedStatusProps {
  codes: ReferrerCode[];
  canSendNotifications: boolean;
}

export function ReferrerApprovedStatus({ codes, canSendNotifications }: ReferrerApprovedStatusProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeCodes = codes.filter((c) => c.isActive);
  const totalReferrals = codes.reduce((sum, c) => sum + c.usageCount, 0);
  const primaryCode = activeCodes[0];

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = async (code: string) => {
    try {
      const link = `${baseUrl}/?ref=${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Card variant="gradient">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">You&apos;re a Referrer!</p>
              <p className="text-sm text-grey-200">Share your codes to earn rewards</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canSendNotifications && (
              <Badge variant="default" size="sm" className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
              </Badge>
            )}
            <Badge variant="success" size="sm">
              Active
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-grey-650/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Hash className="w-4 h-4 text-lava-orange" />
              <span className="text-lg font-bold text-white">{activeCodes.length}</span>
            </div>
            <p className="text-xs text-grey-300">Active Codes</p>
          </div>
          <div className="p-3 bg-grey-650/50 rounded-lg text-center">
            <span className="text-lg font-bold text-white">{totalReferrals}</span>
            <p className="text-xs text-grey-300">Total Referrals</p>
          </div>
        </div>

        {/* Primary code with quick copy */}
        {primaryCode && (
          <div className="p-3 bg-grey-650/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-grey-300 mb-1">Primary Code</p>
                <span className="text-lg font-semibold text-lava-orange font-mono">
                  {primaryCode.code}
                </span>
                {primaryCode.label && (
                  <span className="ml-2 text-xs text-grey-300">({primaryCode.label})</span>
                )}
              </div>
              <button
                onClick={() => handleCopy(primaryCode.code)}
                className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-colors"
              >
                {copiedCode === primaryCode.code ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dashboard link */}
        <Link href="/referrals">
          <Button variant="secondary" fullWidth className="group">
            <span>View Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {activeCodes.length === 0 && (
          <p className="text-xs text-grey-300 text-center">
            Create your first referral code in the dashboard
          </p>
        )}
      </motion.div>
    </Card>
  );
}


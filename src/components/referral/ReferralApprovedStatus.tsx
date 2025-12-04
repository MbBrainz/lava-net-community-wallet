"use client";

/**
 * ReferralApprovedStatus Component
 *
 * Displays approved status with dashboard link and quick copy feature.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ReferralApprovedStatusProps {
  code: string;
}

export function ReferralApprovedStatus({ code }: ReferralApprovedStatusProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${baseUrl}/?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">Your referral code is active!</p>
              <p className="text-sm text-grey-200">Start sharing to earn rewards</p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Active
          </Badge>
        </div>

        {/* Code display with copy */}
        <div className="p-3 bg-grey-650/80 rounded-xl">
          <p className="text-xs text-grey-300 mb-1">Your code</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-lava-orange">{code}</span>
            <button
              onClick={handleCopy}
              className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Referral link preview */}
        <div className="p-3 bg-grey-650/50 rounded-lg">
          <p className="text-xs text-grey-300 mb-1">Your referral link</p>
          <p className="text-sm text-grey-100 font-mono truncate">{referralLink}</p>
        </div>

        {/* Dashboard link */}
        <Link href="/referrals">
          <Button variant="secondary" fullWidth className="group">
            <span>View Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </motion.div>
    </Card>
  );
}


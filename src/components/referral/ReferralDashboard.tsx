"use client";

/**
 * ReferralDashboard Component
 *
 * Full dashboard page content for approved referral code owners.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Tag,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReferralShareBuilder } from "./ReferralShareBuilder";
import { ReferralHowToModal } from "./ReferralHowToModal";
import { getReferralStatus, formatDate, ReferralStatsResponse } from "@/lib/referral";

interface ReferralItem {
  id: string;
  userEmail: string;
  convertedAt: string;
  tag: string | null;
  source: string | null;
}

export function ReferralDashboard() {
  const router = useRouter();
  const { user } = useApp();
  const userEmail = user?.email || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHowToModal, setShowHowToModal] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(
        `/api/referrals/stats?email=${encodeURIComponent(userEmail)}`
      );
      const data: ReferralStatsResponse | { error: string; message: string } =
        await response.json();

      if ("error" in data) {
        if (data.error === "not_approved" || data.error === "no_code") {
          // Redirect to settings
          router.push("/settings");
          return;
        }
        throw new Error(data.message);
      }

      setCode(data.code);
      setTotalReferrals(data.totalReferrals);
      setReferrals(data.referrals);
    } catch (error) {
      console.error("[Dashboard] Failed to fetch stats:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, router]);

  useEffect(() => {
    if (!userEmail) {
      router.push("/settings");
      return;
    }

    // Check cache first
    const cached = getReferralStatus(userEmail);
    if (cached?.status !== "approved") {
      router.push("/settings");
      return;
    }

    // Fetch stats
    fetchStats();
  }, [userEmail, router, fetchStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-4">
        <div className="px-4 pt-4 pb-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push("/settings")}>
            Back to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 -ml-2 text-grey-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Referral Dashboard</h1>
              <p className="text-sm text-grey-200">Track your referrals</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-6">
        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-200 mb-1">Your Code</p>
                <p className="text-2xl font-bold text-lava-orange">{code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-grey-200 mb-1">Total Referrals</p>
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-3xl font-bold text-white">
                    {totalReferrals}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-grey-100">Share Your Link</h2>
            <button
              onClick={() => setShowHowToModal(true)}
              className="flex items-center gap-1 text-xs text-lava-orange hover:text-lava-orange/80 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              How do tags work?
            </button>
          </div>
          {code && <ReferralShareBuilder code={code} />}
        </motion.div>

        {/* Referrals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Referrals
          </h2>

          {referrals.length === 0 ? (
            <Card variant="glass">
              <div className="py-8 text-center">
                <Users className="w-10 h-10 text-grey-300 mx-auto mb-3" />
                <p className="text-grey-200">No referrals yet</p>
                <p className="text-sm text-grey-300 mt-1">
                  Share your link to start earning referrals
                </p>
              </div>
            </Card>
          ) : (
            <Card variant="glass" padding="none">
              <div className="divide-y divide-grey-425/30">
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {referral.userEmail}
                        </p>
                        <p className="text-xs text-grey-300 mt-1">
                          {formatDate(referral.convertedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {referral.source && (
                          <Badge
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {referral.source}
                          </Badge>
                        )}
                        {referral.tag && (
                          <Badge
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {referral.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      {/* How-To Modal */}
      <ReferralHowToModal
        isOpen={showHowToModal}
        onClose={() => setShowHowToModal(false)}
      />
    </div>
  );
}


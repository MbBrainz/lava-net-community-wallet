"use client";

/**
 * ReferrerDashboard Component (v2)
 *
 * Full dashboard for approved referrers.
 * Shows codes, stats, and allows creating new codes.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Plus,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReferralCodeList } from "./ReferralCodeList";
import { CreateCodeModal } from "./CreateCodeModal";
import { RecentReferralsList } from "./RecentReferralsList";
import { useAuthFetch } from "@/lib/auth/client";
import type { ReferralStatsResponse } from "@/lib/referral/types-v2";

export function ReferrerDashboard() {
  const router = useRouter();
  const { user } = useApp();
  const userEmail = user?.email || "";
  const { authFetch, isReady } = useAuthFetch();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isReady) return;

    try {
      const response = await authFetch("/api/referrals-v2/stats");

      if (response.status === 401) {
        router.push("/settings");
        return;
      }

      const data = await response.json();

      if ("error" in data) {
        if (data.error === "not_referrer" || data.error === "not_approved") {
          router.push("/settings");
          return;
        }
        throw new Error(data.message);
      }

      setStats(data);
    } catch (err) {
      console.error("[Dashboard] Failed to fetch stats:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isReady, router]);

  useEffect(() => {
    if (!userEmail) {
      router.push("/settings");
      return;
    }

    if (isReady) {
      fetchStats();
    }
  }, [userEmail, router, isReady, fetchStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  const handleCodeCreated = () => {
    setShowCreateModal(false);
    fetchStats();
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

  if (!stats) return null;

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
              <p className="text-sm text-grey-200">Manage your codes & referrals</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-200 mb-1">Active Codes</p>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-lava-orange" />
                  <span className="text-2xl font-bold text-white">
                    {stats.codeStats.filter((c) => c.isActive).length}
                  </span>
                  <span className="text-sm text-grey-300">/ 20</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-grey-200 mb-1">Total Referrals</p>
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-3xl font-bold text-white">
                    {stats.totalReferrals}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Codes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-grey-100 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Your Codes
            </h2>
            {stats.codeStats.length < 20 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Code
              </Button>
            )}
          </div>
          <ReferralCodeList
            codes={stats.codeStats}
            onRefresh={fetchStats}
          />
        </motion.section>

        {/* Recent Referrals */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recent Referrals
          </h2>
          <RecentReferralsList referrals={stats.recentReferrals} />
        </motion.section>
      </div>

      {/* Create Code Modal */}
      <CreateCodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCodeCreated}
      />
    </div>
  );
}


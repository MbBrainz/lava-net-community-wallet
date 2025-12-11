"use client";

/**
 * AdminDashboard Component (v2)
 *
 * Full admin dashboard for managing referrers.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminPendingList } from "./AdminPendingList";
import { AdminApprovedList } from "./AdminApprovedList";
import { useAuthFetch } from "@/lib/auth/client";
import { getAdminStatus, saveAdminStatus } from "@/lib/referral";
import type { AdminReferralsResponse } from "@/lib/referral/types-v2";

interface PendingReferrer {
  referrerId: string;
  email: string;
  requestedAt: string;
}

interface ApprovedReferrer {
  referrerId: string;
  email: string;
  approvedAt: string;
  codeCount: number;
  totalReferrals: number;
  canSendNotifications: boolean;
}

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useApp();
  const userEmail = user?.email || "";
  const { authFetch, isReady } = useAuthFetch();

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingReferrers, setPendingReferrers] = useState<PendingReferrer[]>([]);
  const [approvedReferrers, setApprovedReferrers] = useState<ApprovedReferrer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!isReady) return false;

    try {
      const response = await authFetch("/api/admin/check");

      if (response.status === 401) {
        setIsAdmin(false);
        return false;
      }

      const data = await response.json();

      setIsAdmin(data.isAdmin);
      saveAdminStatus({ userEmail, isAdmin: data.isAdmin });

      return data.isAdmin;
    } catch (err) {
      console.error("[AdminDashboard] Failed to check admin status:", err);
      setIsAdmin(false);
      return false;
    }
  }, [authFetch, isReady, userEmail]);

  const fetchReferrers = useCallback(async () => {
    if (!isReady) return;

    setError(null);
    try {
      const response = await authFetch("/api/admin-v2/referrers");

      if (response.status === 401) {
        router.push("/settings");
        return;
      }

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      const data: AdminReferralsResponse = await response.json();

      if ("error" in data) {
        throw new Error((data as { message?: string }).message || "Failed to fetch referrers");
      }

      setPendingReferrers(data.pending);
      setApprovedReferrers(data.approved);
    } catch (err) {
      console.error("[AdminDashboard] Failed to fetch referrers:", err);
      setError("Failed to load referrer data");
    }
  }, [authFetch, isReady, router]);

  useEffect(() => {
    if (!userEmail) {
      router.push("/settings");
      return;
    }

    if (!isReady) return;

    const init = async () => {
      // Check localStorage cache first
      const cached = getAdminStatus(userEmail);

      if (cached?.isAdmin === true) {
        setIsAdmin(true);
        setIsLoading(false);
        await fetchReferrers();
        return;
      }

      // Not cached as admin, check API
      const isAdminResult = await checkAdminStatus();
      setIsLoading(false);

      if (!isAdminResult) {
        router.push("/settings");
        return;
      }

      await fetchReferrers();
    };

    init();
  }, [userEmail, router, isReady, checkAdminStatus, fetchReferrers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReferrers();
    setIsRefreshing(false);
  };

  const handleAction = async (
    referrerId: string,
    action: "approve" | "reject" | "enable_notifications" | "disable_notifications"
  ) => {
    if (!isReady) return;

    try {
      const response = await authFetch("/api/admin-v2/referrers", {
        method: "PATCH",
        body: JSON.stringify({
          referrerId,
          action,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setError("Please log in again");
        return;
      }

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (data.success) {
        await fetchReferrers();
      } else {
        setError(data.message || `Failed to ${action}`);
      }
    } catch (err) {
      console.error("[AdminDashboard] Action failed:", err);
      setError(`Failed to ${action}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pb-4">
        <div className="px-4 pt-4 pb-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return null;
  }

  // Calculate stats
  const totalReferrals = approvedReferrers.reduce((sum, r) => sum + r.totalReferrals, 0);

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
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-lava-orange" />
                Admin Panel
              </h1>
              <p className="text-sm text-grey-200">Manage referrers</p>
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
          className="grid grid-cols-3 gap-3"
        >
          <Card variant="glass" className="text-center py-4">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{pendingReferrers.length}</p>
            <p className="text-xs text-grey-200">Pending</p>
          </Card>
          <Card variant="glass" className="text-center py-4">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{approvedReferrers.length}</p>
            <p className="text-xs text-grey-200">Referrers</p>
          </Card>
          <Card variant="glass" className="text-center py-4">
            <Users className="w-5 h-5 text-lava-orange mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalReferrals}</p>
            <p className="text-xs text-grey-200">Referrals</p>
          </Card>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Pending Requests */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Requests
            {pendingReferrers.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                {pendingReferrers.length}
              </span>
            )}
          </h2>
          <AdminPendingList
            pendingReferrers={pendingReferrers}
            onAction={handleAction}
          />
        </motion.section>

        {/* Approved Referrers */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Approved Referrers
            {approvedReferrers.length > 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                {approvedReferrers.length}
              </span>
            )}
          </h2>
          <AdminApprovedList
            approvedReferrers={approvedReferrers}
            onAction={handleAction}
          />
        </motion.section>
      </div>
    </div>
  );
}

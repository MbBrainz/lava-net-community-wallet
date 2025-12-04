"use client";

/**
 * AdminDashboard Component
 *
 * Full admin dashboard page content for managing referral codes.
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
import {
  getAdminStatus,
  saveAdminStatus,
  AdminReferralsResponse,
} from "@/lib/referral";

interface PendingCode {
  code: string;
  ownerEmail: string;
  requestedAt: string;
}

interface ApprovedCode {
  code: string;
  ownerEmail: string;
  approvedAt: string | null;
  referralCount: number;
}

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useApp();
  const userEmail = user?.email || "";
  const { authFetch, isReady } = useAuthFetch();

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCodes, setPendingCodes] = useState<PendingCode[]>([]);
  const [approvedCodes, setApprovedCodes] = useState<ApprovedCode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!isReady) return false;

    try {
      // Use authenticated fetch - email comes from JWT on server
      const response = await authFetch("/api/admin/check");

      if (response.status === 401) {
        setIsAdmin(false);
        return false;
      }

      const data = await response.json();

      setIsAdmin(data.isAdmin);
      saveAdminStatus({ userEmail, isAdmin: data.isAdmin });

      return data.isAdmin;
    } catch (error) {
      console.error("[AdminDashboard] Failed to check admin status:", error);
      setIsAdmin(false);
      return false;
    }
  }, [authFetch, isReady, userEmail]);

  const fetchReferrals = useCallback(async () => {
    if (!isReady) return;

    setError(null);
    try {
      // Use authenticated fetch - email comes from JWT on server
      const response = await authFetch("/api/admin/referrals");

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
        throw new Error((data as { message?: string }).message || "Failed to fetch referrals");
      }

      setPendingCodes(data.pending);
      setApprovedCodes(data.approved);
    } catch (error) {
      console.error("[AdminDashboard] Failed to fetch referrals:", error);
      setError("Failed to load referral data");
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
        await fetchReferrals();
        return;
      }

      // Not cached as admin, check API
      const isAdminResult = await checkAdminStatus();
      setIsLoading(false);

      if (!isAdminResult) {
        // Not admin, redirect
        router.push("/settings");
        return;
      }

      await fetchReferrals();
    };

    init();
  }, [userEmail, router, isReady, checkAdminStatus, fetchReferrals]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReferrals();
    setIsRefreshing(false);
  };

  const handleAction = async (code: string, action: "approve" | "reject") => {
    if (!isReady) return;

    try {
      // Use authenticated fetch - admin status verified on server from JWT
      const response = await authFetch("/api/admin/referrals", {
        method: "POST",
        body: JSON.stringify({
          code,
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
        await fetchReferrals();
      } else {
        setError(data.message || `Failed to ${action} code`);
      }
    } catch (error) {
      console.error("[AdminDashboard] Action failed:", error);
      setError(`Failed to ${action} code`);
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

  // Not admin - shouldn't reach here as we redirect, but safety
  if (!isAdmin) {
    return null;
  }

  // Calculate stats
  const totalReferrals = approvedCodes.reduce((sum, c) => sum + c.referralCount, 0);

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
              <p className="text-sm text-grey-200">Manage referral codes</p>
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
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card variant="glass" className="text-center py-4">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{pendingCodes.length}</p>
            <p className="text-xs text-grey-200">Pending</p>
          </Card>
          <Card variant="glass" className="text-center py-4">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{approvedCodes.length}</p>
            <p className="text-xs text-grey-200">Approved</p>
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
            {pendingCodes.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                {pendingCodes.length}
              </span>
            )}
          </h2>
          <AdminPendingList pendingCodes={pendingCodes} onAction={handleAction} />
        </motion.section>

        {/* Approved Codes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Approved Codes
            {approvedCodes.length > 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                {approvedCodes.length}
              </span>
            )}
          </h2>
          <AdminApprovedList approvedCodes={approvedCodes} />
        </motion.section>
      </div>
    </div>
  );
}

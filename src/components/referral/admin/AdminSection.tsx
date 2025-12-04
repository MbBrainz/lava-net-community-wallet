"use client";

/**
 * AdminSection Component
 *
 * Admin panel wrapper for settings page.
 *
 * Behavior:
 * 1. Check if user is admin (from cache or API)
 * 2. If not admin → render nothing (component is invisible)
 * 3. If admin → render admin panel with pending/approved lists
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AdminPendingList } from "./AdminPendingList";
import { AdminApprovedList } from "./AdminApprovedList";
import {
  getAdminStatus,
  saveAdminStatus,
  AdminReferralsResponse,
} from "@/lib/referral";

interface AdminSectionProps {
  userEmail: string;
}

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

export function AdminSection({ userEmail }: AdminSectionProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCodes, setPendingCodes] = useState<PendingCode[]>([]);
  const [approvedCodes, setApprovedCodes] = useState<ApprovedCode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/check?email=${encodeURIComponent(userEmail)}`
      );
      const data = await response.json();

      setIsAdmin(data.isAdmin);
      saveAdminStatus({ userEmail, isAdmin: data.isAdmin });

      return data.isAdmin;
    } catch (error) {
      console.error("[AdminSection] Failed to check admin status:", error);
      setIsAdmin(false);
      return false;
    }
  }, [userEmail]);

  const fetchReferrals = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/referrals?email=${encodeURIComponent(userEmail)}`
      );
      const data: AdminReferralsResponse = await response.json();

      if ("error" in data) {
        throw new Error((data as { message?: string }).message || "Failed to fetch referrals");
      }

      setPendingCodes(data.pending);
      setApprovedCodes(data.approved);
    } catch (error) {
      console.error("[AdminSection] Failed to fetch referrals:", error);
      setError("Failed to load referral data");
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      // Check localStorage cache first
      const cached = getAdminStatus(userEmail);

      if (cached?.isAdmin === true) {
        // Use cache, is admin
        setIsAdmin(true);
        setIsLoading(false);
        await fetchReferrals();
        return;
      }

      if (cached?.isAdmin === false) {
        // Use cache, not admin
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // No cache, check API
      const isAdminResult = await checkAdminStatus();
      setIsLoading(false);

      if (isAdminResult) {
        await fetchReferrals();
      }
    };

    init();
  }, [userEmail, checkAdminStatus, fetchReferrals]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReferrals();
    setIsRefreshing(false);
  };

  const handleAction = async (code: string, action: "approve" | "reject") => {
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: userEmail,
          code,
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the lists
        await fetchReferrals();
      } else {
        setError(data.message || `Failed to ${action} code`);
      }
    } catch (error) {
      console.error("[AdminSection] Action failed:", error);
      setError(`Failed to ${action} code`);
    }
  };

  // Still loading
  if (isLoading) {
    return null; // Don't show loading for admin section, just hide it
  }

  // Not admin - render nothing
  if (!isAdmin) {
    return null;
  }

  // Admin - render panel
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-lava-orange" />
          <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <Card variant="outline" className="border-lava-orange/20">
        {/* Pending Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            Pending Requests
            {pendingCodes.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                {pendingCodes.length}
              </span>
            )}
          </h3>
          <AdminPendingList pendingCodes={pendingCodes} onAction={handleAction} />
        </div>

        {/* Divider */}
        <div className="border-t border-grey-425/30 my-6" />

        {/* Approved Section */}
        <div>
          <h3 className="text-sm font-semibold text-grey-100 mb-3 flex items-center gap-2">
            Approved Codes
            {approvedCodes.length > 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                {approvedCodes.length}
              </span>
            )}
          </h3>
          <AdminApprovedList approvedCodes={approvedCodes} />
        </div>
      </Card>
    </motion.section>
  );
}


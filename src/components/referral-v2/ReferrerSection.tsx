"use client";

/**
 * ReferrerSection Component (v2)
 *
 * Wrapper for settings page that handles referrer status fetching.
 * Shows different UI based on whether user is:
 * - Not a referrer → BecomeReferrerForm
 * - Pending → PendingStatus
 * - Approved → ApprovedStatus with link to dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { BecomeReferrerForm } from "./BecomeReferrerForm";
import { ReferrerPendingStatus } from "./ReferrerPendingStatus";
import { ReferrerApprovedStatus } from "./ReferrerApprovedStatus";
import { useAuthFetch } from "@/lib/auth/client";
import type { ReferrerStatusResponse } from "@/lib/referral/types-v2";

interface ReferrerSectionProps {
  userEmail: string;
}

type Status = "loading" | "none" | "pending" | "approved";

interface ReferrerCode {
  code: string;
  label: string | null;
  isActive: boolean;
  usageCount: number;
}

interface StatusData {
  referrerId?: string;
  requestedAt?: string;
  approvedAt?: string;
  canSendNotifications?: boolean;
  codes?: ReferrerCode[];
}

export function ReferrerSection({ userEmail }: ReferrerSectionProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [statusData, setStatusData] = useState<StatusData>({});
  const { authFetch, isReady } = useAuthFetch();

  const fetchStatus = useCallback(async () => {
    if (!isReady) return;

    try {
      const response = await authFetch("/api/referrals-v2/status");

      if (response.status === 401) {
        console.error("[ReferrerSection] Not authenticated");
        setStatus("none");
        return;
      }

      const data: ReferrerStatusResponse = await response.json();

      if (data.status === "none") {
        setStatus("none");
        setStatusData({});
      } else if (data.status === "pending") {
        setStatus("pending");
        setStatusData({
          requestedAt: data.requestedAt,
        });
      } else if (data.status === "approved") {
        setStatus("approved");
        setStatusData({
          referrerId: data.referrerId,
          approvedAt: data.approvedAt,
          canSendNotifications: data.canSendNotifications,
          codes: data.codes,
        });
      }
    } catch (error) {
      console.error("[ReferrerSection] Failed to fetch status:", error);
      setStatus("none");
    }
  }, [authFetch, isReady]);

  useEffect(() => {
    if (!userEmail) {
      setStatus("none");
      return;
    }

    if (isReady) {
      fetchStatus();
    }
  }, [userEmail, isReady, fetchStatus]);

  const handleBecomeRequested = (requestedAt: string) => {
    setStatus("pending");
    setStatusData({ requestedAt });
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // Not a referrer yet - show become form
  if (status === "none") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
          <p className="text-sm text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-300">Note:</span> The referral program is
            exclusively for recognized members of the Lava community. Requests from unknown
            applicants will be declined.
          </p>
        </div>
        <BecomeReferrerForm onSuccess={handleBecomeRequested} />
      </div>
    );
  }

  // Pending approval
  if (status === "pending" && statusData.requestedAt) {
    return <ReferrerPendingStatus requestedAt={statusData.requestedAt} />;
  }

  // Approved
  if (status === "approved" && statusData.codes) {
    return (
      <ReferrerApprovedStatus
        codes={statusData.codes}
        canSendNotifications={statusData.canSendNotifications || false}
      />
    );
  }

  return null;
}


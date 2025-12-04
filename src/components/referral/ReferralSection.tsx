"use client";

/**
 * ReferralSection Component
 *
 * Wrapper for settings page that handles status fetching and caching.
 *
 * Behavior:
 * 1. Get user email from props
 * 2. Check localStorage cache
 * 3. If approved in cache → use cache (NO API call)
 * 4. Otherwise → fetch from API, update cache
 * 5. Render appropriate child component
 */

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReferralRequestForm } from "./ReferralRequestForm";
import { ReferralPendingStatus } from "./ReferralPendingStatus";
import { ReferralApprovedStatus } from "./ReferralApprovedStatus";
import {
  getReferralStatus,
  saveReferralStatus,
  ReferralStatusResponse,
} from "@/lib/referral";

interface ReferralSectionProps {
  userEmail: string;
  dynamicUserId: string;
}

type Status = "loading" | "none" | "pending" | "approved";

interface StatusData {
  code?: string;
  requestedAt?: string;
  approvedAt?: string;
}

export function ReferralSection({ userEmail, dynamicUserId }: ReferralSectionProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [statusData, setStatusData] = useState<StatusData>({});

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/referrals/status?email=${encodeURIComponent(userEmail)}`
      );
      const data: ReferralStatusResponse = await response.json();

      // Update state
      if (data.status === "none") {
        setStatus("none");
        setStatusData({});
        saveReferralStatus({ userEmail, status: "none" });
      } else if (data.status === "pending") {
        setStatus("pending");
        setStatusData({
          code: data.code,
          requestedAt: data.requestedAt,
        });
        saveReferralStatus({
          userEmail,
          status: "pending",
          code: data.code,
          requestedAt: data.requestedAt,
        });
      } else if (data.status === "approved") {
        setStatus("approved");
        setStatusData({
          code: data.code,
          requestedAt: data.requestedAt,
          approvedAt: data.approvedAt,
        });
        saveReferralStatus({
          userEmail,
          status: "approved",
          code: data.code,
          requestedAt: data.requestedAt,
          approvedAt: data.approvedAt,
        });
      }
    } catch (error) {
      console.error("[ReferralSection] Failed to fetch status:", error);
      setStatus("none");
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setStatus("none");
      return;
    }

    // Check localStorage cache first
    const cached = getReferralStatus(userEmail);

    if (cached) {
      // If approved in cache, use it without API call
      if (cached.status === "approved") {
        setStatus("approved");
        setStatusData({
          code: cached.code,
          requestedAt: cached.requestedAt,
          approvedAt: cached.approvedAt,
        });
        return;
      }

      // For pending/none, show cached value but refresh in background
      setStatus(cached.status);
      setStatusData({
        code: cached.code,
        requestedAt: cached.requestedAt,
        approvedAt: cached.approvedAt,
      });

      // Fetch fresh data (might have been approved)
      fetchStatus();
    } else {
      // No cache, fetch from API
      fetchStatus();
    }
  }, [userEmail, fetchStatus]);

  const handleCodeRequested = (code: string, requestedAt: string) => {
    setStatus("pending");
    setStatusData({ code, requestedAt });
    saveReferralStatus({
      userEmail,
      status: "pending",
      code,
      requestedAt,
    });
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

  // No code yet - show request form
  if (status === "none") {
    return (
      <ReferralRequestForm
        userEmail={userEmail}
        dynamicUserId={dynamicUserId}
        onSuccess={handleCodeRequested}
      />
    );
  }

  // Pending approval
  if (status === "pending" && statusData.code && statusData.requestedAt) {
    return (
      <ReferralPendingStatus
        code={statusData.code}
        requestedAt={statusData.requestedAt}
      />
    );
  }

  // Approved
  if (status === "approved" && statusData.code) {
    return <ReferralApprovedStatus code={statusData.code} />;
  }

  // Fallback - shouldn't reach here
  return null;
}


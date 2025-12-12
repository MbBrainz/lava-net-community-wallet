"use client";

/**
 * BecomeReferrerForm Component (v2)
 *
 * Simple form to request becoming a referrer.
 * No code input needed - codes are auto-generated after approval.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthFetch } from "@/lib/auth/client";

interface BecomeReferrerFormProps {
  onSuccess: (requestedAt: string) => void;
}

export function BecomeReferrerForm({ onSuccess }: BecomeReferrerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authFetch, isReady } = useAuthFetch();

  const handleSubmit = async () => {
    if (isSubmitting || !isReady) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authFetch("/api/referrals/become", {
        method: "POST",
      });

      const data = await response.json();

      if (response.status === 401) {
        setError("Please log in to become a referrer");
        return;
      }

      if (data.status === "pending" || data.status === "already_approved") {
        onSuccess(data.requestedAt || new Date().toISOString());
      } else if (data.error) {
        setError(data.message || "Failed to submit request");
      }
    } catch (err) {
      console.error("Request failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="glass">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-lava-orange/20 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5 text-lava-orange" />
          </div>
          <div>
            <h3 className="text-white font-medium">Become a Referrer</h3>
            <p className="text-sm text-grey-200 mt-1">
              Request to join our referral program and earn rewards for bringing new users to Lava
              Wallet.
            </p>
          </div>
        </div>

        <div className="pl-13 space-y-3">
          <ul className="text-sm text-grey-200 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              Create up to 20 unique referral codes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              Track your referrals in real-time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              Short 6-character codes, easy to share
            </li>
          </ul>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting || !isReady}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Request to Become a Referrer"
          )}
        </Button>

        <p className="text-xs text-grey-300 text-center">
          Your request will be reviewed by our team.
        </p>
      </div>
    </Card>
  );
}


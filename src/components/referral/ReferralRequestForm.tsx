"use client";

/**
 * ReferralRequestForm Component
 *
 * Form to request a referral code with real-time availability check.
 *
 * Features:
 * - Text input for code
 * - Real-time availability indicator (debounced)
 * - Character counter (X/20)
 * - Local validation (length, pattern)
 * - Submit button
 * - Error display
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthFetch } from "@/lib/auth/client";
import { validateCode, REFERRAL_CONFIG } from "@/lib/referral";

interface ReferralRequestFormProps {
  userEmail: string;
  dynamicUserId: string;
  onSuccess: (code: string, requestedAt: string) => void;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function ReferralRequestForm({
  userEmail,
  dynamicUserId,
  onSuccess,
}: ReferralRequestFormProps) {
  const [code, setCode] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { authFetch, isReady } = useAuthFetch();

  // Suppress unused variable warning - these are passed for context but auth comes from JWT
  void userEmail;
  void dynamicUserId;

  // Debounced availability check (public endpoint - no auth needed)
  useEffect(() => {
    if (!code) {
      setAvailability("idle");
      setValidationError(null);
      return;
    }

    // Local validation first
    const validation = validateCode(code);
    if (!validation.valid) {
      setValidationError(validation.error);
      setAvailability("invalid");
      return;
    }

    setValidationError(null);
    setAvailability("checking");

    const timer = setTimeout(async () => {
      try {
        // /api/referrals/check is a public endpoint (no auth required)
        const response = await fetch(
          `/api/referrals/check?code=${encodeURIComponent(code)}`
        );
        const data = await response.json();

        if (data.error === "invalid_format") {
          setValidationError(data.message);
          setAvailability("invalid");
        } else if (data.available) {
          setAvailability("available");
        } else {
          setAvailability("taken");
        }
      } catch (error) {
        console.error("Availability check failed:", error);
        setAvailability("idle");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (availability !== "available" || isSubmitting || !isReady) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Use authenticated fetch - email/userId come from JWT on server
      const response = await authFetch("/api/referrals/request", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setSubmitError("Please log in to request a code");
        return;
      }

      if (data.success) {
        onSuccess(data.code, data.requestedAt);
      } else {
        setSubmitError(data.message || "Failed to request code");
        if (data.error === "code_taken") {
          setAvailability("taken");
        }
      }
    } catch (error) {
      console.error("Request failed:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailabilityIndicator = () => {
    switch (availability) {
      case "checking":
        return <Loader2 className="w-4 h-4 text-grey-200 animate-spin" />;
      case "available":
        return <Check className="w-4 h-4 text-green-400" />;
      case "taken":
        return <X className="w-4 h-4 text-red-400" />;
      case "invalid":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return null;
    }
  };

  const getAvailabilityText = () => {
    switch (availability) {
      case "checking":
        return "Checking...";
      case "available":
        return "Available!";
      case "taken":
        return "Already taken";
      case "invalid":
        return validationError;
      default:
        return null;
    }
  };

  const getInputBorderColor = () => {
    switch (availability) {
      case "available":
        return "border-green-500/50 focus:border-green-500";
      case "taken":
        return "border-red-500/50 focus:border-red-500";
      case "invalid":
        return "border-amber-500/50 focus:border-amber-500";
      default:
        return "border-grey-425 focus:border-lava-orange";
    }
  };

  return (
    <Card variant="glass">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="referral-code"
            className="block text-sm font-medium text-grey-100 mb-2"
          >
            Choose your referral code
          </label>

          <div className="relative">
            <input
              id="referral-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="e.g., johndoe"
              maxLength={REFERRAL_CONFIG.CODE_MAX_LENGTH}
              className={`w-full px-4 py-3 bg-grey-650 border rounded-xl text-white placeholder-grey-300 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 transition-colors ${getInputBorderColor()}`}
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {getAvailabilityIndicator()}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <p
              className={`text-xs ${
                availability === "available"
                  ? "text-green-400"
                  : availability === "taken"
                  ? "text-red-400"
                  : availability === "invalid"
                  ? "text-amber-400"
                  : "text-grey-300"
              }`}
            >
              {getAvailabilityText() || "Letters, numbers, underscores, and hyphens only"}
            </p>
            <span className="text-xs text-grey-300">
              {code.length}/{REFERRAL_CONFIG.CODE_MAX_LENGTH}
            </span>
          </div>
        </div>

        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-sm text-red-400">{submitError}</p>
          </motion.div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={availability !== "available" || isSubmitting || !isReady}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Requesting...
            </>
          ) : (
            "Request Code"
          )}
        </Button>

        <p className="text-xs text-grey-300 text-center">
          Your code will be reviewed by our team before it becomes active.
        </p>
      </form>
    </Card>
  );
}

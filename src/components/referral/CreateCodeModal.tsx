"use client";

/**
 * CreateCodeModal Component
 *
 * Modal for creating a new referral code with optional UTM tracking parameters.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Tag, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuthFetch } from "@/lib/auth/client";

interface CreateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCodeModal({ isOpen, onClose, onSuccess }: CreateCodeModalProps) {
  const [label, setLabel] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [showUTM, setShowUTM] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authFetch, isReady } = useAuthFetch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !isReady) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authFetch("/api/referrals/codes", {
        method: "POST",
        body: JSON.stringify({
          label: label.trim() || undefined,
          utmSource: utmSource.trim() || undefined,
          utmMedium: utmMedium.trim() || undefined,
          utmCampaign: utmCampaign.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setError("Please log in again");
        return;
      }

      if (data.error) {
        setError(data.message || "Failed to create code");
        return;
      }

      // Success - reset and close
      handleClose();
      onSuccess();
    } catch (err) {
      console.error("Failed to create code:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLabel("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setShowUTM(false);
    setError(null);
    onClose();
  };

  const hasUtmValues = utmSource || utmMedium || utmCampaign;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Code">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Label Input */}
        <div>
          <label
            htmlFor="code-label"
            className="block text-sm font-medium text-grey-100 mb-2"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Label (optional)
            </div>
          </label>
          <input
            id="code-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Main link, Bio link"
            maxLength={100}
            className="w-full px-4 py-3 bg-grey-650 border border-grey-425 rounded-xl text-white placeholder-grey-300 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 focus:border-lava-orange transition-colors"
          />
          <p className="text-xs text-grey-300 mt-1.5">
            A friendly name to help you recognize this code
          </p>
        </div>

        {/* UTM Parameters Section */}
        <div className="border border-grey-425/50 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowUTM(!showUTM)}
            className="w-full flex items-center justify-between p-3 bg-grey-650/50 hover:bg-grey-650 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-grey-100">
              <BarChart3 className="w-4 h-4" />
              UTM Tracking
              {hasUtmValues && (
                <span className="px-1.5 py-0.5 bg-lava-orange/20 text-lava-orange text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
            {showUTM ? (
              <ChevronUp className="w-4 h-4 text-grey-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-grey-300" />
            )}
          </button>

          <AnimatePresence>
            {showUTM && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3 border-t border-grey-425/50">
                  <p className="text-xs text-grey-300">
                    Add UTM parameters to track performance in analytics tools
                  </p>

                  {/* UTM Source */}
                  <div>
                    <label htmlFor="utm-source" className="block text-xs font-medium text-grey-200 mb-1">
                      Source
                    </label>
                    <input
                      id="utm-source"
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="e.g., twitter, youtube, discord"
                      maxLength={100}
                      className="w-full px-3 py-2 bg-grey-650 border border-grey-425 rounded-lg text-white text-sm placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 focus:border-lava-orange transition-colors"
                    />
                  </div>

                  {/* UTM Medium */}
                  <div>
                    <label htmlFor="utm-medium" className="block text-xs font-medium text-grey-200 mb-1">
                      Medium
                    </label>
                    <input
                      id="utm-medium"
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="e.g., social, video, banner"
                      maxLength={100}
                      className="w-full px-3 py-2 bg-grey-650 border border-grey-425 rounded-lg text-white text-sm placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 focus:border-lava-orange transition-colors"
                    />
                  </div>

                  {/* UTM Campaign */}
                  <div>
                    <label htmlFor="utm-campaign" className="block text-xs font-medium text-grey-200 mb-1">
                      Campaign
                    </label>
                    <input
                      id="utm-campaign"
                      type="text"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="e.g., summer2024, launch, promo"
                      maxLength={100}
                      className="w-full px-3 py-2 bg-grey-650 border border-grey-425 rounded-lg text-white text-sm placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 focus:border-lava-orange transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-grey-650/50 rounded-lg">
          <p className="text-sm text-grey-200">
            A unique 6-character code will be automatically generated.
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isReady}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

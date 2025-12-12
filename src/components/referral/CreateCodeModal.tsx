"use client";

/**
 * CreateCodeModal Component
 *
 * Modal for creating a new referral code with an optional label.
 * UTM parameters are captured at signup time, not on the code.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Tag } from "lucide-react";
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
    setError(null);
    onClose();
  };

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
            placeholder="e.g., Twitter link, Discord bio"
            maxLength={100}
            className="w-full px-4 py-3 bg-grey-650 border border-grey-425 rounded-xl text-white placeholder-grey-300 focus:outline-none focus:ring-2 focus:ring-lava-orange/30 focus:border-lava-orange transition-colors"
          />
          <p className="text-xs text-grey-300 mt-1.5">
            A friendly name to help you recognize this code
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-grey-650/50 rounded-lg space-y-2">
          <p className="text-sm text-grey-200">
            A unique 6-character code will be automatically generated.
          </p>
          <p className="text-xs text-grey-300">
            💡 Tip: Add UTM parameters to your links for tracking (e.g., ?ref=CODE&utm_source=twitter)
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

"use client";

/**
 * ReferralShareBuilder Component
 *
 * Interactive link builder with tag/source inputs.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ReferralShareBuilderProps {
  code: string;
  baseUrl?: string;
}

export function ReferralShareBuilder({
  code,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: ReferralShareBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tag, setTag] = useState("");
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const url = new URL(baseUrl || "https://app.lavanet.xyz");
    url.searchParams.set("ref", code);
    if (tag.trim()) {
      url.searchParams.set("tag", tag.trim());
    }
    if (source.trim()) {
      url.searchParams.set("source", source.trim());
    }
    return url.toString();
  }, [baseUrl, code, tag, source]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Card variant="glass">
      <div className="space-y-4">
        {/* Basic link display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-grey-100">Your Referral Link</p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-lava-orange hover:text-lava-orange/80 transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              {isExpanded ? "Simple link" : "Customize link"}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-grey-650 rounded-lg overflow-hidden">
              <p className="text-sm text-white font-mono truncate">{referralLink}</p>
            </div>
            <Button variant="secondary" onClick={handleCopy} className="shrink-0">
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded customization */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-grey-425/30 space-y-4">
                <div>
                  <label className="block text-sm text-grey-200 mb-2">
                    Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g., twitter-jan2024"
                    className="w-full px-3 py-2 bg-grey-650 border border-grey-425 rounded-lg text-white placeholder-grey-300 text-sm focus:outline-none focus:border-lava-orange"
                  />
                  <p className="text-xs text-grey-300 mt-1">
                    Track which campaigns bring the most referrals
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-grey-200 mb-2">
                    Source (optional)
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., twitter, youtube, discord"
                    className="w-full px-3 py-2 bg-grey-650 border border-grey-425 rounded-lg text-white placeholder-grey-300 text-sm focus:outline-none focus:border-lava-orange"
                  />
                  <p className="text-xs text-grey-300 mt-1">
                    Categorize by platform or channel
                  </p>
                </div>

                {/* Preview */}
                <div className="p-3 bg-grey-650/50 rounded-lg">
                  <p className="text-xs text-grey-300 mb-1">Live Preview</p>
                  <p className="text-sm text-lava-orange font-mono break-all">
                    {referralLink}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}


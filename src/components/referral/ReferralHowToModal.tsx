"use client";

/**
 * ReferralHowToModal Component
 *
 * Explains how tags and source params work.
 */

import { Modal } from "@/components/ui/Modal";
import { Tag, MapPin, Lightbulb } from "lucide-react";

interface ReferralHowToModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralHowToModal({ isOpen, onClose }: ReferralHowToModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How Referral Links Work" size="md">
      <div className="space-y-6">
        {/* Basic Link */}
        <div>
          <p className="text-sm text-grey-100 mb-2">Your basic referral link:</p>
          <div className="p-3 bg-grey-650 rounded-lg">
            <code className="text-sm text-lava-orange break-all">
              https://app.lavanet.xyz/?ref=yourcode
            </code>
          </div>
        </div>

        {/* Tags Section */}
        <div className="pt-4 border-t border-grey-425/30">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-lava-orange" />
            <h3 className="font-semibold text-white">Adding Tags</h3>
          </div>
          <p className="text-sm text-grey-200 mb-3">
            Tags help you track WHERE your referrals come from. Add{" "}
            <code className="text-lava-orange">?tag=</code> to your link with any
            value you want:
          </p>
          <div className="space-y-2">
            <ExampleLink
              label="Twitter campaign"
              link="?ref=yourcode&tag=twitter-jan2024"
            />
            <ExampleLink
              label="YouTube video"
              link="?ref=yourcode&tag=youtube-tutorial"
            />
            <ExampleLink
              label="Newsletter"
              link="?ref=yourcode&tag=newsletter-issue42"
            />
          </div>
        </div>

        {/* Source Section */}
        <div className="pt-4 border-t border-grey-425/30">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-lava-orange" />
            <h3 className="font-semibold text-white">Adding Source</h3>
          </div>
          <p className="text-sm text-grey-200 mb-3">
            Source is another way to categorize by platform:
          </p>
          <div className="space-y-2">
            <ExampleLink label="From Twitter" link="?ref=yourcode&source=twitter" />
            <ExampleLink
              label="Combined"
              link="?ref=yourcode&source=discord&tag=announcement"
            />
          </div>
        </div>

        {/* Tips Section */}
        <div className="pt-4 border-t border-grey-425/30">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white">Tips</h3>
          </div>
          <ul className="text-sm text-grey-200 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              Use tags consistently to compare results
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              Tags and source are optional
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              You can use both together
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lava-orange">•</span>
              They appear in your dashboard for each referral
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function ExampleLink({ label, link }: { label: string; link: string }) {
  return (
    <div className="p-2 bg-grey-650/50 rounded-lg">
      <p className="text-xs text-grey-300 mb-1">{label}:</p>
      <code className="text-xs text-lava-orange break-all">{link}</code>
    </div>
  );
}


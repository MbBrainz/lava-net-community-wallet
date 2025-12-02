"use client";

import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-sm"
      >
        {/* Mascot */}
        <div className="mb-6">
          <Image
            src="/lava-brand-kit/mascots/mascot-fennec-sleep.png"
            alt="Sleeping fennec"
            width={120}
            height={120}
            className="mx-auto opacity-80"
          />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-grey-425/50 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-grey-200" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="text-grey-200 mb-6">
          It looks like you&apos;ve lost your internet connection. Some features may
          be unavailable until you&apos;re back online.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button fullWidth onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <p className="text-xs text-grey-200">
            Your cached data is still available. You can view your last known
            balance on the home screen.
          </p>
        </div>
      </motion.div>
    </div>
  );
}


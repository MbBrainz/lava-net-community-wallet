"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, ArrowDown, Smartphone, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { isIOS, isAndroid } from "@/lib/utils";
import Image from "next/image";

export function InstallPrompt() {
  const {
    isInstalled,
    canInstall,
    installPromptEvent,
    setInstallPromptEvent,
    showInstallBanner,
    setShowInstallBanner,
  } = useApp();

  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed the banner before
  useEffect(() => {
    const wasDismissed = localStorage.getItem("installBannerDismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setDismissed(true);
    localStorage.setItem("installBannerDismissed", "true");
  };

  const handleInstallClick = async () => {
    if (isIOS()) {
      setShowIOSModal(true);
      return;
    }

    if (installPromptEvent) {
      setInstalling(true);
      try {
        await installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === "accepted") {
          setShowInstallBanner(false);
        }
      } catch {
        console.log("Install prompt failed");
      } finally {
        setInstalling(false);
        setInstallPromptEvent(null);
      }
    }
  };

  // Don't show if installed or dismissed
  if (isInstalled || dismissed || !showInstallBanner) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-[calc(var(--bottom-nav-height)+16px)] left-4 right-4 z-40 safe-area-bottom"
          >
            <div className="glass-card rounded-2xl p-4 shadow-lg">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-2 text-grey-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4">
                {/* App Icon */}
                <div className="w-14 h-14 rounded-xl bg-lava-gradient flex items-center justify-center overflow-hidden shadow-lg lava-glow">
                  <Image
                    src="/lava-brand-kit/logos/logo-symbol-white.png"
                    alt="Lava"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">
                    Install Lava Wallet
                  </h3>
                  <p className="text-grey-200 text-xs mt-0.5 line-clamp-2">
                    Add to your home screen for the best experience
                  </p>
                </div>
                
                <button
                  onClick={handleInstallClick}
                  disabled={installing || (!canInstall && !isIOS())}
                  className="flex items-center gap-2 bg-lava-orange hover:bg-lava-spanish-orange disabled:bg-grey-425 disabled:text-grey-200 text-white font-semibold px-4 py-2.5 rounded-xl transition-all touch-feedback"
                >
                  {installing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Install</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-grey-550 rounded-t-3xl safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-grey-425 rounded-full" />
              </div>

              <div className="px-6 pb-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-lava-gradient flex items-center justify-center overflow-hidden shadow-xl lava-glow">
                    <Image
                      src="/lava-brand-kit/logos/logo-symbol-white.png"
                      alt="Lava"
                      width={48}
                      height={48}
                      className="w-12 h-12"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Install Lava Wallet
                    </h2>
                    <p className="text-grey-200 text-sm">
                      Add to your home screen
                    </p>
                  </div>
                </div>

                {/* Safari Instructions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-grey-100 uppercase tracking-wider">
                    Install from Safari
                  </h3>

                  {/* Step 1 */}
                  <div className="flex items-start gap-4 p-4 bg-grey-650/50 rounded-xl">
                    <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lava-orange font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Tap the Share button
                      </p>
                      <p className="text-grey-200 text-sm mt-1">
                        Look for the share icon at the bottom of Safari
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-[#007AFF]/20 rounded-lg flex items-center justify-center">
                      <Share className="w-5 h-5 text-[#007AFF]" />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4 p-4 bg-grey-650/50 rounded-xl">
                    <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lava-orange font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Scroll and tap "Add to Home Screen"
                      </p>
                      <p className="text-grey-200 text-sm mt-1">
                        You may need to scroll down in the share menu
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-grey-425 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4 p-4 bg-grey-650/50 rounded-xl">
                    <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lava-orange font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Tap "Add" to install
                      </p>
                      <p className="text-grey-200 text-sm mt-1">
                        The app will appear on your home screen
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mt-6 p-4 bg-lava-orange/10 border border-lava-orange/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-lava-orange" />
                    <p className="text-sm text-grey-100">
                      Installing gives you <span className="text-white font-medium">push notifications</span>, 
                      <span className="text-white font-medium"> offline access</span>, and a 
                      <span className="text-white font-medium"> native app experience</span>.
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full mt-6 py-3.5 bg-grey-425 hover:bg-grey-200/20 text-white font-semibold rounded-xl transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Small install hint that can be shown in cards
export function InstallHint({ className = "" }: { className?: string }) {
  const { isInstalled, showInstallBanner, setShowInstallBanner } = useApp();

  if (isInstalled) return null;

  return (
    <button
      onClick={() => setShowInstallBanner(true)}
      className={`flex items-center gap-2 text-lava-orange hover:text-lava-spanish-orange transition-colors ${className}`}
    >
      <ArrowDown className="w-4 h-4" />
      <span className="text-sm font-medium">Install App</span>
    </button>
  );
}



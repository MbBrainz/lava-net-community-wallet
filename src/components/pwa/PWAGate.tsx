"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share,
  Plus,
  Check,
  Smartphone,
  Shield,
  Zap,
  Wifi,
  MoreHorizontal,
  Download,
  ChevronDown,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { isIOS, isAndroid, isPWA } from "@/lib/utils";

// Storage key for tracking iOS PWA first launch
const IOS_PWA_LAUNCHED_KEY = "lava_ios_pwa_launched";

interface PWAGateProps {
  children: ReactNode;
}

export function PWAGate({ children }: PWAGateProps) {
  const {
    isInstalled,
    canInstall,
    installPromptEvent,
    setInstallPromptEvent,
  } = useApp();
  
  const { isAuthenticated, isInitialized } = useAuth();

  const [installing, setInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);
  const [shouldShowGate, setShouldShowGate] = useState(false);
  const [showIOSWelcomeBack, setShowIOSWelcomeBack] = useState(false);

  // Wait for client-side hydration and check PWA status
  useEffect(() => {
    setMounted(true);
    // Delay the check to ensure all PWA detection is complete
    const timer = setTimeout(() => {
      // Environment variable controls:
      // NEXT_PUBLIC_SKIP_PWA_GATE=true → Always skip the gate
      // NEXT_PUBLIC_FORCE_PWA_GATE=true → Always show the gate (for testing on localhost)
      const skipPwaGate = process.env.NEXT_PUBLIC_SKIP_PWA_GATE === "true";
      const forcePwaGate = process.env.NEXT_PUBLIC_FORCE_PWA_GATE === "true";
      
      // Check if on localhost
      const isLocalhost = window.location.hostname === "localhost" || 
                          window.location.hostname === "127.0.0.1" ||
                          window.location.hostname.startsWith("192.168.");
      
      // Skip if explicitly told to skip
      if (skipPwaGate) {
        setShouldShowGate(false);
        setCheckComplete(true);
        return;
      }
      
      // Skip on localhost unless force is enabled
      if (isLocalhost && !forcePwaGate) {
        setShouldShowGate(false);
        setCheckComplete(true);
        return;
      }
      
      // Check for iOS PWA first launch (user needs to re-login)
      const isPwaMode = isInstalled || isPWA();
      if (isPwaMode && isIOS()) {
        const hasLaunchedBefore = localStorage.getItem(IOS_PWA_LAUNCHED_KEY);
        if (!hasLaunchedBefore) {
          // First launch in iOS PWA - show welcome back message
          setShowIOSWelcomeBack(true);
          localStorage.setItem(IOS_PWA_LAUNCHED_KEY, "true");
        }
      }
      
      const installed = isPwaMode;
      setShouldShowGate(!installed);
      setCheckComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [isInstalled]);

  // Handle Android/Chrome install
  const handleInstallClick = async () => {
    if (installPromptEvent) {
      setInstalling(true);
      try {
        await installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === "accepted") {
          // App will reload in standalone mode
        }
      } catch {
        console.log("Install prompt failed");
      } finally {
        setInstalling(false);
        setInstallPromptEvent(null);
      }
    }
  };

  // Show loading spinner during initial check (only if auth is initialized)
  if (!mounted || !checkComplete || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <div className="w-8 h-8 border-2 border-lava-orange/30 border-t-lava-orange rounded-full animate-spin" />
      </div>
    );
  }

  // IMPORTANT: Skip the gate for unauthenticated users
  // This allows the login page to render so users can authenticate first
  // The gate will show after they log in
  if (!isAuthenticated) {
    // Show iOS welcome back overlay if this is first PWA launch on iOS
    // This helps iOS users understand they need to re-login after installing
    if (showIOSWelcomeBack) {
      return (
        <>
          <IOSWelcomeBack onDismiss={() => setShowIOSWelcomeBack(false)} />
          {children}
        </>
      );
    }
    return <>{children}</>;
  }

  // If already installed as PWA, render children
  if (!shouldShowGate) {
    return <>{children}</>;
  }

  // Show mandatory install screen
  return (
    <div className="min-h-screen flex flex-col bg-grey-650 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lava-orange/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lava-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-[300px] h-[300px] bg-lava-gold-drop/5 rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 safe-area-top safe-area-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center"
        >
          {/* Logo and App Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 rounded-[28px] bg-lava-gradient flex items-center justify-center shadow-2xl lava-glow-intense">
              <Image
                src="/lava-brand-kit/logos/logo-symbol-white.png"
                alt="Lava Wallet"
                width={64}
                height={64}
                className="w-16 h-16"
                priority
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white text-center mb-2"
          >
            Install Lava Wallet
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-grey-200 text-center mb-8 text-lg"
          >
            Add to your home screen to continue
          </motion.p>

          {/* Why Install Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full mb-8"
          >
            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="w-full flex items-center justify-between px-4 py-3 bg-grey-550/50 rounded-xl border border-grey-425/50 mb-3"
            >
              <span className="text-grey-100 font-medium text-sm">Why do I need to install this?</span>
              <ChevronDown className={`w-4 h-4 text-grey-200 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMoreInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pb-4">
                    <WhyCard
                      icon={<Shield className="w-5 h-5" />}
                      title="Enhanced Security"
                      description="Runs in an isolated environment, protecting your wallet from browser extensions and malicious scripts"
                      color="green"
                    />
                    <WhyCard
                      icon={<Wifi className="w-5 h-5" />}
                      title="Offline Access"
                      description="Check your balances and transaction history even without an internet connection"
                      color="blue"
                    />
                    <WhyCard
                      icon={<Zap className="w-5 h-5" />}
                      title="Native Experience"
                      description="Full-screen app with smooth animations, push notifications, and instant launch from home screen"
                      color="orange"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Platform-specific Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full"
          >
            {isIOS() ? (
              <IOSInstructions />
            ) : canInstall ? (
              <AndroidInstallButton
                onInstall={handleInstallClick}
                installing={installing}
              />
            ) : (
              <GenericInstructions />
            )}
          </motion.div>

          {/* Security note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center gap-2 text-grey-200 text-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Your keys, your crypto. Always.</span>
          </motion.div>

          {/* Dev-only logout button */}
          {process.env.NODE_ENV === "development" && (
            <DevLogoutButton />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative p-4 text-center safe-area-bottom">
        <Image
          src="/lava-brand-kit/logos/logo-wordmark-white.svg"
          alt="Lava"
          width={224}
          height={67}
          className="mx-auto opacity-20 w-[50%] max-w-[224px] h-auto"
        />
      </div>
    </div>
  );
}

// Why Card Component
function WhyCard({
  icon,
  title,
  description,
  color,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: "green" | "blue" | "orange";
}) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    orange: "bg-lava-orange/10 text-lava-orange border-lava-orange/20",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        <p className="text-grey-200 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// iOS Instructions Component
function IOSInstructions() {
  return (
    <motion.div 
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.01, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,57,0,0.3), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="relative">
        <h3 className="text-sm font-semibold text-grey-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Install on iOS (Safari)
        </h3>

        <div className="space-y-4">
          {/* Step 1 - with pulsing indicator */}
          <motion.div 
            className="flex items-start gap-4"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lava-orange font-bold text-sm">1</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Tap the Share button</p>
              <p className="text-grey-200 text-xs mt-0.5">At the bottom of your Safari browser</p>
            </div>
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-[#007AFF]/30 rounded-lg"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="w-9 h-9 bg-[#007AFF]/20 rounded-lg flex items-center justify-center relative">
                <Share className="w-4 h-4 text-[#007AFF]" />
              </div>
            </div>
          </motion.div>

          <div className="h-px bg-grey-425/50" />

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lava-orange font-bold text-sm">2</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Tap &quot;Add to Home Screen&quot;</p>
              <p className="text-grey-200 text-xs mt-0.5">Scroll down in the share menu if needed</p>
            </div>
            <div className="w-9 h-9 bg-grey-425/50 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="h-px bg-grey-425/50" />

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lava-orange font-bold text-sm">3</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Tap &quot;Add&quot; to confirm</p>
              <p className="text-grey-200 text-xs mt-0.5">Then open Lava Wallet from your home screen</p>
            </div>
            <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>

        {/* Visual hint - bouncing arrow */}
        <div className="mt-5 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-xs text-lava-orange font-medium">Look for the share icon below ↓</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            >
              <ChevronDown className="w-6 h-6 text-lava-orange" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Android Install Button Component
function AndroidInstallButton({
  onInstall,
  installing,
}: {
  onInstall: () => void;
  installing: boolean;
}) {
  return (
    <motion.div 
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.01, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,57,0,0.3), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative">
        <h3 className="text-sm font-semibold text-grey-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Install App
        </h3>

        {/* Pulsing button container */}
        <div className="relative">
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 bg-lava-orange/20 rounded-xl"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 bg-lava-orange/10 rounded-xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          
          <motion.button
            onClick={onInstall}
            disabled={installing}
            className="relative w-full flex items-center justify-center gap-3 bg-lava-gradient hover:brightness-110 disabled:opacity-70 text-white font-semibold px-6 py-4 rounded-xl transition-all touch-feedback shadow-lg lava-glow"
            animate={!installing ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {installing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Download className="w-5 h-5" />
                </motion.div>
                <span className="text-lg">Install Now</span>
              </>
            )}
          </motion.button>
        </div>

        <motion.p 
          className="text-lava-orange text-xs text-center mt-4 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ↑ Tap the button to add Lava Wallet to your home screen
        </motion.p>
      </div>
    </motion.div>
  );
}

// Generic Instructions (Desktop or unsupported browsers)
function GenericInstructions() {
  const [isChrome, setIsChrome] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsChrome(/Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent));
    setIsDesktop(!isIOS() && !isAndroid());
  }, []);

  return (
    <motion.div 
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.01, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,57,0,0.3), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative">
        <h3 className="text-sm font-semibold text-grey-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          {isDesktop ? "Install on Desktop" : "Install App"}
        </h3>

      <div className="space-y-4">
        {isChrome ? (
          <>
            {/* Chrome Desktop Instructions */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lava-orange font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  Click the install icon in the address bar
                </p>
                <p className="text-grey-200 text-xs mt-0.5">
                  Look for the + or download icon on the right side
                </p>
              </div>
              <div className="w-9 h-9 bg-grey-425/50 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="h-px bg-grey-425/50" />

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lava-orange font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  Click &quot;Install&quot; in the popup
                </p>
                <p className="text-grey-200 text-xs mt-0.5">
                  The app will open in its own window
                </p>
              </div>
              <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Generic browser instructions */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lava-orange font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  Open the browser menu
                </p>
                <p className="text-grey-200 text-xs mt-0.5">
                  Usually the three dots (⋮) or lines (≡) icon
                </p>
              </div>
              <div className="w-9 h-9 bg-grey-425/50 rounded-lg flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="h-px bg-grey-425/50" />

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lava-orange font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  Select &quot;Install app&quot; or &quot;Add to Home Screen&quot;
                </p>
                <p className="text-grey-200 text-xs mt-0.5">
                  The option varies by browser
                </p>
              </div>
              <div className="w-9 h-9 bg-grey-425/50 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="h-px bg-grey-425/50" />

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lava-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lava-orange font-bold text-sm">3</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  Confirm the installation
                </p>
                <p className="text-grey-200 text-xs mt-0.5">
                  Then open Lava Wallet from your apps
                </p>
              </div>
              <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </>
        )}
      </div>

        {/* Recommendation */}
        <motion.div 
          className="mt-5 p-3 bg-lava-orange/10 border border-lava-orange/20 rounded-xl"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-xs text-grey-100">
            <span className="text-lava-orange font-semibold">Tip:</span> For the best experience, use{" "}
            {isDesktop ? "Chrome or Edge" : "Safari (iOS) or Chrome (Android)"}.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Dev-only logout button for testing PWA gate flow
function DevLogoutButton() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-6"
    >
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 text-grey-200 hover:text-white text-xs mx-auto px-3 py-2 rounded-lg border border-grey-425/50 hover:border-grey-200/50 transition-colors disabled:opacity-50"
      >
        <LogIn className="w-3.5 h-3.5 rotate-180" />
        <span>{isLoggingOut ? "Logging out..." : "Dev: Logout"}</span>
      </button>
    </motion.div>
  );
}

// iOS Welcome Back Component - shown on first PWA launch when user needs to re-login
function IOSWelcomeBack({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm glass-card rounded-2xl p-6 text-center"
      >
        {/* Welcome icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-lava-orange/20 flex items-center justify-center mx-auto mb-5"
        >
          <LogIn className="w-10 h-10 text-lava-orange" />
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-2">
          Welcome to Lava Wallet!
        </h2>
        
        <p className="text-grey-200 text-sm mb-6">
          You&apos;ve successfully installed the app. Please sign in to access your wallet.
        </p>

        <div className="p-3 bg-grey-550/50 rounded-xl mb-6">
          <p className="text-xs text-grey-100">
            <span className="text-lava-orange font-medium">Note:</span> For security reasons, iOS requires you to sign in again after installing the app.
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="w-full flex items-center justify-center gap-2 bg-lava-gradient hover:brightness-110 text-white font-semibold px-6 py-3.5 rounded-xl transition-all"
        >
          <span>Continue to Sign In</span>
        </button>
      </motion.div>
    </motion.div>
  );
}


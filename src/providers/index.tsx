"use client";

// TODO: Add React Error Boundaries around providers to gracefully handle:
// - Dynamic SDK initialization failures
// - Network/RPC errors during balance fetching
// - Auth state inconsistencies
// Consider using react-error-boundary package for production.

import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import { DynamicProvider } from "./DynamicProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { SwapProvider } from "@/context/SwapContext";
import { BottomNav } from "@/components/navigation/BottomNav";
import { PWAGate } from "@/components/pwa/PWAGate";
import { ProtectedLayout } from "@/components/auth/ProtectedLayout";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { PushHandler } from "@/components/notifications";

// Routes that should not show the bottom navigation
const AUTH_ROUTES = ["/login", "/offline"];

interface ProvidersProps {
  children: ReactNode;
}

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Auth routes render without bottom nav and app container styling
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Authenticated routes get the full app shell with PWA gate and navigation
  return (
    <PWAGate>
      <div className="app-container min-h-screen pb-[var(--bottom-nav-height)]">
        <main className="safe-area-top">{children}</main>
      </div>
      <BottomNav />
    </PWAGate>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DynamicProvider>
      <AuthProvider>
        <AppProvider>
          <SwapProvider>
            {/* ReferralCapture runs first, before any gates, to capture URL params */}
            {/* Wrapped in Suspense because useSearchParams requires it for static generation */}
            <Suspense fallback={null}>
              <ReferralCapture />
            </Suspense>
            {/* PushHandler for foreground notifications */}
            <PushHandler />
            <ProtectedLayout>
              <AppContent>{children}</AppContent>
            </ProtectedLayout>
          </SwapProvider>
        </AppProvider>
      </AuthProvider>
    </DynamicProvider>
  );
}

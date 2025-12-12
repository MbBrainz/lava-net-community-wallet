"use client";

// TODO: Add React Error Boundaries around providers to gracefully handle:
// - Dynamic SDK initialization failures
// - Network/RPC errors during balance fetching
// - Auth state inconsistencies
// Consider using react-error-boundary package for production.

import { ReactNode, Suspense } from "react";
import { DynamicProvider } from "./DynamicProvider";
import { AuthProvider } from "@/context/AuthContext";
import { SwapProvider } from "@/context/SwapContext";
import { NotificationInboxProvider } from "@/context/NotificationInboxContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { PwaProvider } from "@/context/PwaContext";
import { BottomNav } from "@/components/navigation/BottomNav";
import { PWAGate } from "@/components/pwa/PWAGate";
import { ProtectedLayout } from "@/components/auth/ProtectedLayout";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { SessionRestoreGate } from "@/components/session";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionRestoreGate>
      <DynamicProvider>
        <AuthProvider>
          <OfflineProvider>
            <PwaProvider>
              <NotificationInboxProvider>
                <SwapProvider>
                  {/* ReferralCapture runs first, before any gates, to capture URL params */}
                  {/* Wrapped in Suspense because useSearchParams requires it for static generation */}
                  <Suspense fallback={null}>
                    <ReferralCapture />
                  </Suspense>

                  <ProtectedLayout>
                    <PWAGate>
                      <div className="app-container min-h-screen pb-[var(--bottom-nav-height)]">
                        <main className="safe-area-top">{children}</main>
                      </div>
                      <BottomNav />
                    </PWAGate>
                  </ProtectedLayout>
                </SwapProvider>
              </NotificationInboxProvider>
            </PwaProvider>
          </OfflineProvider>
        </AuthProvider>
      </DynamicProvider>
    </SessionRestoreGate>
  );
}

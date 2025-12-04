"use client";

// TODO: Add React Error Boundaries around providers to gracefully handle:
// - Dynamic SDK initialization failures
// - Network/RPC errors during balance fetching
// - Auth state inconsistencies
// Consider using react-error-boundary package for production.

import { ReactNode } from "react";
import { DynamicProvider } from "./DynamicProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { BottomNav } from "@/components/navigation/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ProtectedLayout } from "@/components/auth/ProtectedLayout";
import { ReferralCapture } from "@/components/referral/ReferralCapture";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DynamicProvider>
      <AuthProvider>
        <AppProvider>
          <ReferralCapture />
          <ProtectedLayout>
            <div className="app-container min-h-screen pb-[var(--bottom-nav-height)]">
              <main className="safe-area-top">{children}</main>
            </div>
            <BottomNav />
            <InstallPrompt />
          </ProtectedLayout>
        </AppProvider>
      </AuthProvider>
    </DynamicProvider>
  );
}

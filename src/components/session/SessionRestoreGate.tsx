"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { restoreSession } from "@/lib/session";

interface SessionRestoreGateProps {
  children: ReactNode;
}

/**
 * Restores session from IndexedDB BEFORE Dynamic SDK initializes.
 * Must wrap DynamicProvider.
 */
export function SessionRestoreGate({ children }: SessionRestoreGateProps) {
  const [isReady, setIsReady] = useState(false);

  const attemptRestore = useCallback(async () => {
    try {
      await restoreSession();
    } catch (error) {
      console.error("[SessionRestoreGate] Restore failed:", error);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    attemptRestore();
  }, [attemptRestore]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-grey-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-lava-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-grey-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}




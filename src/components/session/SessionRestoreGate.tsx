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

  if (!isReady) return null;
  return <>{children}</>;
}



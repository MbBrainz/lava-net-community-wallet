"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthFetch } from "@/lib/auth/client";
import type { PwaInstallEventPayload } from "@/lib/pwa/install-events";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextValue {
  isInstalled: boolean;
  canInstall: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;

  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;

  trackPwaInstallEvent: (payload: PwaInstallEventPayload) => Promise<void>;
}

const PwaContext = createContext<PwaContextValue | undefined>(undefined);

export function PwaProvider({ children }: { children: ReactNode }) {
  const { authFetch } = useAuthFetch();

  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const trackPwaInstallEvent = useCallback(
    async (payload: PwaInstallEventPayload) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const nav = window.navigator as Navigator & { standalone?: boolean };
        const displayModeStandalone = window.matchMedia
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
        const fallbackStandalone = displayModeStandalone || nav.standalone === true;
        const platform = payload.platform ?? nav.platform ?? null;
        const userAgent = payload.userAgent ?? nav.userAgent ?? null;
        const occurredAt = payload.occurredAt ?? new Date().toISOString();

        await authFetch("/api/pwa/install", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType: payload.eventType,
            triggeredBy: payload.triggeredBy,
            installSurface: payload.installSurface,
            metadata: payload.metadata,
            platform,
            userAgent,
            occurredAt,
            isStandalone: payload.isStandalone ?? fallbackStandalone,
          }),
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[PWA] Failed to track install event", error);
        }
      }
    },
    [authFetch]
  );

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      setIsInstalled(isStandalone);

      if (!isStandalone) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    checkInstalled();

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", checkInstalled);
    return () => media.removeEventListener("change", checkInstalled);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setCanInstall(true);

      void trackPwaInstallEvent({
        eventType: "prompt_available",
        triggeredBy: "install_banner",
        installSurface: "beforeinstallprompt",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [trackPwaInstallEvent]);

  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);

      void trackPwaInstallEvent({
        eventType: "installed",
        triggeredBy: "appinstalled",
        installSurface: "system_event",
      });
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, [trackPwaInstallEvent]);

  const value = useMemo<PwaContextValue>(
    () => ({
      isInstalled,
      canInstall,
      installPromptEvent,
      setInstallPromptEvent,
      showInstallBanner,
      setShowInstallBanner,
      trackPwaInstallEvent,
    }),
    [
      isInstalled,
      canInstall,
      installPromptEvent,
      setInstallPromptEvent,
      showInstallBanner,
      setShowInstallBanner,
      trackPwaInstallEvent,
    ]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within a PwaProvider");
  }
  return context;
}


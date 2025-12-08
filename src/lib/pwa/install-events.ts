/**
 * Shared PWA install tracking types/constants.
 *
 * Keeping this in a standalone module means both client components and API
 * routes can rely on the same event vocabulary (DRY and type-safe).
 */

export const PWA_INSTALL_EVENT_TYPES = [
  "installed",
  "prompt_available",
  "prompt_accepted",
  "prompt_dismissed",
  "install_flow_started",
  "banner_dismissed",
  "ios_manual_flow",
] as const satisfies readonly [string, ...string[]];

export type PwaInstallEventType = (typeof PWA_INSTALL_EVENT_TYPES)[number];

export const PWA_INSTALL_TRIGGER_SOURCES = [
  "appinstalled",
  "install_banner",
  "pwa_gate",
  "ios_modal",
  "auto_detect",
  "manual",
] as const satisfies readonly [string, ...string[]];

export type PwaInstallTriggeredBy =
  (typeof PWA_INSTALL_TRIGGER_SOURCES)[number];

export interface PwaInstallEventPayload {
  eventType: PwaInstallEventType;
  triggeredBy?: PwaInstallTriggeredBy;
  installSurface?: string;
  occurredAt?: string;
  platform?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  walletAddress?: string | null;
  isStandalone?: boolean;
}

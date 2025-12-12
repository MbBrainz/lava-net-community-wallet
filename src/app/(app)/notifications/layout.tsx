"use client";

import type { ReactNode } from "react";
import { PushHandler } from "@/components/notifications";
import { PushNotificationsProvider } from "@/context/PushNotificationsContext";

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return (
    <PushNotificationsProvider>
      <PushHandler />
      {children}
    </PushNotificationsProvider>
  );
}


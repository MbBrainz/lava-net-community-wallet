import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string }> } = {
    body: data.body || "New notification from Lava Wallet",
    icon: "/lava-brand-kit/logos/logo-icon-color.png",
    badge: "/lava-brand-kit/logos/logo-symbol-white.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/notifications",
    },
    actions: [
      {
        action: "open",
        title: "Open",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Lava Wallet", options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's an open window, focus it
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            (client as WindowClient).navigate(urlToOpen);
          }
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

serwist.addEventListeners();



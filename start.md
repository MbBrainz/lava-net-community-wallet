Here is your **Clean Start Guideline (Plan 2)**.

This setup avoids the bloated "starter" repos and gives you a Next.js 15 + Serwist (PWA) + Shadcn (UI) stack that closely matches the wallet interface in your screenshot.

### Phase 1: The "Clean" Stack Initialization
Run these commands in your terminal (MacOS/pnpm as requested).

```bash
# 1. Initialize Next.js 15 (TypeScript, Tailwind, ESLint, App Router)
pnpm create next-app@latest my-wallet-pwa --typescript --tailwind --eslint
cd my-wallet-pwa

# 2. Install Shadcn UI (The industry standard for that "mobile card" look)
pnpm dlx shadcn@latest init
# (Select "New York", "Zinc", and "CSS Variables" for the cleanest mobile look)

# 3. Install PWA Engine (Serwist is the successor to next-pwa)
pnpm add @serwist/next @serwist/precaching @serwist/sw
pnpm add -D @types/serwist
```

### Phase 2: The PWA Engine (3 Critical Files)
These files are the "magic" missing from most templates. Create them manually to control the mobile behavior.

#### 1. `next.config.ts`
Wraps the build process to generate the service worker.

```typescript
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",       // Where we define the worker logic
  swDest: "public/sw.js",   // Where it outputs to the browser
  disable: process.env.NODE_ENV === "development", // Disable in dev to avoid caching madness
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
```

#### 2. `app/sw.ts`
This defines the caching strategy. We use a "NetworkFirst" strategy for API routes (critical for a wallet to show real balances) and "CacheFirst" for assets.

```typescript
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
  runtimeCaching: defaultCache, // Defaults are great, but you can override later
});

serwist.addEventListeners();
```

#### 3. `app/manifest.ts`
Using a `.ts` file instead of `.json` allows you to use constants and environment variables.

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Web3 Wallet',
    short_name: 'Wallet',
    description: 'A Next.js 15 PWA Wallet',
    start_url: '/',
    display: 'standalone', // Removes browser URL bar (Native feel)
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '196x196',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
```

### Phase 3: The "Mobile First" UI (Matching Your Screenshot)
To get that specific "Card" look for the balance and the bottom navigation, use these Shadcn components:

```bash
pnpm dlx shadcn@latest add card avatar button separator
```

**Crucial: Fix the Viewport**
In Next.js 15, the viewport must be exported separately in `layout.tsx` to prevent the user from zooming in (which feels like a website, not an app).

```typescript
// app/layout.tsx

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents "pinch to zoom" - feels native
  themeColor: "#ffffff",
}
```

### Final Verification
1.  Run `pnpm build` (Serwist only generates the `sw.js` during build, not dev).
2.  Run `pnpm start`.
3.  Open `localhost:3000` in Chrome, open DevTools -> Application -> Service Workers. You should see it registered.
4.  **Mobile Check:** In Chrome DevTools, toggle "Device Toolbar" (Cmd+Shift+M) to simulate the mobile view shown in your screenshot.

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/40401439/c149968a-d72c-4267-9d7e-f6a98b069a1d/Screenshot-2025-11-27-at-2.23.27-PM.jpg)
[2](https://github.com/vercel/next.js/discussions/82498)
[3](https://nextjs.org/docs/app/guides/progressive-web-apps)
[4](https://serwist.pages.dev/docs/next/getting-started)
[5](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)
[6](https://nextjs.org/docs/app/api-reference/config/typescript)
[7](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
[8](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
[9](https://dev.to/moizlokhandwala09/building-scalable-web-apps-with-nextjs-15-a-complete-guide-to-the-app-router-and-typescript-3e0j)
[10](https://stackoverflow.com/questions/51619109/next-js-pwa-service-worker-manifest-json)
[11](https://www.digitalapplied.com/blog/nextjs-seo-guide)
[12](https://prismic.io/blog/nextjs-typescript)
[13](https://dev.to/sukechris/building-offline-apps-with-nextjs-and-serwist-2cbj)
[14](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)
[15](https://chris.lu/web_development/tutorials/next-js-static-first-mdx-starterkit/typescript-plugin-and-typed-routes)
[16](https://github.com/vercel/next.js/issues/73457)
[17](https://chris.lu/web_development/tutorials/next-js-static-first-mdx-starterkit/metadata)
[18](https://www.reddit.com/r/nextjs/comments/1is8jig/trying_to_make_my_nextjs_15_app_into_a_pwa_but/)
[19](https://github.com/vercel/next.js/issues/13230)
[20](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
[21](https://stackoverflow.com/questions/76740487/override-meta-tags-in-nextjs-13-4)
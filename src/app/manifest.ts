import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lava Wallet",
    short_name: "Lava Wallet",
    description: "Your community wallet for LAVA — stake, track, and connect to DeFi",
    start_url: "/",
    display: "standalone",
    background_color: "#05090F",
    theme_color: "#FF3900",
    orientation: "portrait-primary",
    categories: ["finance", "utilities"],
    icons: [
      {
        src: "/lava-brand-kit/logos/logo-icon-color.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/lava-brand-kit/logos/logo-symbol-color.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/lava-brand-kit/logos/logo-symbol-white.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/lava-brand-kit/graphics/graphic-lava-101.webp",
        sizes: "1280x720",
        type: "image/webp",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "Check Balance",
        short_name: "Balance",
        description: "View your LAVA balance",
        url: "/",
        icons: [{ src: "/lava-brand-kit/logos/logo-icon-color.png", sizes: "96x96" }],
      },
      {
        name: "Community",
        short_name: "Community",
        description: "Latest Lava updates",
        url: "/community",
        icons: [{ src: "/lava-brand-kit/logos/logo-icon-color.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}



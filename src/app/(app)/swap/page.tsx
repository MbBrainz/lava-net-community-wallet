"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SwapWidget } from "@/components/swap/SwapWidget";

export default function SwapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultToLava = searchParams.get("defaultToLava") !== "false";
  const title = searchParams.get("title") ?? (defaultToLava ? "Get LAVA" : "Swap");
  const returnUrl = searchParams.get("returnUrl") ?? "/";

  return (
    <SwapWidget
      isOpen={true}
      onClose={() => router.push(returnUrl)}
      defaultToLava={defaultToLava}
      title={title}
    />
  );
}


"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SwapWidget } from "@/components/swap/SwapWidget";

function SwapPageContent() {
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

export default function SwapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-grey-650">
          <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
        </div>
      }
    >
      <SwapPageContent />
    </Suspense>
  );
}


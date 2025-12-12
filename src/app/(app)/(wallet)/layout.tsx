"use client";

import type { ReactNode } from "react";
import { BalanceProvider } from "@/context/BalanceContext";

export default function WalletLayout({ children }: { children: ReactNode }) {
  return <BalanceProvider>{children}</BalanceProvider>;
}


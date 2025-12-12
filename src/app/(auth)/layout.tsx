"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SessionRestoreGate } from "@/components/session";
import { DynamicProvider } from "@/providers/DynamicProvider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SessionRestoreGate>
      <DynamicProvider>
        <AuthProvider>{children}</AuthProvider>
      </DynamicProvider>
    </SessionRestoreGate>
  );
}


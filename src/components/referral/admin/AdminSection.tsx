"use client";

/**
 * AdminSection Component
 *
 * Shows admin panel link if user is an admin.
 */

import { useState, useEffect } from "react";
import { Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useAuthFetch } from "@/lib/auth/client";
import { getAdminStatus, saveAdminStatus } from "@/lib/referral";

interface AdminSectionProps {
  userEmail: string;
}

export function AdminSection({ userEmail }: AdminSectionProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { authFetch, isReady } = useAuthFetch();

  useEffect(() => {
    if (!userEmail || !isReady) return;

    // Check cache first
    const cached = getAdminStatus(userEmail);
    if (cached !== null) {
      setIsAdmin(cached.isAdmin);
      return;
    }

    // Fetch from API
    const checkAdmin = async () => {
      try {
        const response = await authFetch("/api/admin/check");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          saveAdminStatus({ userEmail, isAdmin: data.isAdmin });
        }
      } catch (error) {
        console.error("[AdminSection] Failed to check admin status:", error);
      }
    };

    checkAdmin();
  }, [userEmail, isReady, authFetch]);

  // Don't show anything if not admin
  if (!isAdmin) return null;

  return (
    <Link href="/admin">
      <Card variant="glass" className="group cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lava-orange/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-lava-orange" />
            </div>
            <div>
              <p className="text-white font-medium">Admin Panel</p>
              <p className="text-sm text-grey-200">Manage referrers</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-grey-300 group-hover:text-white transition-colors" />
        </div>
      </Card>
    </Link>
  );
}

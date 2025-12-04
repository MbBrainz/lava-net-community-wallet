"use client";

/**
 * AdminSection Component
 *
 * Shows admin status and link to admin panel in settings page.
 * Only visible to admin users.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthFetch } from "@/lib/auth/client";
import { getAdminStatus, saveAdminStatus } from "@/lib/referral";

interface AdminSectionProps {
  userEmail: string;
}

export function AdminSection({ userEmail }: AdminSectionProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authFetch, isReady } = useAuthFetch();

  const checkAdminStatus = useCallback(async () => {
    if (!isReady) return false;

    try {
      // Use authenticated fetch - email comes from JWT on server
      const response = await authFetch("/api/admin/check");

      if (response.status === 401) {
        setIsAdmin(false);
        return false;
      }

      const data = await response.json();

      setIsAdmin(data.isAdmin);
      saveAdminStatus({ userEmail, isAdmin: data.isAdmin });

      return data.isAdmin;
    } catch (error) {
      console.error("[AdminSection] Failed to check admin status:", error);
      setIsAdmin(false);
      return false;
    }
  }, [authFetch, isReady, userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      // Check localStorage cache first
      const cached = getAdminStatus(userEmail);

      if (cached?.isAdmin === true) {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      if (cached?.isAdmin === false) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // No cache, check API when auth is ready
      if (isReady) {
        await checkAdminStatus();
        setIsLoading(false);
      }
    };

    init();
  }, [userEmail, isReady, checkAdminStatus]);

  // Still loading - don't show anything
  if (isLoading) {
    return null;
  }

  // Not admin - render nothing
  if (!isAdmin) {
    return null;
  }

  // Admin - render link to admin panel
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-lava-orange" />
        <h2 className="text-sm font-semibold text-grey-200">Admin</h2>
      </div>

      <Card variant="gradient">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lava-orange/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-lava-orange" />
            </div>
            <div>
              <p className="text-white font-medium">Admin Access</p>
              <p className="text-sm text-grey-200">
                Manage referral code requests
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            Admin
          </Badge>
        </div>

        <Link href="/admin" className="block mt-4">
          <Button variant="secondary" fullWidth className="group">
            <span>Open Admin Panel</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </Card>
    </motion.section>
  );
}

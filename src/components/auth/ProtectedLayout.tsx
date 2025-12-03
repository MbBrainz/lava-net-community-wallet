"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/offline"];

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Redirect logic
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // If on login page and authenticated, redirect to home
    if (pathname === "/login" && isAuthenticated) {
      router.replace("/");
      return;
    }

    // If on protected route and not authenticated, redirect to login
    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, isInitialized, pathname, isPublicRoute, router]);

  // Show loading state while SDK initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
          <p className="text-grey-200 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Show loading while checking auth on protected routes
  if (!isPublicRoute && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
          <p className="text-grey-200 text-sm">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  // If on protected route and not authenticated, show loading (redirect will happen)
  if (!isPublicRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
          <p className="text-grey-200 text-sm">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}


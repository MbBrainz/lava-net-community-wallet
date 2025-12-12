"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Flame, Users, Bell, Settings } from "lucide-react";
import { useNotificationInbox } from "@/context/NotificationInboxContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/lava", label: "LAVA", icon: Flame },
  { href: "/community", label: "Community", icon: Users },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationInbox();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-grey-650/90 backdrop-blur-xl border-t border-white/5 backdrop-stable" />
      
      <div className="relative flex items-center justify-around h-[var(--bottom-nav-height)] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const showBadge = item.href === "/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 touch-feedback no-select",
                isActive
                  ? "text-lava-orange"
                  : "text-grey-200 hover:text-grey-100"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-lava-orange/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Icon container */}
              <div className="relative">
                <Icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Notification badge */}
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-lava-orange rounded-full flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </motion.div>
                )}
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



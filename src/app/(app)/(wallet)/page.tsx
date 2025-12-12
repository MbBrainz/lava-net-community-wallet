"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import { BalanceHero } from "@/components/home/BalanceHero";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { FeatureCards } from "@/components/home/FeatureCards";
import { Badge } from "@/components/ui/Badge";
import { SendSheet } from "@/components/wallet/SendSheet";
import { ReceiveSheet } from "@/components/wallet/ReceiveSheet";

export default function HomePage() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  
  // Send/Receive sheet state
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/lava-brand-kit/logos/logo-wordmark-white.svg"
              alt="Lava"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {isOffline && (
              <Badge variant="warning" size="sm">
                Offline
              </Badge>
            )}
            <div className="w-9 h-9 rounded-full bg-lava-gradient flex items-center justify-center text-white font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() || "L"}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="px-4 py-4 space-y-6">
        {/* Balance Hero with Send/Receive callbacks */}
        <BalanceHero 
          onSend={() => setShowSendSheet(true)}
          onReceive={() => setShowReceiveSheet(true)}
        />

        {/* Feature Cards Carousel */}
        <section>
          <h2 className="text-sm font-semibold text-grey-100 mb-3 px-1">
            Quick Actions
          </h2>
          <FeatureCards />
        </section>

        {/* Activity Feed */}
        <section>
          <ActivityFeed />
        </section>
      </div>

      {/* Send Sheet */}
      <SendSheet
        isOpen={showSendSheet}
        onClose={() => setShowSendSheet(false)}
      />

      {/* Receive Sheet */}
      <ReceiveSheet
        isOpen={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
      />
    </div>
  );
}

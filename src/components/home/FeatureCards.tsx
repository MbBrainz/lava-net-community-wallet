"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, BookOpen, Download, Clock, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { usePwa } from "@/context/PwaContext";
import { useSwap } from "@/context/SwapContext";
import Image from "next/image";
import { FEATURES } from "@/lib/features";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: typeof Flame;
  href?: string;
  action?: () => void;
  gradient: string;
  image?: string;
  comingSoon?: boolean;
}

export function FeatureCards() {
  const { isInstalled, setShowInstallBanner } = usePwa();
  const { openSwap } = useSwap();

  const cards: FeatureCard[] = [
    {
      id: "swap",
      title: "Get LAVA",
      description: "Swap any token to LAVA instantly",
      icon: ArrowRightLeft,
      action: () => openSwap({ defaultToLava: true, title: "Get LAVA" }),
      gradient: "from-lava-orange/40 to-lava-gold-drop/30",
      image: "/lava-brand-kit/mascots/mascot-lavuci-points.png",
    },
    {
      id: "stake",
      title: "Stake your LAVA",
      description: "Earn rewards by securing the network",
      icon: Flame,
      href: "/lava",
      gradient: "from-lava-orange/30 to-lava-red/20",
      image: "/lava-brand-kit/mascots/mascot-lava-crown.png",
      comingSoon: !FEATURES.STAKING,
    },
    {
      id: "learn",
      title: "Connect to DeFi",
      description: "Learn how to use Lava Wallet with dApps",
      icon: BookOpen,
      href: "/lava",
      gradient: "from-lava-purple/30 to-lava-orange/20",
      image: "/lava-brand-kit/mascots/mascot-lavuci-cool.png",
      comingSoon: !FEATURES.DEFI,
    },
    ...(!isInstalled
      ? [
          {
            id: "install",
            title: "Install the App",
            description: "Get the native app experience",
            icon: Download,
            action: () => setShowInstallBanner(true),
            gradient: "from-green-500/20 to-teal-500/20",
            image: "/lava-brand-kit/mascots/mascot-fennec-stands.png",
          },
        ]
      : []),
  ];

  return (
    <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
      <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
        {cards.map((card, index) => {
          const Icon = card.icon;
          const content = (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative w-[260px] h-[140px] rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} border border-white/5 ${card.comingSoon ? "" : "touch-feedback"}`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl"
                  style={{ background: "rgba(255,57,0,0.3)" }}
                />
              </div>

              {/* Mascot image */}
              {card.image && (
                <div className={`absolute -bottom-2 -right-2 w-24 h-24 ${card.comingSoon ? "opacity-20 grayscale" : "opacity-40"}`}>
                  <Image
                    src={card.image}
                    alt=""
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Coming Soon badge */}
              {card.comingSoon && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-grey-650/90 backdrop-blur-sm rounded-full border border-white/10">
                  <Clock className="w-3 h-3 text-lava-orange" />
                  <span className="text-[10px] font-medium text-grey-100">Coming Soon</span>
                </div>
              )}

              {/* Content */}
              <div className={`relative p-4 h-full flex flex-col ${card.comingSoon ? "opacity-60" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-white font-semibold text-sm mb-1">
                  {card.title}
                </h3>
                <p className="text-grey-100 text-xs line-clamp-2 flex-1">
                  {card.description}
                </p>

                {!card.comingSoon && (
                  <div className="flex items-center gap-1 text-lava-orange text-xs font-medium mt-2">
                    <span>Get started</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </motion.div>
          );

          // Coming soon cards are not clickable
          if (card.comingSoon) {
            return <div key={card.id}>{content}</div>;
          }

          if (card.href) {
            return (
              <Link key={card.id} href={card.href}>
                {content}
              </Link>
            );
          }

          return (
            <button key={card.id} onClick={card.action}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}


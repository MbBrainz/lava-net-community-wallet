"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Wallet,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  ExternalLink,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
  Copy,
  Flame,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { shortenAddress, getChainColor } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Modal";
import Image from "next/image";

type Theme = "light" | "dark" | "system";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const {
    user,
    logout,
    theme,
    setTheme,
    isInstalled,
    setShowInstallBanner,
  } = useApp();

  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  const mockChains = [
    { name: "Lava", enabled: true },
    { name: "Ethereum", enabled: true },
    { name: "Base", enabled: true },
    { name: "Arbitrum", enabled: true },
    { name: "Optimism", enabled: true },
    { name: "Polygon", enabled: true },
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(user?.walletAddress || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile",
          value: user?.email || "demo@lavanet.xyz",
          onClick: undefined,
        },
        {
          icon: Wallet,
          label: "Wallet & Chains",
          value: `${mockChains.filter((c) => c.enabled).length} chains`,
          onClick: () => setShowWalletSheet(true),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Palette,
          label: "Appearance",
          value: theme.charAt(0).toUpperCase() + theme.slice(1),
          onClick: () => setShowThemeSheet(true),
        },
        {
          icon: Bell,
          label: "Notifications",
          value: undefined,
          href: "/notifications",
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: Shield,
          label: "Privacy Policy",
          external: true,
          href: "https://lavanet.xyz/privacy",
        },
        {
          icon: HelpCircle,
          label: "Help & Support",
          external: true,
          href: "https://docs.lavanet.xyz",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-grey-425 flex items-center justify-center">
            <Settings className="w-5 h-5 text-grey-100" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-sm text-grey-200">Manage your preferences</p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gradient">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-lava-gradient flex items-center justify-center text-white font-bold text-xl">
                {user?.email?.[0]?.toUpperCase() || "L"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.email || "demo@lavanet.xyz"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-grey-200 font-mono">
                    {shortenAddress(user?.walletAddress || "lava1xz9...m4c7nq", 6)}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 text-grey-200 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Install App Banner */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card
              variant="outline"
              className="border-lava-orange/30 bg-lava-orange/5"
              onClick={() => setShowInstallBanner(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-lava-gradient flex items-center justify-center">
                  <Image
                    src="/lava-brand-kit/logos/logo-symbol-white.png"
                    alt="Lava"
                    width={28}
                    height={28}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Install Lava Wallet</p>
                  <p className="text-sm text-grey-200">
                    Add to home screen for the best experience
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-grey-200" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + groupIndex * 0.05 }}
          >
            <h2 className="text-sm font-semibold text-grey-200 mb-2 px-1">
              {group.title}
            </h2>
            <Card variant="glass" padding="none">
              <div className="divide-y divide-grey-425/30">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-center gap-3 p-4 hover:bg-grey-425/20 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-grey-425/50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-grey-100" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        {item.value && (
                          <p className="text-xs text-grey-200">{item.value}</p>
                        )}
                      </div>
                      {item.external ? (
                        <ExternalLink className="w-4 h-4 text-grey-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-grey-200" />
                      )}
                    </div>
                  );

                  if (item.href && item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content}
                      </a>
                    );
                  }

                  if (item.href) {
                    return (
                      <a key={item.label} href={item.href}>
                        {content}
                      </a>
                    );
                  }

                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="w-full text-left"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <div key={item.label} className="opacity-70">
                      {content}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Version & Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Button
            variant="danger"
            fullWidth
            onClick={logout}
            className="flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>

          <p className="text-center text-xs text-grey-200">
            Lava Wallet v0.1.0 (Demo)
          </p>
        </motion.div>
      </div>

      {/* Theme Sheet */}
      <Sheet
        isOpen={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title="Appearance"
      >
        <div className="space-y-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setShowThemeSheet(false);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                  isSelected
                    ? "bg-lava-orange/20 border border-lava-orange/30"
                    : "bg-grey-650/50 hover:bg-grey-425/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-lava-orange/30" : "bg-grey-425"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected ? "text-lava-orange" : "text-grey-100"
                    }`}
                  />
                </div>
                <span
                  className={`flex-1 text-left font-medium ${
                    isSelected ? "text-white" : "text-grey-100"
                  }`}
                >
                  {option.label}
                </span>
                {isSelected && <Check className="w-5 h-5 text-lava-orange" />}
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Wallet & Chains Sheet */}
      <Sheet
        isOpen={showWalletSheet}
        onClose={() => setShowWalletSheet(false)}
        title="Wallet & Chains"
      >
        <div className="space-y-6">
          {/* Wallet Address */}
          <div>
            <h3 className="text-sm font-semibold text-grey-200 mb-3">
              Wallet Address
            </h3>
            <div className="p-4 bg-grey-650/50 rounded-xl">
              <p className="text-xs text-grey-200 mb-2">Lava Network</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-white font-mono break-all">
                  {user?.walletAddress || "lava1xz9v8k7j2h4n5m6p3q8r9s0t1u2v3w4x5y6z7m4c7nq"}
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 text-grey-200 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enabled Chains */}
          <div>
            <h3 className="text-sm font-semibold text-grey-200 mb-3">
              Enabled Chains
            </h3>
            <div className="space-y-2">
              {mockChains.map((chain) => (
                <div
                  key={chain.name}
                  className="flex items-center gap-3 p-3 bg-grey-650/50 rounded-xl"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${getChainColor(chain.name)}20` }}
                  >
                    {chain.name === "Lava" ? (
                      <Flame
                        className="w-4 h-4"
                        style={{ color: getChainColor(chain.name) }}
                      />
                    ) : (
                      <span
                        className="text-sm font-bold"
                        style={{ color: getChainColor(chain.name) }}
                      >
                        {chain.name[0]}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-sm text-white">{chain.name}</span>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-grey-650/50 rounded-xl">
            <p className="text-xs text-grey-200">
              <span className="text-grey-100 font-medium">Note:</span> Your
              embedded wallet is secured with MPC technology. No private keys are
              stored on this device.
            </p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}


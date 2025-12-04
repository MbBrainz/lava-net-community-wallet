"use client";

import { motion } from "framer-motion";
import {
  Users,
  Pin,
  Calendar,
  Vote,
  Megaphone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { timeAgo } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

const labelIcons = {
  Announcement: Megaphone,
  Event: Calendar,
  Update: ArrowRight,
  Governance: Vote,
};

const labelColors = {
  Announcement: "lava",
  Event: "info",
  Update: "default",
  Governance: "warning",
} as const;

export default function CommunityPage() {
  const { communityPosts, pinnedPost } = useApp();
  const regularPosts = communityPosts.filter((p) => !p.isPinned);

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lava-purple/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-lava-purple" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Community</h1>
              <p className="text-sm text-grey-200">Updates from Lava Network</p>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/lavanetxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-grey-425/50 hover:bg-grey-425 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.gg/lavanetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-grey-425/50 hover:bg-grey-425 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-5">
        {/* Pinned Announcement */}
        {pinnedPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href={`/community/${pinnedPost.id}`}>
              <Card
                variant="gradient"
                padding="none"
                className="overflow-hidden border-lava-orange/30"
              >
                {/* Image */}
                {pinnedPost.imageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={pinnedPost.imageUrl}
                      alt={pinnedPost.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-grey-650 via-grey-650/50 to-transparent" />
                    
                    {/* Pinned badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-lava-orange rounded-full">
                      <Pin className="w-3 h-3 text-white" />
                      <span className="text-xs font-semibold text-white">Pinned</span>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={labelColors[pinnedPost.label]} size="sm">
                      {pinnedPost.label}
                    </Badge>
                    <span className="text-xs text-grey-200">
                      {timeAgo(pinnedPost.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {pinnedPost.title}
                  </h3>
                  <p className="text-sm text-grey-200 line-clamp-2">
                    {pinnedPost.summary}
                  </p>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Feed List */}
        <section>
          <h2 className="text-sm font-semibold text-grey-100 mb-3 px-1">
            Recent Updates
          </h2>

          <div className="space-y-3">
            {regularPosts.map((post, index) => {
              const LabelIcon = labelIcons[post.label];

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/community/${post.id}`}>
                    <Card variant="glass" className="touch-feedback">
                      <div className="flex gap-4">
                        {/* Icon or image */}
                        {post.imageUrl ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              post.label === "Announcement"
                                ? "bg-lava-orange/20"
                                : post.label === "Event"
                                ? "bg-blue-500/20"
                                : post.label === "Governance"
                                ? "bg-lava-yellow/20"
                                : "bg-grey-425"
                            }`}
                          >
                            <LabelIcon
                              className={`w-7 h-7 ${
                                post.label === "Announcement"
                                  ? "text-lava-orange"
                                  : post.label === "Event"
                                  ? "text-blue-400"
                                  : post.label === "Governance"
                                  ? "text-lava-yellow"
                                  : "text-grey-200"
                              }`}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={labelColors[post.label]} size="sm">
                              {post.label}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-xs text-grey-200 line-clamp-2">
                            {post.summary}
                          </p>
                          <p className="text-xs text-grey-200 mt-2">
                            {timeAgo(post.timestamp)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="outline" className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image
                src="/lava-brand-kit/mascots/mascot-fennec-head.png"
                alt="Fennec"
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Join the conversation
            </h3>
            <p className="text-xs text-grey-200 mb-3">
              Connect with the Lava community on Discord
            </p>
            <a
              href="https://discord.gg/lavanetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-lava-orange hover:text-lava-spanish-orange font-medium"
            >
              <span>Join Discord</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

const labelColors = {
  Announcement: "lava",
  Event: "info",
  Update: "default",
  Governance: "warning",
} as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CommunityPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { communityPosts } = useApp();

  const post = communityPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Post not found</h2>
          <p className="text-grey-200 mb-4">This post may have been removed</p>
          <Button onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="sticky top-0 z-10 bg-grey-650/80 backdrop-blur-xl border-b border-grey-425/30"
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-white hover:bg-grey-425/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-white">Community</span>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-white hover:bg-grey-425/50 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Hero Image */}
      {post.imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-48 overflow-hidden"
        >
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-grey-650 to-transparent" />
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-5"
      >
        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={labelColors[post.label]}>{post.label}</Badge>
          {post.isPinned && (
            <Badge variant="lava">Pinned</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">{post.title}</h1>

        {/* Timestamp */}
        <div className="flex items-center gap-4 text-sm text-grey-200 mb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.timestamp)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatTime(post.timestamp)}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-base text-grey-100 mb-6 leading-relaxed">
          {post.summary}
        </p>

        {/* Full content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {post.content.split("\n\n").map((paragraph, idx) => (
            <p key={idx} className="text-grey-100 mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Action buttons for governance posts */}
        {post.label === "Governance" && (
          <div className="mt-8 p-4 bg-lava-yellow/10 border border-lava-yellow/20 rounded-2xl">
            <h3 className="font-semibold text-white mb-2">
              Cast your vote
            </h3>
            <p className="text-sm text-grey-200 mb-4">
              This proposal requires community input. Vote now to make your voice heard.
            </p>
            <Button fullWidth>
              Vote on Proposal
            </Button>
          </div>
        )}

        {/* Event RSVP for event posts */}
        {post.label === "Event" && (
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <h3 className="font-semibold text-white mb-2">
              Don't miss this event
            </h3>
            <p className="text-sm text-grey-200 mb-4">
              Add this event to your calendar to get a reminder.
            </p>
            <Button fullWidth variant="secondary">
              Add to Calendar
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}


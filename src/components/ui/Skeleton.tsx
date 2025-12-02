"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const variants = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "skeleton",
        variants[variant],
        className
      )}
    />
  );
}

// Pre-built skeleton layouts
export function BalanceCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-grey-550">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12" variant="circular" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-5 w-32" />
    </div>
  );
}

export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10" variant="circular" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function CommunityPostSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-grey-550">
      <div className="flex items-start gap-3">
        <Skeleton className="w-16 h-16 flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}



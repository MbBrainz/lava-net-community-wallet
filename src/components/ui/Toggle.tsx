"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const sizes = {
    sm: {
      track: "w-9 h-5",
      thumb: "w-4 h-4",
      translate: "translate-x-4",
    },
    md: {
      track: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-5",
    },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lava-orange/50 focus:ring-offset-2 focus:ring-offset-grey-550",
        s.track,
        checked ? "bg-lava-orange" : "bg-grey-425",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200",
          s.thumb,
          checked ? s.translate : "translate-x-0.5"
        )}
      />
    </button>
  );
}



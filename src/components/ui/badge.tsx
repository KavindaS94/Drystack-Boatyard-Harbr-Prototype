import type { ReactNode } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  primary: "bg-primary-lighter text-primary",
  success: "bg-teal-50 text-teal-800",
  warning: "bg-amber-50 text-amber-900",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Small status pill, styled with Harbr tokens. */
export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

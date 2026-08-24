import { dnlReasonText, type DnlStatus } from "../lib/dnl";

interface DnlBadgeProps {
  status: DnlStatus;
  className?: string;
}

export function DnlBadge({ status, className = "" }: DnlBadgeProps) {
  if (!status.blocked) return null;
  return (
    <span
      data-dnl-badge
      title={dnlReasonText(status)}
      className={`inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 ${className}`}
    >
      Do not launch
    </span>
  );
}

/**
 * Appeal Status Badge Component
 * Displays appeal status with color coding
 */

import { Badge } from "@/components/ui/badge";
import type { AppealStatus } from "@/types/appeal";

interface AppealStatusBadgeProps {
  status: AppealStatus;
  className?: string;
}

const statusConfig: Record<
  AppealStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: {
    label: "Chờ xử lý",
    variant: "secondary", // Yellow/gray
  },
  REVIEWING: {
    label: "Đang xem xét",
    variant: "default", // Blue
  },
  ACCEPTED: {
    label: "Chấp nhận",
    variant: "outline", // Green (we'll add custom class)
  },
  REJECTED: {
    label: "Từ chối",
    variant: "destructive", // Red
  },
};

export function AppealStatusBadge({ status, className }: AppealStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={`${
        status === "ACCEPTED"
          ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-300"
          : status === "PENDING"
          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300"
          : ""
      } ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}

"use client";

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status?: 'DRAFT' | 'SUBMITTED' | 'CLASS_APPROVED' | 'ADVISOR_APPROVED' | 'FACULTY_APPROVED' | 'REJECTED';
}

const statusConfig = {
  DRAFT: {
    label: 'Nháp',
    variant: 'secondary' as const,
  },
  SUBMITTED: {
    label: 'Đã nộp',
    variant: 'default' as const,
  },
  CLASS_APPROVED: {
    label: 'Lớp đã duyệt',
    variant: 'default' as const,
  },
  ADVISOR_APPROVED: {
    label: 'Cố vấn đã duyệt',
    variant: 'default' as const,
  },
  FACULTY_APPROVED: {
    label: 'Đã duyệt hoàn tất',
    variant: 'default' as const,
  },
  REJECTED: {
    label: 'Bị từ chối',
    variant: 'destructive' as const,
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) {
    return (
      <Badge variant="secondary">
        Không xác định
      </Badge>
    );
  }
  
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="secondary">
        {status}
      </Badge>
    );
  }
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};


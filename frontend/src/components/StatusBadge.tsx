"use client";

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'DRAFT' | 'SUBMITTED' | 'CLASS_APPROVED' | 'FACULTY_APPROVED' | 'CTSV_APPROVED' | 'REJECTED';
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
  FACULTY_APPROVED: {
    label: 'Khoa đã duyệt',
    variant: 'default' as const,
  },
  CTSV_APPROVED: {
    label: 'CTSV đã duyệt',
    variant: 'default' as const,
  },
  REJECTED: {
    label: 'Bị từ chối',
    variant: 'destructive' as const,
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminStudentsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main students page with admin privileges
    router.push('/students');
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


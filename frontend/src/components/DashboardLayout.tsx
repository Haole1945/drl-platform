"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole, getPrimaryRoleDisplayName } from '@/lib/role-utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Award, 
  Settings, 
  LogOut,
  CheckSquare,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isInstructor = user && hasAnyRole(user, ['INSTRUCTOR', 'ADMIN', 'CLASS_MONITOR', 'UNION_REPRESENTATIVE', 'ADVISOR', 'FACULTY_INSTRUCTOR', 'CTSV_STAFF', 'INSTITUTE_COUNCIL']);
  const isAdmin = user && hasAnyRole(user, ['ADMIN']);
  const canManagePeriods = user && hasAnyRole(user, ['ADMIN', 'INSTITUTE_COUNCIL']);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">DRL Platform</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                <LayoutDashboard className="inline h-4 w-4 mr-1" />
                Dashboard
              </Link>
              {user?.studentCode && (
                <Link href="/evaluations/my" className="text-sm font-medium hover:text-primary transition-colors">
                  <FileText className="inline h-4 w-4 mr-1" />
                  My Evaluations
                </Link>
              )}
              <Link href="/evaluations/new" className="text-sm font-medium hover:text-primary transition-colors">
                <ClipboardList className="inline h-4 w-4 mr-1" />
                New Evaluation
              </Link>
              {isInstructor && (
                <>
                  <Link href="/approvals" className="text-sm font-medium hover:text-primary transition-colors">
                    <CheckSquare className="inline h-4 w-4 mr-1" />
                    Approvals
                  </Link>
                  <Link href="/students" className="text-sm font-medium hover:text-primary transition-colors">
                    <Users className="inline h-4 w-4 mr-1" />
                    Students
                  </Link>
                  <Link href="/training-points" className="text-sm font-medium hover:text-primary transition-colors">
                    <Award className="inline h-4 w-4 mr-1" />
                    Training Points
                  </Link>
                </>
              )}
              {canManagePeriods && (
                <Link href="/admin/evaluation-periods" className="text-sm font-medium hover:text-primary transition-colors">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Đợt Đánh giá
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  <Settings className="inline h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
};


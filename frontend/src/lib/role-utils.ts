/**
 * Role utility functions
 */

import type { Role, User } from '@/types/auth';

// Re-export Role type for convenience
export type { Role };

/**
 * Get all roles for a user (supports both single role and roles array)
 */
export function getUserRoles(user: User | null): Role[] {
  if (!user) return [];
  
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }
  
  if (user.role) {
    return [user.role];
  }
  
  return [];
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: Role): boolean {
  return getUserRoles(user).includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  const userRoles = getUserRoles(user);
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: User | null, roles: Role[]): boolean {
  const userRoles = getUserRoles(user);
  return roles.every(role => userRoles.includes(role));
}

/**
 * Check if user can approve evaluations at class level
 */
export function canApproveClassLevel(user: User | null): boolean {
  return hasAnyRole(user, [
    'CLASS_MONITOR',
    'UNION_REPRESENTATIVE',
    'ADVISOR',
    'ADMIN'
  ]);
}

/**
 * Check if user can approve evaluations at faculty level
 */
export function canApproveFacultyLevel(user: User | null): boolean {
  return hasAnyRole(user, [
    'FACULTY_INSTRUCTOR',
    'ADMIN'
  ]);
}

/**
 * Check if user can approve evaluations at CTSV level
 */
export function canApproveCtsvLevel(user: User | null): boolean {
  return hasAnyRole(user, [
    'CTSV_STAFF',
    'ADMIN'
  ]);
}

/**
 * Check if user can finalize evaluations
 */
export function canFinalizeEvaluation(user: User | null): boolean {
  return hasAnyRole(user, [
    'INSTITUTE_COUNCIL',
    'ADMIN'
  ]);
}

/**
 * Check if user can create evaluations (students only)
 * Only students, class monitors, and union representatives can create evaluations
 */
export function canCreateEvaluation(user: User | null): boolean {
  return hasAnyRole(user, [
    'STUDENT',
    'CLASS_MONITOR',
    'UNION_REPRESENTATIVE'
  ]);
}

/**
 * Get primary role display name
 */
export function getPrimaryRoleDisplayName(user: User | null): string {
  if (!user) return 'Unknown';
  
  const roles = getUserRoles(user);
  if (roles.length === 0) return 'Unknown';
  
  // Priority order for display
  const priorityOrder: Role[] = [
    'ADMIN',
    'INSTITUTE_COUNCIL',
    'CTSV_STAFF',
    'FACULTY_INSTRUCTOR',
    'ADVISOR',
    'UNION_REPRESENTATIVE',
    'CLASS_MONITOR',
    'INSTRUCTOR',
    'STUDENT'
  ];
  
  for (const role of priorityOrder) {
    if (roles.includes(role)) {
      return getRoleDisplayName(role);
    }
  }
  
  return getRoleDisplayName(roles[0]);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    'STUDENT': 'Sinh viên',
    'CLASS_MONITOR': 'Lớp trưởng',
    'UNION_REPRESENTATIVE': 'Đại diện đoàn',
    'ADVISOR': 'Cố vấn học tập',
    'FACULTY_INSTRUCTOR': 'Giáo viên khoa',
    'CTSV_STAFF': 'Nhân viên CTSV',
    'INSTITUTE_COUNCIL': 'Hội đồng Học viện',
    'INSTRUCTOR': 'Giảng viên',
    'ADMIN': 'Quản trị viên'
  };
  
  return roleNames[role] || role;
}


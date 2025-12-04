/**
 * Date utility functions for consistent date formatting across the app
 * Handles timezone conversion from backend (Vietnam timezone) to display
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

/**
 * Convert Java LocalDateTime array to JavaScript Date
 * Backend sends dates as arrays: [year, month, day, hour, minute, second, nano]
 * Backend is configured to use Asia/Ho_Chi_Minh timezone (UTC+7)
 */
export function parseBackendDate(dateValue?: string | number[]): Date | null {
  if (!dateValue) return null;
  
  try {
    if (Array.isArray(dateValue)) {
      // Java LocalDateTime format: [year, month, day, hour, minute, second, nano]
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      
      // Create date in Vietnam timezone (backend stores in Vietnam timezone)
      // Month is 1-based in Java but 0-based in JavaScript
      // Since backend is already in Vietnam timezone, we create the date directly
      return new Date(year, month - 1, day, hour, minute, second);
    } else if (typeof dateValue === 'string') {
      // ISO string format - parse directly
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date;
    }
  } catch (error) {
    return null;
  }
  
  return null;
}

/**
 * Format date with time for display
 * Format: "dd/MM/yyyy 'lúc' HH:mm" (e.g., "29/11/2024 lúc 18:00")
 */
export function formatDateTime(dateValue?: string | number[]): string {
  const date = parseBackendDate(dateValue);
  if (!date) return 'N/A';
  
  try {
    return format(date, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format date only (without time)
 * Format: "dd/MM/yyyy" (e.g., "29/11/2024")
 */
export function formatDate(dateValue?: string | number[]): string {
  const date = parseBackendDate(dateValue);
  if (!date) return 'N/A';
  
  try {
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format date with full date and time including seconds
 * Format: "dd/MM/yyyy 'lúc' HH:mm:ss" (e.g., "29/11/2024 lúc 18:00:30")
 */
export function formatDateTimeWithSeconds(dateValue?: string | number[]): string {
  const date = parseBackendDate(dateValue);
  if (!date) return 'N/A';
  
  try {
    return format(date, "dd/MM/yyyy 'lúc' HH:mm:ss", { locale: vi });
  } catch (error) {
    return 'N/A';
  }
}


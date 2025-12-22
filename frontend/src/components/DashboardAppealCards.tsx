/**
 * Dashboard Appeal Cards Component
 * Shows appeal count cards for students and reviewers
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, ClipboardCheck } from "lucide-react";
import { getAppealCount, getPendingAppealCount } from "@/lib/api/appeals";
import { useAuth } from "@/contexts/AuthContext";

export function StudentAppealCard() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadCount();
  }, []);

  const loadCount = async () => {
    try {
      const appealCount = await getAppealCount();
      setCount(appealCount);
      setError(false);
    } catch (error) {
      // Silently handle error - backend not ready yet
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if there's an error (backend not ready)
  if (error) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Khiếu nại của tôi</CardTitle>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : count}</div>
        <p className="text-xs text-muted-foreground">
          Tổng số khiếu nại đã gửi
        </p>
        <Link href="/appeals/my">
          <Button variant="outline" size="sm" className="mt-4 w-full">
            Xem danh sách
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function ReviewerAppealCard() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check if user can review appeals
  const canReview =
    user &&
    (user.roles?.includes("ADMIN") ||
      user.roles?.includes("FACULTY_INSTRUCTOR"));

  useEffect(() => {
    if (canReview) {
      loadCount();
    }
  }, [canReview]);

  const loadCount = async () => {
    try {
      const appealCount = await getPendingAppealCount();
      setCount(appealCount);
      setError(false);
    } catch (error) {
      // Silently handle error - backend not ready yet
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user can't review or if there's an error
  if (!canReview || error) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Khiếu nại chờ xử lý</CardTitle>
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : count}</div>
        <p className="text-xs text-muted-foreground">
          Khiếu nại cần xét duyệt
        </p>
        <Link href="/appeals">
          <Button variant="outline" size="sm" className="mt-4 w-full">
            Xem danh sách
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

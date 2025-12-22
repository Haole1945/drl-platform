/**
 * Appeal Button Component
 * Shows appeal button when evaluation is FACULTY_APPROVED and within deadline
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppealDialog } from "@/components/AppealDialog";
import { canAppeal } from "@/lib/api/appeals";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Criteria {
  id: number;
  name: string;
}

interface AppealButtonProps {
  evaluationId: number;
  evaluationStatus: string;
  criteria: Criteria[];
  onAppealCreated?: () => void;
}

export function AppealButton({
  evaluationId,
  evaluationStatus,
  criteria,
  onAppealCreated,
}: AppealButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [canAppealEval, setCanAppealEval] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAppealEligibility();
  }, [evaluationId, evaluationStatus]);

  const checkAppealEligibility = async () => {
    // Only check if status is FACULTY_APPROVED
    if (evaluationStatus !== "FACULTY_APPROVED") {
      setCanAppealEval(false);
      setLoading(false);
      return;
    }

    // Temporary: Skip API check and show button directly for FACULTY_APPROVED
    // TODO: Fix backend endpoint routing
    setCanAppealEval(true);
    setLoading(false);
    return;

    /* Original API check - commented out until backend is ready
    setLoading(true);
    try {
      const response = await canAppeal(evaluationId);
      if (response.success && response.data) {
        setCanAppealEval(response.data.canAppeal);
        setDeadline(response.data.deadline);
      } else {
        setCanAppealEval(false);
      }
    } catch (error) {
      // Silently handle error - endpoint might not be available yet
      setCanAppealEval(false);
    } finally {
      setLoading(false);
    }
    */
  };

  if (loading || !canAppealEval) {
    console.log('[DEBUG] AppealButton not showing:', {
      loading,
      canAppealEval,
      evaluationStatus,
      evaluationId
    });
    return null;
  }

  console.log('[DEBUG] AppealButton SHOWING!', {
    canAppealEval,
    deadline,
    evaluationId
  });

  const formatDeadline = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Khiếu nại
      </Button>

      {deadline && (
        <p className="text-xs text-muted-foreground">
          Hạn khiếu nại: {formatDeadline(deadline)}
        </p>
      )}

      <AppealDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        evaluationId={evaluationId}
        criteria={criteria}
        onSuccess={() => {
          setShowDialog(false);
          if (onAppealCreated) {
            onAppealCreated();
          }
        }}
      />
    </>
  );
}

"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { EvaluationPrintSheet } from './EvaluationPrintSheet';

interface PrintEvaluationDialogProps {
  evaluationId: number;
  semester: string;
}

export function PrintEvaluationDialog({ evaluationId, semester }: PrintEvaluationDialogProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          In phiếu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Phiếu đánh giá kết quả rèn luyện</DialogTitle>
          <DialogDescription>
            {semester}
          </DialogDescription>
        </DialogHeader>
        
        <div className="print:hidden flex justify-end gap-2 mb-4">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            In phiếu
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </div>

        <EvaluationPrintSheet evaluationId={evaluationId} />
      </DialogContent>
    </Dialog>
  );
}

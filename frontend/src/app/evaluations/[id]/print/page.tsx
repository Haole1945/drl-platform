"use client";

import { useParams } from 'next/navigation';
import { EvaluationPrintSheet } from '@/components/EvaluationPrintSheet';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrintPage() {
  const params = useParams();
  const evaluationId = parseInt(params?.id as string);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/evaluations/${evaluationId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Xem trước phiếu đánh giá</h1>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          In phiếu
        </Button>
      </div>
      
      <div className="py-8">
        <EvaluationPrintSheet evaluationId={evaluationId} />
      </div>
    </div>
  );
}

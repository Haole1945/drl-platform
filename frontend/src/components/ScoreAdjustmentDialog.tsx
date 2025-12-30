"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, type UploadedFile } from '@/components/FileUpload';

interface ScoreAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterionId: number;
  subCriteriaId: string;
  subCriteriaName: string;
  originalScore: number;
  newScore: number;
  existingReason?: string;
  existingEvidence?: string;
  onSave: (reason: string, evidence: string) => void;
}

export function ScoreAdjustmentDialog({
  open,
  onOpenChange,
  criterionId,
  subCriteriaId,
  subCriteriaName,
  originalScore,
  newScore,
  existingReason = '',
  existingEvidence = '',
  onSave,
}: ScoreAdjustmentDialogProps) {
  const [reason, setReason] = useState(existingReason);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Update when existing values change
  useEffect(() => {
    setReason(existingReason);
    // Parse existing evidence (file URLs) if any
    if (existingEvidence) {
      // Evidence is stored as comma-separated URLs
      const urls = existingEvidence.split(',').map(url => url.trim()).filter(Boolean);
      // Convert to UploadedFile format (we only have URLs, not full file info)
      const files: UploadedFile[] = urls.map((url, idx) => ({
        id: Date.now() + idx,
        fileName: url.split('/').pop() || 'file',
        fileUrl: url,
        fileType: 'application/octet-stream', // Unknown type
        fileSize: 0,
      }));
      setUploadedFiles(files);
    } else {
      setUploadedFiles([]);
    }
  }, [existingReason, existingEvidence, open]);

  const handleSave = () => {
    // Convert uploaded files to comma-separated URLs
    const evidenceUrls = uploadedFiles.map(f => f.fileUrl).filter(Boolean).join(', ');
    onSave(reason, evidenceUrls);
    onOpenChange(false);
  };

  const handleSkip = () => {
    // Save empty strings if user skips
    onSave('', '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ghi Chú Chỉnh Sửa Điểm</DialogTitle>
          <DialogDescription>
            {subCriteriaId} - {subCriteriaName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-md">
            <span>Điểm gốc: <strong className="text-lg">{originalScore}</strong></span>
            <span className="text-muted-foreground">→</span>
            <span>Điểm mới: <strong className="text-lg text-primary">{newScore}</strong></span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Lý do chỉnh sửa (không bắt buộc)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Sinh viên tự đánh giá cao hơn thực tế, cần điều chỉnh theo tiêu chí..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Minh chứng (không bắt buộc)</Label>
            <FileUpload
              criteriaId={criterionId}
              subCriteriaId={subCriteriaId}
              existingFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              maxFiles={5}
            />
            <p className="text-xs text-muted-foreground">
              Upload file minh chứng (ảnh, PDF, video, v.v.)
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Ghi chú giúp sinh viên hiểu rõ lý do điểm bị điều chỉnh
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Xem sau
          </Button>
          <Button onClick={handleSave}>
            Lưu ghi chú
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

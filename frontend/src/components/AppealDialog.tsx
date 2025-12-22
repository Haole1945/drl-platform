/**
 * Appeal Dialog Component
 * Modal form for creating appeals
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createAppeal, uploadAppealFile } from "@/lib/api/appeals";
import type { CreateAppealRequest } from "@/types/appeal";
import { X, FileIcon, Loader2 } from "lucide-react";

interface AppealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: number;
  onSuccess?: () => void;
}

export function AppealDialog({
  open,
  onOpenChange,
  evaluationId,
  onSuccess,
}: AppealDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: number; name: string; size: number }>>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!appealReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do khiếu nại",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length > 10) {
      toast({
        title: "Lỗi",
        description: "Tối đa 10 file minh chứng",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const request: CreateAppealRequest = {
        evaluationId,
        appealReason: appealReason.trim(),
        criteriaIds: [],
        fileIds: uploadedFiles.map(f => f.id),
      };

      const response = await createAppeal(request);
      
      if (!response.success) {
        throw new Error(response.message || "Không thể tạo khiếu nại");
      }

      toast({
        title: "Thành công",
        description: "Khiếu nại đã được gửi thành công. Vui lòng chờ xét duyệt.",
      });

      // Reset form
      setAppealReason("");
      setUploadedFiles([]);

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi khiếu nại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length + uploadedFiles.length > 10) {
      toast({
        title: "Lỗi",
        description: "Tối đa 10 file minh chứng",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Check file size
    const oversizedFiles = files.filter(f => f.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Lỗi",
        description: "Mỗi file không được vượt quá 50MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Use 0 as placeholder criteria ID for appeals
          const fileId = await uploadAppealFile(file, evaluationId, 0);
          
          if (fileId) {
            return {
              id: fileId,
              name: file.name,
              size: file.size,
            };
          }
          return null;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is { id: number; name: string; size: number } => r !== null);

      if (successfulUploads.length > 0) {
        setUploadedFiles(prev => [...prev, ...successfulUploads]);
        toast({
          title: "Thành công",
          description: `Đã tải lên ${successfulUploads.length} file`,
        });
      }

      if (successfulUploads.length < files.length) {
        const failedCount = files.length - successfulUploads.length;
        toast({
          title: "Cảnh báo",
          description: `${failedCount} file tải lên thất bại. Bạn vẫn có thể gửi khiếu nại mà không có file này.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Cảnh báo",
        description: "Không thể tải lên file. Bạn vẫn có thể gửi khiếu nại mà không có file đính kèm.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gửi khiếu nại</DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do khiếu nại và đính kèm minh chứng nếu có.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appeal Reason */}
          <div className="space-y-2">
            <Label htmlFor="appealReason">
              Lý do khiếu nại <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="appealReason"
              placeholder="Nhập lý do khiếu nại của bạn..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {appealReason.length} ký tự
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Minh chứng (không bắt buộc)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Đính kèm file minh chứng để hỗ trợ khiếu nại (tối đa 10 file, mỗi file tối đa 50MB)
            </p>
            
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={uploading || loading}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {uploading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải lên...
                </div>
              )}
              
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Đã tải lên {uploadedFiles.length} file:</p>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={loading}
                        className="flex-shrink-0 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || uploading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? "Đang gửi..." : "Gửi khiếu nại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

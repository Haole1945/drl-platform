"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureUpload } from "./SignatureUpload";
import { uploadSignature, saveDrawnSignature } from "@/lib/api/signature";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SignatureManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureUpdated: () => void;
}

export function SignatureManager({
  open,
  onOpenChange,
  onSignatureUpdated,
}: SignatureManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await uploadSignature(file);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Chữ ký đã được tải lên",
        });
        onSignatureUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải lên chữ ký",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDrawn = async (imageData: string) => {
    setIsLoading(true);
    try {
      const response = await saveDrawnSignature(imageData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Chữ ký đã được lưu",
        });
        onSignatureUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu chữ ký",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quản lý chữ ký điện tử</DialogTitle>
          <DialogDescription>
            Tải lên hoặc vẽ chữ ký của bạn. Chữ ký sẽ được sử dụng khi duyệt đánh giá.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Tải lên</TabsTrigger>
              <TabsTrigger value="draw">Vẽ chữ ký</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <SignatureUpload
                onUpload={handleUpload}
                onCancel={() => onOpenChange(false)}
              />
            </TabsContent>
            <TabsContent value="draw" className="mt-4">
              <SignatureCanvas
                onSave={handleSaveDrawn}
                onCancel={() => onOpenChange(false)}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

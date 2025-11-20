"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Image, Video, FileText, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Component for individual file item
function FileItem({ 
  file, 
  onDelete 
}: { 
  file: UploadedFile; 
  onDelete: (id: number) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const fileUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'}${file.fileUrl}`;
  
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
    document: ['application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  };
  
  const isImage = allowedTypes.image.includes(file.fileType);
  
  const getFileIcon = (fileType: string) => {
    if (allowedTypes.image.includes(fileType)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (allowedTypes.video.includes(fileType)) {
      return <Video className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-purple-500" />;
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="group flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 hover:border-primary/20 transition-all">
      {/* Thumbnail for images */}
      {isImage && !imageError ? (
        <div className="relative w-10 h-10 flex-shrink-0 rounded border overflow-hidden bg-muted">
          <img
            src={fileUrl}
            alt={file.fileName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded border bg-muted">
          {getFileIcon(file.fileType)}
        </div>
      )}
      
      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate text-foreground">
          {file.fileName}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {formatFileSize(file.fileSize)}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => window.open(fileUrl, '_blank')}
          title="Xem file"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-destructive/10"
          onClick={() => onDelete(file.id)}
          title="Xóa file"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export interface UploadedFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  subCriteriaId?: string;
}

interface FileUploadProps {
  evaluationId?: number;
  criteriaId: number;
  subCriteriaId?: string;
  onFilesChange: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  maxFiles?: number;
  maxSizeMB?: number;
}

export function FileUpload({
  evaluationId,
  criteriaId,
  subCriteriaId,
  onFilesChange,
  existingFiles = [],
  maxFiles = 10,
  maxSizeMB = 50,
}: FileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  // Ensure all files have unique IDs
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    return existingFiles.map((file, index) => ({
      ...file,
      id: file.id || Date.now() + index + Math.random(), // Generate unique ID if missing
    }));
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync files with existingFiles when it changes
  useEffect(() => {
    if (existingFiles.length > 0) {
      const filesWithIds = existingFiles.map((file, index) => ({
        ...file,
        id: file.id || Date.now() + index + Math.random(), // Generate unique ID if missing
      }));
      setFiles(filesWithIds);
    }
  }, [existingFiles]);

  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
    document: ['application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  };

  const getAllowedTypes = () => {
    return [...allowedTypes.image, ...allowedTypes.video, ...allowedTypes.document];
  };

  const getFileIcon = (fileType: string) => {
    if (allowedTypes.image.includes(fileType)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (allowedTypes.video.includes(fileType)) {
      return <Video className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-purple-500" />;
  };

  const isImage = (fileType: string) => allowedTypes.image.includes(fileType);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    if (!getAllowedTypes().includes(file.type)) {
      return 'File type not allowed. Allowed: images, videos, documents';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Lỗi",
        description: `Chỉ được upload tối đa ${maxFiles} file`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // Validate file
        const error = validateFile(file);
        if (error) {
          throw new Error(error);
        }

        // Upload file with retry logic
        const token = localStorage.getItem('accessToken');
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';
        
        // Retry logic for file upload (similar to API client)
        let lastError: Error | null = null;
        const maxRetries = 2;
        const delay = 1000;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // Create FormData for each attempt (FormData cannot be reused after being sent)
            const formData = new FormData();
            formData.append('file', file);
            if (evaluationId) formData.append('evaluationId', evaluationId.toString());
            formData.append('criteriaId', criteriaId.toString());
            if (subCriteriaId) formData.append('subCriteriaId', subCriteriaId);
            
            const response = await fetch(`${API_BASE}/files/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (!response.ok) {
              // Check if this is a retryable error (500, 503)
              if (response.status === 500 || response.status === 503) {
                // Retryable error - wait and retry
                if (attempt < maxRetries) {
                  const waitTime = delay * Math.pow(2, attempt);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                  continue; // Retry
                }
              }
              
              // Non-retryable error or last attempt
              const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
              throw new Error(errorData.message || 'Upload failed');
            }

            const result = await response.json();
            if (result.success && result.data) {
              return result.data as UploadedFile;
            }
            throw new Error('Invalid response from server');
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            // Check if this is a retryable error
            const isRetryable = 
              error instanceof TypeError || // Network errors
              (error instanceof Error && (
                error.message.includes('500') ||
                error.message.includes('503') ||
                error.message.includes('Connection refused') ||
                error.message.includes('Failed to fetch')
              ));
            
            // If this is the last attempt or error is not retryable, throw the error
            if (attempt === maxRetries || !isRetryable) {
              throw lastError;
            }
            
            // Wait before retrying (exponential backoff)
            const waitTime = delay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        
        // This should never be reached, but TypeScript needs it
        throw lastError || new Error('Upload failed after all retries');
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);

      toast({
        title: "Thành công",
        description: `Đã upload ${uploadedFiles.length} file`,
      });
    } catch (error: any) {
      // Only show error if it's a real failure after all retries
      // Transient errors that were retried successfully won't reach here
      // If we reach here, it means all retries failed
      toast({
        title: "Lỗi upload",
        description: error.message || "Không thể upload file sau nhiều lần thử. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';
      
      // Retry logic for file delete (similar to API client)
      let lastError: Error | null = null;
      const maxRetries = 2;
      const delay = 1000;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(`${API_BASE}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const newFiles = files.filter(f => f.id !== fileId);
            setFiles(newFiles);
            onFilesChange(newFiles);
            toast({
              title: "Đã xóa",
              description: "File đã được xóa",
            });
            return; // Success
          } else {
            // Check if this is a retryable error (500, 503)
            if (response.status === 500 || response.status === 503) {
              // Retryable error - wait and retry
              if (attempt < maxRetries) {
                const waitTime = delay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Retry
              }
            }
            
            // Non-retryable error or last attempt
            throw new Error('Delete failed');
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Check if this is a retryable error
          const isRetryable = 
            error instanceof TypeError || // Network errors
            (error instanceof Error && (
              error.message.includes('500') ||
              error.message.includes('503') ||
              error.message.includes('Connection refused') ||
              error.message.includes('Failed to fetch')
            ));
          
          // If this is the last attempt or error is not retryable, throw the error
          if (attempt === maxRetries || !isRetryable) {
            throw lastError;
          }
          
          // Wait before retrying (exponential backoff)
          const waitTime = delay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // This should never be reached, but TypeScript needs it
      throw lastError || new Error('Delete failed after all retries');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAllowedTypes().join(',')}
          onChange={handleFileSelect}
          disabled={uploading || files.length >= maxFiles}
          className="hidden"
          id={`file-upload-${criteriaId}-${subCriteriaId || 'main'}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Đang upload...' : 'Chọn file'}
        </Button>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground text-center">
            {files.length} file
          </span>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file) => (
            <FileItem 
              key={file.id} 
              file={file} 
              onDelete={handleDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}


import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, FileUpload } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadComponentProps {
  onUploadComplete?: (files: FileUpload[]) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  multiple = false,
  accept = 'image/*,application/pdf,.doc,.docx,.txt',
  maxSize = 10, // 10MB default
  className,
  disabled = false,
  showPreview = true
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }
    return null;
  };

  const handleFiles = async (files: FileList) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        onUploadError?.(error);
        return;
      }
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      let uploadedFiles: FileUpload[];

      if (multiple && fileArray.length > 1) {
        const response = await api.uploadMultipleFiles(fileArray);
        if (response.success && response.data) {
          uploadedFiles = response.data.files;
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } else {
        const response = await api.uploadFile(fileArray[0]);
        if (response.success && response.data) {
          uploadedFiles = [response.data];
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      }

      setUploadedFiles(prev => [...prev, ...uploadedFiles]);
      onUploadComplete?.(uploadedFiles);
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary",
          isUploading && "opacity-50"
        )}
        onClick={!disabled && !isUploading ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        
        {isUploading ? (
          <p className="text-sm text-gray-600">Uploading files...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              {multiple ? 'Multiple files allowed' : 'Single file only'} • Max {maxSize}MB per file
            </p>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          className="mt-2"
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick();
          }}
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {/* File Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  {getFileIcon(file.mimeType)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
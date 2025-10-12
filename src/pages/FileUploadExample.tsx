import React from 'react';
import FileUploadComponent from '@/components/FileUploadComponent';
import { FileUpload } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FileUploadExample() {
  const handleUploadComplete = (files: FileUpload[]) => {
    console.log('Files uploaded successfully:', files);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">File Upload System</h1>
        <p className="text-gray-600 mt-2">
          Upload files using Hygraph asset management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Single File Upload</CardTitle>
            <CardDescription>
              Upload one file at a time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadComponent
              multiple={false}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              accept="image/*,application/pdf"
              maxSize={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multiple File Upload</CardTitle>
            <CardDescription>
              Upload multiple files at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadComponent
              multiple={true}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              accept="*"
              maxSize={10}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Backend Endpoints:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><code>POST /api/files/upload</code> - Upload single file</li>
              <li><code>POST /api/files/upload-multiple</code> - Upload multiple files</li>
              <li><code>GET /api/files/:id</code> - Get file information</li>
              <li><code>DELETE /api/files/:id</code> - Delete file</li>
              <li><code>GET /api/files</code> - List all files with pagination</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold">File Storage:</h3>
            <p className="text-sm text-gray-600">
              Files are stored in Hygraph's asset management system and are automatically published for public access.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Supported File Types:</h3>
            <p className="text-sm text-gray-600">
              Images (JPEG, PNG, GIF, WebP), PDFs, Word documents, Excel files, PowerPoint, and plain text files.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">File Size Limits:</h3>
            <p className="text-sm text-gray-600">
              Maximum file size: 10MB per file by default (configurable)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
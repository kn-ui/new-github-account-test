import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { userService } from '@/lib/firestore';

interface CSVUser {
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
}

interface CSVUploadProps {
  onUsersCreated: (count: number) => void;
  onError: (message: string) => void;
}

export default function CSVUpload({ onUsersCreated, onError }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVUser[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0); // Track current progress
  const [successCount, setSuccessCount] = useState(0); // Track successful creations
  const [errorCount, setErrorCount] = useState(0); // Track failed creations
  const [totalUsers, setTotalUsers] = useState(0); // Track total users to create
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      onError('Please select a valid CSV file');
      return;
    }

    setUploadedFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validate required headers
        const requiredHeaders = ['displayname', 'email', 'role'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          onError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const users: CSVUser[] = [];
        const newErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const user: CSVUser = {
              displayName: values[headers.indexOf('displayname')] || '',
              email: values[headers.indexOf('email')] || '',
              role: values[headers.indexOf('role')] as 'student' | 'teacher' | 'admin' | 'super_admin' || 'student',
            };

            // Validate user data
            if (!user.displayName) {
              newErrors.push(`Row ${i + 1}: Missing display name`);
            }
            if (!user.email || !isValidEmail(user.email)) {
              newErrors.push(`Row ${i + 1}: Invalid email address`);
            }
            if (!['student', 'teacher', 'admin', 'super_admin'].includes(user.role)) {
              newErrors.push(`Row ${i + 1}: Invalid role (must be student, teacher, or admin)`);
            }

            users.push(user);
          }
        }

        setPreview(users);
        setErrors(newErrors);
      } catch (error) {
        onError('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleUpload = async () => {
    if (!uploadedFile || preview.length === 0 || errors.length > 0) {
      console.log('Upload blocked:', { uploadedFile: !!uploadedFile, previewLength: preview.length, errorsLength: errors.length });
      return;
    }

    console.log('Starting bulk user creation for', preview.length, 'users');
    setIsProcessing(true);
    
    // Initialize counters
    setSuccessCount(0);
    setErrorCount(0);
    setTotalUsers(preview.length);
    
    try {
      // SOLUTION: Use secondary Firebase auth for bulk user creation
      // 
      // Same solution as single user creation - use secondaryAuth to prevent
      // the main app's authentication state from being affected during bulk
      // user creation, avoiding unwanted redirects.
      
      // Set a flag to suppress auth redirects during bulk user creation
      sessionStorage.setItem('suppressAuthRedirect', 'true');
      
      const uploadErrors: string[] = []; // Renamed to avoid conflict with state
      
      for (let i = 0; i < preview.length; i++) {
        const user = preview[i];
        
        // Update progress
        setCurrentProgress(Math.round(((i + 1) / totalUsers) * 100));
        
        console.log(`Creating user ${i + 1}/${totalUsers}: ${user.email}`);
        
        try {
          // Set default password based on role
          const defaultPasswords = {
            student: 'student123',
            teacher: 'teacher123',
            admin: 'admin123',
            super_admin: 'superadmin123'
          };
          const password = defaultPasswords[user.role] || 'password123';
          
          // Use secondary auth to create user - this prevents the main app from being affected
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth, 
            user.email, 
            password
          );
          
          // Create Firestore user profile using the UID from secondary auth
          await userService.createUser({
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            isActive: true,
            uid: userCredential.user.uid,
            passwordChanged: false // New users must change their password
          });
          
          // Immediately sign out from secondary auth to clean up
          await signOut(secondaryAuth);
          
          setSuccessCount(prev => prev + 1);
          console.log(`Successfully created user: ${user.email}`);
          
          // Small delay to prevent overwhelming Firebase API and show progress
          if (i < preview.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error: any) {
          setErrorCount(prev => prev + 1);
          // Log specific error for debugging
          if (error.code === 'auth/email-already-in-use') {
            uploadErrors.push(`${user.email}: Email already exists`);
            console.error(`User ${user.email} already exists - skipping`);
          } else if (error.code === 'auth/invalid-email') {
            uploadErrors.push(`${user.email}: Invalid email format`);
            console.error(`Invalid email ${user.email}:`, error);
          } else {
            uploadErrors.push(`${user.email}: ${error.message || 'Unknown error'}`);
            console.error(`Failed to create user ${user.email}:`, error);
          }
        }
      }

      // Clear the suppress flag
      sessionStorage.removeItem('suppressAuthRedirect');
      
      // Reset progress
      setCurrentProgress(0);
      
      // Show summary of results
      if (errorCount > 0) {
        const errorSummary = `Successfully created ${successCount} users. ${errorCount} users failed:\n\n${uploadErrors.join('\n')}`;
        onError(errorSummary);
      } else {
        onUsersCreated(successCount);
      }
      
      resetUpload();
    } catch (error) {
      // Clear the suppress flag on error
      sessionStorage.removeItem('suppressAuthRedirect');
      setCurrentProgress(0);
      console.error('Bulk user creation failed:', error);
      onError(`Failed to create users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      console.log('Bulk user creation process completed');
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPreview([]);
    setErrors([]);
    setCurrentProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    setTotalUsers(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'displayName,email,role\nJohn Doe,john@example.com,student\nJane Smith,jane@example.com,teacher';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your CSV file here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supports CSV files with columns: displayName, email, role
        </p>
        
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download Template
        </button>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Preview ({preview.length} users)
            </h3>
            <button
              type="button"
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <h4 className="text-sm font-medium text-red-800">Validation Errors</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((user, index) => {
                  const hasError = errors.some(error => error.includes(`Row ${index + 2}`));
                  return (
                    <tr key={index} className={hasError ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasError ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Upload Button and Progress */}
          <div className="mt-6">
            {isProcessing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Creating users...</span>
                  <span>{currentProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isProcessing || errors.length > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Users... ({successCount + errorCount}/{totalUsers})
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create {preview.length} Users
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
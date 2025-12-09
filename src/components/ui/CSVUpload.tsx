import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, GraduationCap } from 'lucide-react';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { userService } from '@/lib/firestore'; // Assuming userService can check existence or we'll mock it

// studentId is removed, it will be auto-generated
interface StudentCSVData {
  displayName: string;
  email: string;
  programType: string; // Required for ID generation
  phoneNumber?: string;
  address?: string;
  studentGroup?: string;
  classSection?: string;
  year?: string;
  existsInDb?: boolean; // New field to indicate if user already exists in DB
  isCheckingExistence?: boolean; // New field to indicate if existence check is in progress
}

interface CSVUploadProps {
  onUsersCreated: (count: number) => void;
  onError: (message: string) => void;
}

export default function CSVUpload({ onUsersCreated, onError }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentCSVData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
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
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            onError('CSV file must contain a header row and at least one data row.');
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));

        // programtype is now required for ID generation
        const requiredHeaders = ['displayname', 'email', 'programtype'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          onError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const users: StudentCSVData[] = [];
        const newErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const user: StudentCSVData = {
            displayName: values[headers.indexOf('displayname')] || '',
            email: values[headers.indexOf('email')] || '',
            programType: values[headers.indexOf('programtype')] || '',
            phoneNumber: values[headers.indexOf('phonenumber')] || '',
            address: values[headers.indexOf('address')] || '',
            studentGroup: values[headers.indexOf('studentgroup')] || '',
            classSection: values[headers.indexOf('classsection')] || '',
            year: values[headers.indexOf('year')] || '',
            isCheckingExistence: false, // Initialize
            existsInDb: undefined, // Initialize
          };

          if (!user.displayName) newErrors.push(`Row ${i + 1}: Missing display name`);
          if (!user.email || !isValidEmail(user.email)) newErrors.push(`Row ${i + 1}: Invalid or missing email`);
          if (!user.programType) newErrors.push(`Row ${i + 1}: Missing Program Type (required for student ID generation)`);

          users.push(user);
        }

        setPreview(users);
        setErrors(newErrors);
      } catch (error) {
        onError('Failed to parse CSV file. Please ensure it is correctly formatted.');
      }
    };
    reader.readAsText(file);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

    // Effect to check existence in DB for previewed users
    useEffect(() => {
      if (preview.length > 0) {
        const checkExistence = async () => {
          // Temporarily mark all users as checking
          setPreview(prev => prev.map(user => ({ ...user, isCheckingExistence: true, existsInDb: undefined })));
  
          const updatedPreview = await Promise.all(preview.map(async (user) => {
            if (!isValidEmail(user.email)) { // Skip check for invalid emails
              return { ...user, existsInDb: false, isCheckingExistence: false };
            }
            
            try {
              // Use actual userService to check user existence
              const exists = await userService.checkUserExistsByEmail(user.email);
              return { ...user, existsInDb: exists, isCheckingExistence: false };
            } catch (error) {
              console.error(`Error checking existence for ${user.email}:`, error);
              return { ...user, existsInDb: false, isCheckingExistence: false }; // Assume not exists on error
            }
          }));
          setPreview(updatedPreview);
        };
        checkExistence();
      }
    }, [preview.length]); // Only re-run when the number of previewed users changes
  const handleUpload = async () => {
    if (!uploadedFile || preview.length === 0 || errors.length > 0) return;

    setIsProcessing(true);
    setSuccessCount(0);
    setErrorCount(0);
    setTotalUsers(preview.length);
    
    sessionStorage.setItem('suppressAuthRedirect', 'true');
    const uploadErrors: string[] = [];
      
    for (let i = 0; i < preview.length; i++) {
      const user = preview[i];
      setCurrentProgress(Math.round(((i + 1) / preview.length) * 100));
      
      // Skip creation if user already exists based on preview check
      if (user.existsInDb) {
        setErrorCount(prev => prev + 1);
        uploadErrors.push(`${user.email}: User already exists (skipped)`);
        console.warn(`Skipping creation for ${user.email}: already exists.`);
        continue; // Skip to next user
      }
      
      try {
        const password = 'student123';
        
        // Auto-generate student ID
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-id/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ programType: user.programType }),
        });
        if (!response.ok) throw new Error('Failed to generate student ID');
        const data = await response.json();
        const studentId = data.studentId;

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, password);
        
        await userService.createUser({
          displayName: user.displayName,
          email: user.email,
          role: 'student',
          isActive: true,
          uid: userCredential.user.uid,
          passwordChanged: false,
          studentId: studentId, // Use generated ID
          phoneNumber: user.phoneNumber,
          address: user.address,
          studentGroup: user.studentGroup,
          programType: user.programType,
          classSection: user.classSection,
          year: user.year
        });
        
        await signOut(secondaryAuth);
        setSuccessCount(prev => prev + 1);
        
        if (i < preview.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        setErrorCount(prev => prev + 1);
        let errorMessage = `Failed to create user ${user.email}: ${error.message || 'Unknown error'}`;
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = `${user.email}: Email already exists`;
        }
        uploadErrors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    sessionStorage.removeItem('suppressAuthRedirect');
    setCurrentProgress(0);
    
    if (uploadErrors.length > 0) {
      const errorSummary = `Successfully created ${successCount} students. ${errorCount} students failed:\n\n${uploadErrors.join('\n')}`;
      onError(errorSummary);
    } else {
      onUsersCreated(successCount);
    }
    
    resetUpload();
    setIsProcessing(false);
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
    // studentId is removed, programType is now required
    const headers = 'displayName,email,programType,phoneNumber,address,studentGroup,classSection,year';
    const example = 'abebe,abebe@example.com,Online,0900000001,AA,Youth,A,1st Year';
    const template = `${headers}\n${example}`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
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
        
        <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop a CSV file to bulk upload students, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Required columns: displayName, email, programType.
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

      {preview.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Student Upload Preview ({preview.length})
            </h3>
            <button
              type="button"
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((user, index) => {
                  const hasError = errors.some(error => error.includes(`Row ${index + 2}`));
                  return (
                    <tr key={index} className={hasError ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.displayName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-all">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.programType}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.isCheckingExistence ? (
                          <span className="flex items-center text-blue-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            Checking...
                          </span>
                        ) : hasError ? (
                          <span className="flex items-center text-red-500">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Error
                          </span>
                        ) : user.existsInDb ? (
                          <span className="flex items-center text-orange-500">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Already Exists
                          </span>
                        ) : (
                          <span className="flex items-center text-green-500">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            {isProcessing && (
               <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Creating students...</span>
                  <span>{successCount + errorCount} / {totalUsers} ({currentProgress}%)</span>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create {preview.length} Students
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
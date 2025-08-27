import React, { useState } from 'react';
import { X } from 'lucide-react';
import ReportGenerator from '@/components/ui/ReportGenerator';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const [message, setMessage] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Reports</h1>
              <p className="text-sm text-blue-100">Generate comprehensive system reports</p>
            </div>
          </div>
          {message && (
            <div className="mt-4 p-3 rounded border bg-green-50 border-green-200 text-green-800 flex items-center justify-between">
              <span>{message}</span>
              <button className="text-green-700" onClick={() => setMessage(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportGenerator onReportGenerated={setMessage} />
      </div>
    </div>
  );
}
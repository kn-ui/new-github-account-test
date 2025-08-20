import React, { useState } from 'react';
import { X } from 'lucide-react';
import ReportGenerator from '@/components/ui/ReportGenerator';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const [message, setMessage] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
              <p className="text-gray-600">Generate comprehensive system reports</p>
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
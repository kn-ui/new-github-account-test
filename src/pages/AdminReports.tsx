import React, { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import ReportGenerator from '@/components/ui/ReportGenerator';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminReportsPage() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  
  // Access control - only admins and super_admins can access
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
{/*       <DashboardHero 
        title="Admin Reports"
        subtitle="Generate comprehensive system reports"
      /> */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 p-3 rounded border bg-green-50 border-green-200 text-green-800 flex items-center justify-between shadow-sm">
            <span>{message}</span>
            <button className="text-green-700" onClick={() => setMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <ReportGenerator onReportGenerated={setMessage} />
        </div>
        <div className="mt-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Tips</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>Choose a recent date range to speed up report generation.</li>
                <li>Export to CSV for large data sets and for use in spreadsheet software.</li>
                <li>Use the filters within each report type to narrow down the scope of your data.</li>
                <li>The 'System Overview' report provides a high-level snapshot of key metrics.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, FileText, BarChart3, TrendingUp, Activity } from 'lucide-react';
import ReportGenerator from '@/components/ui/ReportGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReportsPage() {
  const [message, setMessage] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Admin Reports</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Generate comprehensive system reports and analytics for better decision making.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">5+</div>
              <div className="text-blue-100 text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Available reports
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">Real-time</div>
              <div className="text-green-100 text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Live data insights
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-purple-100 text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                System monitoring
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 flex items-center justify-between shadow-lg">
            <span className="font-medium">{message}</span>
            <button className="text-green-700 hover:text-green-900 transition-colors" onClick={() => setMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Report Generator */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              Generate Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReportGenerator onReportGenerated={setMessage} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
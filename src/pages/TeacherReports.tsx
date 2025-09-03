import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TeacherReportGenerator from '@/components/ui/TeacherReportGenerator';
import { Button } from '@/components/ui/button';
  import DashboardHero from '@/components/DashboardHero';

  
export default function TeacherReportsPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);



  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Teacher Reports"
        subtitle="Export data related to your courses"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherReportGenerator onReportGenerated={setMessage} />
      </div>
    </div>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { certificateService, activityLogService, FirestoreCertificate } from '@/lib/firestore';
import { evaluateAndAwardCertificates } from '@/lib/certificates';
import CertificateCard from '@/components/CertificateCard';
import { Button } from '@/components/ui/button';

export default function CertificatesPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState<FirestoreCertificate[]>([]);

  const load = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await activityLogService.upsertToday(currentUser.uid);
      const list = await certificateService.getCertificatesForUser(currentUser.uid);
      setCerts(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentUser?.uid]);

  const checkNew = async () => {
    if (!currentUser) return;
    await evaluateAndAwardCertificates(currentUser.uid);
    await load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading certificates...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
              <p className="text-gray-600">Your earned achievements</p>
            </div>
            <div className="ml-auto">
              <Button onClick={checkNew}>Check for new</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map(c => (
            <CertificateCard
              key={c.id}
              type={c.type}
              studentName={userProfile?.displayName || 'Student'}
              awardedAt={c.awardedAt.toDate()}
              details={c.details}
            />
          ))}
          {certs.length === 0 && (
            <div className="text-center text-gray-500 col-span-full">
              <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              No certificates yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


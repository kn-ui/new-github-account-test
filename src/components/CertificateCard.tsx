import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Props = {
  type: 'top-performer' | 'perfect-attendance' | 'homework-hero';
  studentName: string;
  awardedAt: Date;
  details?: Record<string, any>;
};

const labels: Record<Props['type'], string> = {
  'top-performer': 'Top Performer',
  'perfect-attendance': 'Perfect Attendance',
  'homework-hero': 'Homework Hero',
};

export default function CertificateCard({ type, studentName, awardedAt, details }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.save(`${labels[type]}-${studentName}.pdf`);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div ref={ref} className="bg-gray-50 border rounded-lg p-8 text-center">
        <div className="text-2xl font-bold mb-2">{labels[type]}</div>
        <div className="text-sm text-gray-600 mb-6">Awarded to</div>
        <div className="text-3xl font-extrabold mb-4">{studentName}</div>
        <div className="text-sm text-gray-700 mb-2">Date: {awardedAt.toLocaleDateString()}</div>
        {details && (
          <div className="text-xs text-gray-500">
            {Object.entries(details).map(([k, v]) => (
              <div key={k}>{k}: {String(v)}</div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={downloadPDF} className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Download PDF</button>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userService, FirestoreUser } from '@/lib/firestore';
import { jsPDF } from 'jspdf';
import { toEthiopianDate } from '@/lib/ethiopianCalendar';
import CertificateImage from '@/assets/Certificate.png';

const CertificateGenerator: React.FC = () => {
  const [studentQuery, setStudentQuery] = useState('');
  const [foundStudents, setFoundStudents] = useState<FirestoreUser[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<FirestoreUser | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const searchStudents = async () => {
    if (!studentQuery.trim()) {
      setFoundStudents([]);
      return;
    }

    const students = await userService.getUsers(50, ['student']);
    const filtered = students.filter(s =>
      s.displayName.toLowerCase().includes(studentQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentQuery.toLowerCase())
    );

    setFoundStudents(filtered);
  };

  const handleGenerateCertificate = async () => {
    if (!selectedStudent) {
      alert('Please select a student.');
      return;
    }

    setIsGenerating(true);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px'
    });

    // Load certificate background
    const img = new Image();
    img.src = CertificateImage;

    img.onload = async () => {
      const pdfWidth = 600;
      const pdfHeight = (img.height * pdfWidth) / img.width;

      doc.addImage(CertificateImage, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // ----------------------------
      //  Load Amharic Font (Local)
      // ----------------------------
      try {
        const fontUrl = '/fonts/AbyssinicaSIL-Regular.ttf'; // <=== PATH FROM PUBLIC FOLDER
        const fontResponse = await fetch(fontUrl);
        const fontBuffer = await fontResponse.arrayBuffer();

        const fontBase64 = btoa(
          new Uint8Array(fontBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        doc.addFileToVFS('Abyssinica.ttf', fontBase64);
        doc.addFont('Abyssinica.ttf', 'Abyssinica', 'normal');
        doc.setFont('Abyssinica');
      } catch (err) {
        console.error('Failed to load Amharic font:', err);
      }

      const studentName = selectedStudent.displayName;

      const generationDate = new Date();
      const ethiopianDate = toEthiopianDate(generationDate);

      const gregorianDay = String(generationDate.getDate());
      const gregorianMonth = String(generationDate.getMonth() + 1);
      const gregorianYear = String(generationDate.getFullYear());

      // ----------------------------
      //  TEXT PLACEMENT
      // ----------------------------

      // Student name
      doc.text(studentName, 135, 185);

      // Ethiopian date
      doc.text(String(ethiopianDate.day), 90, 295);
      doc.text(String(ethiopianDate.year), 138, 295);

      // Gregorian (English) date
      doc.text(gregorianDay, 473, 285);
      doc.text(gregorianMonth, 505, 285);
      doc.text(gregorianYear, 530, 285);

      doc.save(`${selectedStudent.displayName}-Appreciation_Certificate.pdf`);
      setIsGenerating(false);
    };

    img.onerror = () => {
      alert('Failed to load certificate image.');
      setIsGenerating(false);
    };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Certificate Generator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="student-search">Search for a student</label>
              <div className="flex gap-2">
                <Input
                  id="student-search"
                  placeholder="Enter name or email..."
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
                <Button onClick={searchStudents}>Search</Button>
              </div>
            </div>

            {foundStudents.length > 0 && (
              <ul className="border rounded-md max-h-48 overflow-y-auto">
                {foundStudents.map(student => (
                  <li
                    key={student.uid}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedStudent?.uid === student.uid ? 'bg-blue-100' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    {student.displayName} ({student.email})
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Generate Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateCertificate}
              disabled={!selectedStudent || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Appreciation Certificate'}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              This will generate a PDF certificate of appreciation for the selected student. The text will be placed on the certificate template.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificateGenerator;

import React from 'react';
import schoolLogo from '@/assets/logo.jpg'; // adjust path if needed

interface TranscriptViewProps {
  student: any;
  finalGrades: any[];
  courses: any[];
  groupedFinalGrades: {
    [year: string]: {
      [semester: string]: any[];
    };
  };
  classSection?: string;
  gpaStats: any;
  progressiveGpaStats: any;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({
  student,
  finalGrades,
  courses,
  groupedFinalGrades,
  classSection,
  gpaStats,
  progressiveGpaStats,
}) => {
  const totalAverage =
    finalGrades.length > 0
      ? finalGrades.reduce((sum, g) => sum + (g.finalGrade || 0), 0) /
        finalGrades.length
      : 0;

  const resultStatus = totalAverage >= 50 ? 'አለፈ' : 'ወደቀ';

  return (
    <div
      id="transcript-to-print"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        fontFamily: 'AbyssinicaSIL, serif',
        fontSize: '9pt',
        lineHeight: '1.2',
        color: '#000',
        background: '#fff'
      }}
    >
      {/* ================= STYLES ================= */}
      <style>{`
        @font-face {
          font-family: 'AbyssinicaSIL';
          src: url('/fonts/AbyssinicaSIL-Regular.ttf') format('truetype');
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }

        th, td {
          border: 1px solid #000;
          padding: 2px 4px;
          height: 18px;
          vertical-align: middle;
        }

        th {
          font-weight: bold;
          text-align: center;
        }

        .center { text-align: center; }
        .right { text-align: right; }

        .semester-block {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 6mm;
        }

        .semester-title {
          font-weight: bold;
          margin-bottom: 2mm;
        }

        .no-border td {
          border: none;
          padding: 2px 0;
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <div className="center" style={{ marginBottom: '6mm' }}>
        <img
          src={schoolLogo}
          alt="School Logo"
          style={{
            width: '28mm',
            height: '28mm',
            objectFit: 'contain',
            marginBottom: '3mm'
          }}
        />

        <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
          የደብረ ኃይል ቅዱስ ራጉኤል ሰንበት ትምህርት ቤት
        </div>

        <div style={{ fontSize: '10pt', marginTop: '2mm' }}>
          የትምህርት ዐቢይ ክፍል
        </div>

        <div
          style={{
            fontSize: '12pt',
            fontWeight: 'bold',
            marginTop: '4mm',
            textDecoration: 'underline'
          }}
        >
          የተማሪ ትራንስክሪፕት
        </div>
      </div>

      {/* ================= STUDENT INFO ================= */}
      <table style={{ marginBottom: '8mm' }}>
        <tbody>
          <tr>
            <td><strong>ሙሉ ስም</strong></td>
            <td>{student?.displayName || '—'}</td>
            <td><strong>መለያ ቁጥር</strong></td>
            <td>{student?.studentId || '—'}</td>
          </tr>
          <tr>
            <td><strong>ክፍል</strong></td>
            <td>{classSection || '—'}</td>
            <td><strong>የትምህርት ዘመን</strong></td>
            <td>{Object.keys(groupedFinalGrades).join(', ')}</td>
          </tr>
        </tbody>
      </table>

      {/* ================= GRADES ================= */}
      {Object.entries(groupedFinalGrades).map(([year, semesters]) => (
        <div key={year} style={{ marginBottom: '8mm' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3mm' }}>
            የትምህርት ዘመን፡ {year}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {Object.entries(semesters).map(([semester, grades]) => {
              const safeGrades = grades || [];
              const semesterStats = progressiveGpaStats[year] && progressiveGpaStats[year][semester];
              const semesterGPA = semesterStats ? semesterStats.semesterGpa.toFixed(2) : '—';
              const cumulativeGPA = semesterStats ? semesterStats.cumulativeGpa.toFixed(2) : '—';

              return (
                <div key={semester} className="semester-block" style={{ width: '48%' }}>
                  <div className="semester-title">{semester}</div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>የትምህርት አይነት</th>
                        <th style={{ width: '15%' }}>ECTS</th>
                        <th style={{ width: '15%' }}>Grade</th>
                        <th style={{ width: '30%' }}>Cr.pts</th>
                      </tr>
                    </thead>

                    <tbody>
                      {safeGrades.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="center">
                            ውጤት አልተመዘገበም
                          </td>
                        </tr>
                      ) : (
                        safeGrades.map((grade: any) => {
                          const course = courses.find(
                            c => c.id === grade.courseId
                          );
                          const creditPoints = course?.credit * grade.gradePoints;

                          return (
                            <tr key={grade.id}>
                              <td>{course?.title || '—'}</td>
                              <td className="center">
                                {grade.gradePoints?.toFixed(2) ?? '—'}
                              </td>
                              <td className="center">{grade.letterGrade || '—'}</td>
                              <td className="center">{creditPoints?.toFixed(2) ?? '—'}</td>
                            </tr>
                          );
                        })
                      )}

                      {/* Semester Average */}
                      <tr>
                        <td style={{ fontWeight: 'bold' }} colSpan={3}>
                          የሴሚስተር GPA
                        </td>
                        <td className="center" style={{ fontWeight: 'bold' }}>
                          {semesterGPA}
                        </td>
                      </tr>
                      {/* Cumulative GPA */}
                      <tr>
                        <td style={{ fontWeight: 'bold' }} colSpan={3}>
                          የአጠቃላይ GPA
                        </td>
                        <td className="center" style={{ fontWeight: 'bold' }}>
                          {cumulativeGPA}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ================= FINAL SUMMARY ================= */}
      <table style={{ marginTop: '6mm' }}>
        <tbody>
          <tr>
            <td><strong>ጠቅላላ አማካይ</strong></td>
            <td>{gpaStats.cumulativeGPA?.toFixed(2) ?? '—'}</td>
            <td><strong>ውጤት</strong></td>
            <td>{resultStatus}</td>
          </tr>
        </tbody>
      </table>

      {/* ================= SIGNATURES ================= */}
      <table className="no-border" style={{ marginTop: '12mm' }}>
        <tbody>
          <tr>
            <td>አዘጋጅ፡ ____________________</td>
            <td className="right">ያፀደቀው፡ ____________________</td>
          </tr>
          <tr>
            <td style={{ paddingTop: '6mm' }}>
              ቀን፡ {new Date().toLocaleDateString('am-ET')}
            </td>
            <td className="right" style={{ paddingTop: '6mm' }}>
              ማህተም፡ ____________________
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TranscriptView;

import schoolLogo from "@/assets/logo.jpg"; // adjust path if needed
import React from "react";

interface TranscriptViewProps {
  student: any;
  finalGrades: any[];
  courses: any[];
  classSection?: string;
  gpaStats: any;
}

const letterToDefaultPoints = (letter?: string) => {
  if (!letter) return 0;
  const map: Record<string, number> = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.75,
    "B+": 3.5,
    B: 3.0,
    "B-": 2.75,
    "C+": 2.0,
    C: 1.5,
    D: 1.0,
    F: 0.0,
  };
  return map[letter] ?? 0;
};

const TranscriptView: React.FC<TranscriptViewProps> = ({
  student,
  finalGrades,
  courses,
  classSection,
  gpaStats,
}) => {
  const totalAverage =
    finalGrades.length > 0
      ? finalGrades.reduce((sum, g) => sum + (g.finalGrade || 0), 0) /
        finalGrades.length
      : 0;

  const resultStatus = totalAverage >= 50 ? "አለፈ" : "ወደቀ";

  return (
    <div
      id="transcript-to-print"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "15mm",
        fontFamily: "AbyssinicaSIL, serif",
        fontSize: "9.5pt", // Slightly increased font size
        lineHeight: "1.3",
        color: "#000",
        background: "#fff",
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
          font-size: 9.5pt;
        }

        th, td {
          border: 1px solid #000;
          padding: 6px 5px; /* INCREASED VERTICAL PADDING (3px -> 6px) */
          height: auto;
          vertical-align: middle;
        }

        th {
          font-weight: bold;
          text-align: center;
          background-color: #f0f0f0; /* Light background for headers */
        }

        .center { text-align: center; }
        .right { text-align: right; }

        .year-block {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 12mm;
            border: 1px solid #ddd;
            padding: 5px;
        }

        .semester-block {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 6mm;
        }

        .no-border td {
          border: none;
          padding: 2px 0;
        }
        
        /* New style for GPA summary tables */
        .gpa-summary-table {
            border: 1px solid #000;
            border-collapse: collapse;
            width: 100%;
            margin-top: 5px;
        }
        .gpa-summary-table td {
            border: none;
            padding: 6px 6px; /* INCREASED VERTICAL PADDING (4px -> 6px) */
        }
        .gpa-summary-table tr:first-child td {
            border-bottom: 1px dashed #ccc;
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <div className="center" style={{ marginBottom: "8mm" }}>
        <img
          src={schoolLogo}
          alt="School Logo"
          style={{
            width: "30mm",
            height: "30mm",
            objectFit: "contain",
            marginBottom: "3mm",
          }}
        />

        <div style={{ fontSize: "20pt", fontWeight: "bold" }}>
          የደብረ ኃይል ቅዱስ ራጉኤል ቤተ ክርስቲያን አንቀጸ 
        </div>

        <div style={{ fontSize: "20pt", fontWeight: "bold"}}>ብርሃን ሰንበት ትምህርት ቤት</div>

        <div
          style={{
            fontSize: "13pt",
            fontWeight: "bold",
            marginTop: "5mm",
            textDecoration: "underline",
          }}
        >
          የተማሪ ትራንስክሪፕት
        </div>
      </div>

      {/* ================= STUDENT INFO ================= */}
      <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "3mm" }}>
        የተማሪ መረጃ
      </div>
      <table style={{ marginBottom: "10mm" }}>
        <tbody>
          <tr>
            <td style={{ width: "20%" }}>
              <strong>ሙሉ ስም</strong>
            </td>
            <td style={{ width: "30%" }}>{student?.displayName || "—"}</td>
            <td style={{ width: "20%" }}>
              <strong>መለያ ቁጥር</strong>
            </td>
            <td style={{ width: "30%" }}>{student?.studentId || "—"}</td>
          </tr>
          <tr>
            <td>
              <strong>የትምህርት ዘመን</strong>
            </td>
            <td>{Object.keys(gpaStats.byYear).sort((a, b) => Number(a) - Number(b)).join(", ")}</td>
          </tr>
        </tbody>
      </table>

      {/* ================= GRADES & PROGRESSIVE GPA ================= */}
      {Object.entries(gpaStats.byYear).sort(([yearA], [yearB]) => Number(yearA) - Number(yearB)).map(([year, yearData], yearIndex, yearArray) => {
        const sortedSemesters = Object.entries(yearData.semesters).sort(([semA], [semB]) => semA.localeCompare(semB));
        
        // Calculate the cumulative GPA up to the end of the last processed semester
        let currentCumulativePoints = 0;
        let currentCumulativeCredits = 0;

        return (
          <div key={year} className="year-block">
            <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "6mm", paddingBottom: "2px", borderBottom: "2px solid #000" }}>
              የትምህርት ዘመን፡ {year}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {sortedSemesters.map(([semester, semesterData]) => {
                const semesterGrades = finalGrades.filter((grade) => {
                  const course = courses.find((c) => c.id === grade.courseId);
                  return course?.year.toString() === year && course?.semester === semester;
                });

                const semesterGPA = semesterData.gpa ? Number(semesterData.gpa).toFixed(2) : "—";
                
                // --- Progressive Cumulative GPA Calculation ---
                // We recalculate to ensure accuracy for the current semester's cumulative display
                let cumulativePointsUpToSemester = 0;
                let cumulativeCreditsUpToSemester = 0;
                
                yearArray.forEach(([y, yData]) => {
                    Object.entries(yData.semesters).sort(([sA], [sB]) => sA.localeCompare(sB)).forEach(([s]) => {
                        // Check if the semester/year combination is chronologically before or exactly the current one
                        if (Number(y) < Number(year) || (Number(y) === Number(year) && s <= semester)) {
                             const associatedGrades = finalGrades.filter((grade) => {
                                const course = courses.find((c) => c.id === grade.courseId);
                                return course?.year.toString() === y && course?.semester === s;
                            });
                             const totalPointsForSemester = associatedGrades.reduce((acc, grade) => {
                                const course = courses.find(c => c.id === grade.courseId);
                                const credit = Number(course?.credit) || 0;
                                const normalizedGradePoints = typeof grade.gradePoints === "number" && !isNaN(grade.gradePoints)
                                    ? Math.max(0, Math.min(4, grade.gradePoints))
                                    : letterToDefaultPoints(grade.letterGrade);
                                return acc + (normalizedGradePoints * credit);
                            }, 0);
                            const totalCreditsForSemester = associatedGrades.reduce((acc, grade) => {
                                const course = courses.find(c => c.id === grade.courseId);
                                return acc + (Number(course?.credit) || 0);
                            }, 0);
                            cumulativePointsUpToSemester += totalPointsForSemester;
                            cumulativeCreditsUpToSemester += totalCreditsForSemester;
                        }
                    });
                });

                const cumulativeGPAForSemester = cumulativeCreditsUpToSemester > 0 ? (cumulativePointsUpToSemester / cumulativeCreditsUpToSemester).toFixed(2) : "—";

                return (
                  <div
                    key={semester}
                    className="semester-block"
                    style={{ width: "49%", breakInside: "avoid" }}
                  >
                    <div className="semester-title" style={{ fontWeight: "bold", marginBottom: "3mm" }}>
                      {semester}
                    </div>

                    <table className="grade-table">
                      <thead>
                        <tr>
                          <th style={{ width: "45%" }}>የትምህርት አይነት</th>
                          <th style={{ width: "15%" }}>ክሬዲት</th>
                          <th style={{ width: "20%" }}>Grade</th>
                          <th style={{ width: "20%" }}>Cr.pts</th>
                        </tr>
                      </thead>

                      <tbody>
                        {semesterGrades.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="center" style={{ fontStyle: "italic", color: "#666" }}>
                              ውጤት አልተመዘገበም
                            </td>
                          </tr>
                        ) : (
                          semesterGrades.map((grade: any) => {
                            const course = courses.find(
                              (c) => c.id === grade.courseId
                            );

                            const normalizedGradePoints =
                              typeof grade.gradePoints === "number" &&
                              !isNaN(grade.gradePoints)
                                ? Math.max(0, Math.min(4, grade.gradePoints))
                                : letterToDefaultPoints(grade.letterGrade);

                            const credit = Number(course?.credit) || 0;
                            const creditPoints = credit * normalizedGradePoints;

                            return (
                              <tr key={grade.id}>
                                <td style={{ paddingLeft: '8px' }}>{course?.title || "—"}</td>
                                <td className="center">
                                  {credit > 0 ? credit : "—"}
                                </td>
                                <td className="center">
                                  {grade.letterGrade || "—"}
                                </td>
                                <td className="center">
                                  {isFinite(creditPoints)
                                    ? creditPoints.toFixed(2)
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    
                    {/* NEW: Dedicated GPA Summary Table for the Semester */}
                    <div style={{ marginTop: '5px', border: '1px solid #000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="gpa-summary-table">
                            <tbody>
                                <tr>
                                    <td style={{ width: '60%', fontWeight: "bold" }}>
                                        የሴሚስተር GPA
                                    </td>
                                    <td className="center" style={{ width: '40%', fontWeight: "bold" }}>
                                        {semesterGPA}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        የአጠቃላይ GPA (እስከዚህ ሴሚስተር)
                                    </td>
                                    <td className="center" style={{ fontWeight: "bold" }}>
                                        {cumulativeGPAForSemester}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ================= FINAL SUMMARY (Consolidated) ================= */}
      <div style={{ marginTop: "15mm", borderTop: "2px solid #000", paddingTop: "5mm" }}>
        <table className="final-summary-table" style={{ width: "50%", border: "none" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: "bold", width: "60%", border: "none", padding: "6px 0" }}>
                ጠቅላላ አማካይ (Final Cumulative GPA)
              </td>
              <td className="center" style={{ fontWeight: "bold", width: "40%", border: "none", padding: "6px 0" }}>
                {(gpaStats.cumulativeGpa).toFixed(2)}
              </td>
            </tr>
           {/* <tr>
                <td style={{ fontWeight: "bold", border: "none", padding: "6px 0" }}>
                    **ውጤት (Status)**
                </td>
                <td className="center" style={{ fontWeight: "bold", border: "none", padding: "6px 0" }}>
                    {resultStatus}
                </td>
            </tr> */}
          </tbody>
        </table>
      </div> 

      {/* ================= SIGNATURES ================= */}
      <table className="no-border" style={{ marginTop: "12mm", borderTop: "1px solid #ccc", paddingTop: "5mm" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%" }}>አዘጋጅ፡ ____________________</td>
            <td className="right" style={{ width: "50%" }}>ያፀደቀው፡ ____________________</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "8mm" }}>
              ቀን፡ {new Date().toLocaleDateString("am-ET")}
            </td>
            <td className="right" style={{ paddingTop: "8mm" }}>
              ማህተም፡ ____________________
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TranscriptView;
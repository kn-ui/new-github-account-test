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
        fontSize: "9pt",
        lineHeight: "1.2",
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
      <div className="center" style={{ marginBottom: "6mm" }}>
        <img
          src={schoolLogo}
          alt="School Logo"
          style={{
            width: "28mm",
            height: "28mm",
            objectFit: "contain",
            marginBottom: "3mm",
          }}
        />

        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>
          የደብረ ኃይል ቅዱስ ራጉኤል ሰንበት ትምህርት ቤት
        </div>

        <div style={{ fontSize: "10pt", marginTop: "2mm" }}>የትምህርት ዐቢይ ክፍል</div>

        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginTop: "4mm",
            textDecoration: "underline",
          }}
        >
          የተማሪ ትራንስክሪፕት
        </div>
      </div>

      {/* ================= STUDENT INFO ================= */}
      <table style={{ marginBottom: "8mm" }}>
        <tbody>
          <tr>
            <td>
              <strong>ሙሉ ስም</strong>
            </td>
            <td>{student?.displayName || "—"}</td>
            <td>
              <strong>መለያ ቁጥር</strong>
            </td>
            <td>{student?.studentId || "—"}</td>
          </tr>
          <tr>
            <td>
              <strong>ክፍል</strong>
            </td>
            <td>{classSection || "—"}</td>
            <td>
              <strong>የትምህርት ዘመን</strong>
            </td>
            <td>{Object.keys(gpaStats.byYear).sort((a, b) => Number(a) - Number(b)).join(", ")}</td>
          </tr>
        </tbody>
      </table>

      {/* ================= GRADES ================= */}
      {Object.entries(gpaStats.byYear).sort(([yearA], [yearB]) => Number(yearA) - Number(yearB)).map(([year, yearData]) => (
        <div key={year} style={{ marginBottom: "8mm" }}>
          <div style={{ fontWeight: "bold", marginBottom: "3mm" }}>
            የትምህርት ዘመን፡ {year}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Object.entries(yearData.semesters).sort(([semA], [semB]) => semA.localeCompare(semB)).map(([semester, semesterData]) => {
              const semesterGrades = finalGrades.filter((grade) => {
                const course = courses.find((c) => c.id === grade.courseId);
                return course?.year.toString() === year && course?.semester === semester;
              });

              const semesterGPA = semesterData.gpa ? Number(semesterData.gpa).toFixed(2) : "—";
              // Calculate cumulative GPA up to this semester.
              // This requires iterating through all previous years and semesters.
              // This is a simplified approach, a more robust solution might require a separate memoized calculation.
              let currentCumulativePoints = 0;
              let currentCumulativeCredits = 0;
              Object.entries(gpaStats.byYear).sort(([yA], [yB]) => Number(yA) - Number(yB)).forEach(([y, yData]) => {
                if (Number(y) < Number(year)) {
                  currentCumulativePoints += yData.totalYearPoints;
                  currentCumulativeCredits += yData.totalYearCredits;
                } else if (Number(y) === Number(year)) {
                  Object.entries(yData.semesters).sort(([sA], [sB]) => sA.localeCompare(sB)).forEach(([s, sData]) => {
                    if (s <= semester) { // Assuming semester comparison works alphabetically/numerically
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
                      currentCumulativePoints += totalPointsForSemester;
                      currentCumulativeCredits += totalCreditsForSemester;
                    }
                  });
                }
              });
              const cumulativeGPAForSemester = currentCumulativeCredits > 0 ? currentCumulativePoints / currentCumulativeCredits : 0;


              return (
                <div
                  key={semester}
                  className="semester-block"
                  style={{ width: "48%" }}
                >
                  <div className="semester-title">{semester}</div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>የትምህርት አይነት</th>
                        <th style={{ width: "15%" }}>ECTS</th>
                        <th style={{ width: "15%" }}>Grade</th>
                        <th style={{ width: "30%" }}>Cr.pts</th>
                      </tr>
                    </thead>

                    <tbody>
                      {semesterGrades.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="center">
                            ውጤት አልተመዘገበም
                          </td>
                        </tr>
                      ) : (
                        semesterGrades.map((grade: any) => {
                          const course = courses.find(
                            (c) => c.id === grade.courseId
                          );

                          // Normalized grade points: prefer stored gradePoints (0-4), otherwise map from letter grade
                          const normalizedGradePoints =
                            typeof grade.gradePoints === "number" &&
                            !isNaN(grade.gradePoints)
                              ? Math.max(0, Math.min(4, grade.gradePoints))
                              : letterToDefaultPoints(grade.letterGrade);

                          const credit = Number(course?.credit) || 0;
                          const creditPoints = credit * normalizedGradePoints;

                          return (
                            <tr key={grade.id}>
                              <td>{course?.title || "—"}</td>
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

                      {/* Semester Average */}
                      <tr>
                        <td style={{ fontWeight: "bold" }} colSpan={3}>
                          የሴሚስተር GPA
                        </td>
                        <td className="center" style={{ fontWeight: "bold" }}>
                          {semesterGPA}
                        </td>
                      </tr>
                      {/* Cumulative GPA */}
                      <tr>
                        <td style={{ fontWeight: "bold" }} colSpan={3}>
                          የአጠቃላይ GPA
                        </td>
                        <td className="center" style={{ fontWeight: "bold" }}>
                          {cumulativeGPAForSemester.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      ))}}

      {/* ================= FINAL SUMMARY ================= */}
      <table style={{ marginTop: "6mm" }}>
        <tbody>
          <tr>
            <td>
              <strong>ጠቅላላ አማካይ</strong>
            </td>
            <td>
              {(gpaStats.cumulativeGpa).toFixed(2)}
            </td>
            <td>
              <strong>ውጤት</strong>
            </td>
            <td>{resultStatus}</td>
          </tr>
        </tbody>
      </table>

      {/* ================= SIGNATURES ================= */}
      <table className="no-border" style={{ marginTop: "12mm" }}>
        <tbody>
          <tr>
            <td>አዘጋጅ፡ ____________________</td>
            <td className="right">ያፀደቀው፡ ____________________</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "6mm" }}>
              ቀን፡ {new Date().toLocaleDateString("am-ET")}
            </td>
            <td className="right" style={{ paddingTop: "6mm" }}>
              ማህተም፡ ____________________
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TranscriptView;

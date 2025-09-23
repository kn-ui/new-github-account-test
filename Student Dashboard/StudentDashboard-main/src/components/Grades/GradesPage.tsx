import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Award } from 'lucide-react';

const GradesPage: React.FC = () => {
  const [expandedYears, setExpandedYears] = useState<{ [key: string]: boolean }>({
    '2025': true,
  });

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const years = [
    {
      year: '2025',
      semesters: [
        {
          name: 'Winter - 2025',
          courses: [
            { title: 'Liturgical Studies', creditHours: 2, grade: '', points: 0 },
            { title: 'Church History', creditHours: 2, grade: '', points: 0 },
            { title: 'Christian Ethics', creditHours: 4, grade: '', points: 0 },
            { title: 'Pastoral Care & Counseling', creditHours: 4, grade: '', points: 0 },
          ],
          totalCredits: 12,
          totalPoints: 0,
          gpa: 0.00
        },
        {
          name: 'Spring - 2025',
          courses: [
            { title: 'Pastoral Care & Counseling', creditHours: 4, grade: '', points: 0 },
          ],
          totalCredits: 4,
          totalPoints: 0,
          gpa: 0.00
        }
      ]
    },
    { year: '2024', semesters: [] },
    { year: '2023', semesters: [] },
    { year: '2022', semesters: [] },
    { year: '2021', semesters: [] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
      </div>

      {/* Grade Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Current Grade</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">B+</p>
        </div>
        
        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">Assignments</span>
          </div>
          <p className="text-3xl font-bold text-green-900">87%</p>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Participation</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">92%</p>
        </div>
      </div>

      {/* Grades by Year */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {years.map((yearData) => (
            <div key={yearData.year} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleYear(yearData.year)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedYears[yearData.year] ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-900">{yearData.year}</span>
                </div>
              </button>

              {expandedYears[yearData.year] && yearData.semesters.length > 0 && (
                <div className="pl-8 pb-4 space-y-6">
                  {yearData.semesters.map((semester, semesterIndex) => (
                    <div key={semesterIndex} className="border-l-4 border-blue-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{semester.name}</h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Course Title</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-700">Credit Hours</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-700">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semester.courses.map((course, courseIndex) => (
                              <tr key={courseIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-800">{course.title}</td>
                                <td className="py-3 px-4 text-center text-gray-600">{course.creditHours}</td>
                                <td className="py-3 px-4 text-center text-gray-600">{course.grade || '-'}</td>
                                <td className="py-3 px-4 text-center text-gray-600">{course.points}</td>
                              </tr>
                            ))}
                            <tr className="border-b-2 border-gray-300 font-semibold">
                              <td className="py-3 px-4 text-gray-800">Total</td>
                              <td className="py-3 px-4 text-center text-gray-800">{semester.totalCredits}</td>
                              <td className="py-3 px-4 text-center text-gray-800">-</td>
                              <td className="py-3 px-4 text-center text-gray-800">{semester.totalPoints}</td>
                            </tr>
                            <tr className="font-semibold">
                              <td className="py-3 px-4 text-gray-800">GPA</td>
                              <td className="py-3 px-4 text-center text-gray-800">-</td>
                              <td className="py-3 px-4 text-center text-gray-800">-</td>
                              <td className="py-3 px-4 text-center text-gray-800">{semester.gpa.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expandedYears[yearData.year] && yearData.semesters.length === 0 && (
                <div className="pl-8 pb-4">
                  <p className="text-gray-500 italic">No grades available for this year</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
import React, { useState } from 'react';
import { ArrowLeft, Award, Trophy } from 'lucide-react';

interface CourseDetailProps {
  onBack: () => void;
  courseTitle?: string;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ onBack, courseTitle = 'Systematic Theology' }) => {
  const [activeTab, setActiveTab] = useState('Grades');

  const tabs = ['Lessons', 'Assignments', 'Resources', 'Grades'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{courseTitle}</h1>
          <p className="text-gray-600">Instructor: Dr. Smith</p>
        </div>
      </div>

      {/* Course Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Course Progress</h2>
          <span className="text-2xl font-bold text-blue-600">75%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>9 of 12 lessons completed</span>
          <span>3 assignments remaining</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'Grades' && (
            <div className="space-y-6">
              {/* Grade Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Trophy size={20} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-800">Current Grade</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">B+</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Trophy size={20} className="text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-800">Assignments</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900">87%</p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Trophy size={20} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-purple-800">Participation</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">92%</p>
                </div>
              </div>

              {/* Grade Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Grade Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Assignments (40%)</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">87% (A-)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Exams (40%)</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">84% (B)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Participation (20%)</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">92% (A)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-blue-200">
                    <span className="font-semibold text-gray-900">Final Grade</span>
                    <span className="text-xl font-bold text-blue-600">86% (B+)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Lessons' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Course Lessons</h3>
              <p className="text-gray-600">Lesson content will be displayed here.</p>
            </div>
          )}

          {activeTab === 'Assignments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Course Assignments</h3>
              <p className="text-gray-600">Assignment list will be displayed here.</p>
            </div>
          )}

          {activeTab === 'Resources' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Course Resources</h3>
              <p className="text-gray-600">Resource materials will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
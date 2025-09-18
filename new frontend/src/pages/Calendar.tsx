import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon } from 'lucide-react';

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('August 2025');
  const [selectedFilter, setSelectedFilter] = useState('All Events');

  const filters = ['All Events', 'Academic', 'Religious', 'Student Life', 'Holidays'];

  const academicYearInfo = {
    fallSemester: 'Sep 1 - Dec 15',
    winterBreak: 'Dec 16 - Jan 15',
    springSemester: 'Jan 16 - May 30',
    summerBreak: 'May 31 - Aug 31'
  };

  const importantNotices = [
    {
      type: 'warning',
      title: 'Registration Reminder:',
      description: 'Spring semester registration closes January 15th.',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    {
      type: 'info',
      title: 'New Student Orientation:',
      description: 'All new students must attend the February 5th orientation.',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      type: 'success',
      title: 'Scholarship Applications:',
      description: 'Due March 1st for the next academic year.',
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  ];

  const orthodoxCalendar = [
    { event: 'Timkat (Epiphany):', date: 'Jan 19' },
    { event: 'Fasika (Easter):', date: 'May 5' },
    { event: 'Meskel (Finding of Cross):', date: 'Sep 27' },
    { event: 'Genna (Christmas):', date: 'Jan 7' }
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    // Month navigation logic would go here
  };

  return (
    <div>
      {/* Hero Section */}
     
      

      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        {/* Background Image */}
        <img
          src="../../asset/background-img.png"
          alt="background"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        {/* Overlay for gradient and content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Calendar</h1>
            <p className="text-xl mb-8">
              Stay Informed About Important Dates and Events
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section (smaller) */}
          <div className="lg:col-span-2">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">{currentMonth}</h2>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedFilter === filter
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Calendar Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No Events This Month</h3>
              <p className="text-gray-500 text-sm">No events match your current filter for this month.</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Academic Year Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Year 2023-2024</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fall Semester:</span>
                  <span className="font-medium">{academicYearInfo.fallSemester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Winter Break:</span>
                  <span className="font-medium">{academicYearInfo.winterBreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spring Semester:</span>
                  <span className="font-medium">{academicYearInfo.springSemester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Summer Break:</span>
                  <span className="font-medium">{academicYearInfo.summerBreak}</span>
                </div>
              </div>
            </div>

            {/* Important Notices */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Notices</h3>
              <div className="space-y-4">
                {importantNotices.map((notice, index) => (
                  <div key={index} className={`p-3 rounded-md border ${notice.color}`}>
                    <div className="font-medium">{notice.title}</div>
                    <div className="text-sm mt-1">{notice.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Holidays (styled like Events list) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
              <div className="space-y-4">
                {orthodoxCalendar.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{item.event}</div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules & Regulations quick box */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules & Regulations</h3>
              <p className="text-sm text-gray-600 mb-4">Review our community standards and academic policies.</p>
              <a href="/rules" className="inline-block text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">View Rules</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
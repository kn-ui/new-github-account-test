import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, MapPin } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const eventTypes = [
    { value: 'all', label: 'All Events', color: 'gray' },
    { value: 'academic', label: 'Academic', color: 'blue' },
    { value: 'religious', label: 'Religious', color: 'purple' },
    { value: 'social', label: 'Social', color: 'green' },
    { value: 'examination', label: 'Examinations', color: 'red' },
    { value: 'holiday', label: 'Holidays', color: 'yellow' }
  ];

  const events = [
    {
      id: 1,
      title: 'Fall Semester Begins',
      date: '2025-01-20',
      time: '08:00',
      type: 'academic',
      location: 'Main Campus',
      description: 'First day of classes for the fall semester'
    },
    {
      id: 2,
      title: 'Timkat Celebration',
      date: '2025-01-19',
      time: '06:00',
      type: 'religious',
      location: 'Church Grounds',
      description: 'Ethiopian Orthodox celebration of Epiphany'
    },
    {
      id: 3,
      title: 'New Student Orientation',
      date: '2025-01-18',
      time: '09:00',
      type: 'academic',
      location: 'Assembly Hall',
      description: 'Welcome and orientation for new students'
    },
    {
      id: 4,
      title: 'Mid-term Examinations',
      date: '2025-02-15',
      time: '09:00',
      type: 'examination',
      location: 'Examination Halls',
      description: 'Mid-semester examinations for all courses'
    },
    {
      id: 5,
      title: 'Community Service Day',
      date: '2025-02-28',
      time: '08:00',
      type: 'social',
      location: 'Various Locations',
      description: 'Students participate in community outreach programs'
    },
    {
      id: 6,
      title: 'Spring Break',
      date: '2025-03-15',
      time: '00:00',
      type: 'holiday',
      location: 'N/A',
      description: 'One week spring break for all students'
    },
    {
      id: 7,
      title: 'Guest Lecture Series',
      date: '2025-03-20',
      time: '14:00',
      type: 'academic',
      location: 'Main Auditorium',
      description: 'Special lecture by visiting theologian'
    },
    {
      id: 8,
      title: 'Easter Celebration',
      date: '2025-04-20',
      time: '06:00',
      type: 'religious',
      location: 'Church Grounds',
      description: 'Ethiopian Orthodox Easter celebration'
    }
  ];

  const getEventColor = (type: string) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-800 border-blue-200',
      religious: 'bg-purple-100 text-purple-800 border-purple-200',
      social: 'bg-green-100 text-green-800 border-green-200',
      examination: 'bg-red-100 text-red-800 border-red-200',
      holiday: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(event => event.type === selectedFilter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (timeString === '00:00') return 'All Day';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(event => event.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Academic Calendar</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Stay updated with important dates, events, and academic schedules
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'month' ? (
          /* Month View */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => (
                  <div key={index} className="min-h-[120px] p-2 border border-gray-200 rounded">
                    {day && (
                      <>
                        <div className="font-semibold text-gray-900 mb-2">{day}</div>
                        <div className="space-y-1">
                          {getEventsForDay(day).slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${getEventColor(event.type)}`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {getEventsForDay(day).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{getEventsForDay(day).length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                <p className="text-gray-600">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                            {eventTypes.find(t => t.value === event.type)?.label}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{event.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                          {event.location !== 'N/A' && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
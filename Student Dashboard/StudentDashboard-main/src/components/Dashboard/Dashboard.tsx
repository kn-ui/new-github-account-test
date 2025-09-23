import React from 'react';
import { BookOpen, FileText, Trophy, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import CourseCard from './CourseCard';
import DeadlineItem from './DeadlineItem';
import NotificationItem from './NotificationItem';

interface DashboardProps {
  onAssignmentClick?: () => void;
  onCourseClick?: (courseTitle?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onAssignmentClick, onCourseClick }) => {
  const courses = [
    { title: 'Christian Ethics', instructor: 'Dr. Smith', progress: 75 },
    { title: 'Systematic Theology', instructor: 'Prof. Johnson', progress: 60 },
    { title: 'Church History', instructor: 'Dr. Williams', progress: 90 },
    { title: 'Liturgical Studies', instructor: 'Ms. Davis', progress: 45 },
  ];

  const upcomingDeadlines = [
    { title: 'Assignment 3', course: 'Systematic Theology', date: '2025-01-20', type: 'assignment' as const },
    { title: 'Report Ass. 1', course: 'Church History', date: '2025-01-22', type: 'assignment' as const },
    { title: 'Final Exam', course: 'Christian Ethics', date: '2025-01-25', type: 'exam' as const },
  ];

  const recentNotifications = [
    { title: 'New assignment posted in Liturgical Studies', time: '2 hours ago', read: false },
    { title: 'Grade released for Pastoral Care & Counseling', time: '1 day ago', read: false },
    { title: 'Reminder: Church History exam next week', time: '2 days ago', read: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back! Today is {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={BookOpen}
          title="Enrolled Courses"
          value="4"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          icon={FileText}
          title="Pending Assignments"
          value="3"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          icon={Trophy}
          title="Overall GPA"
          value="3.7"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatsCard
          icon={Clock}
          title="Study Hours"
          value="127"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course, index) => (
                <CourseCard
                  key={index}
                  title={course.title}
                  instructor={course.instructor}
                  progress={course.progress}
                  onClick={() => onCourseClick?.(course.title)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Deadlines</h2>
            <div className="space-y-2">
              {upcomingDeadlines.map((deadline, index) => (
                <DeadlineItem
                  key={index}
                  title={deadline.title}
                  course={deadline.course}
                  date={deadline.date}
                  type={deadline.type}
                  onClick={onAssignmentClick}
                />
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Notifications</h2>
            <div className="space-y-2">
              {recentNotifications.map((notification, index) => (
                <NotificationItem
                  key={index}
                  title={notification.title}
                  time={notification.time}
                  read={notification.read}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
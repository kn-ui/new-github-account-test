import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Calendar,
  Bell,
  Award,
  Home,
  Menu,
  X,
  LogOut,
  User,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  TrendingUp
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'teacher' | 'student';
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigationItems: NavigationItem[] = (() => {
    const baseItems = [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...baseItems,
          { label: 'User Management', href: '/dashboard/users', icon: Users },
          { label: 'Course Management', href: '/dashboard/courses', icon: BookOpen },
          { label: 'Events', href: '/dashboard/events', icon: Calendar },
          { label: 'Support Tickets', href: '/dashboard/support-tickets', icon: MessageSquare },
          { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
          { label: 'System Settings', href: '/dashboard/settings', icon: Settings },
        ];
      
      case 'teacher':
        return [
          ...baseItems,

          { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
          { label: 'Students', href: '/dashboard/students', icon: Users },
          { label: 'Assignments', href: '/dashboard/assignments', icon: FileText },
          { label: 'Submissions', href: '/dashboard/submissions', icon: ClipboardList },
          { label: 'Announcements', href: '/dashboard/announcements', icon: Bell },
          { label: 'Course Materials', href: '/dashboard/materials', icon: FolderOpen },
          { label: 'Reports', href: '/dashboard/teacher-reports', icon: BarChart3 },
        ];
      
      case 'student':
        return [
          ...baseItems,

          { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
          { label: 'Assignments', href: '/dashboard/student-assignments', icon: FileText },
          { label: 'Submissions', href: '/dashboard/student-submissions', icon: ClipboardList },
          { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
          { label: 'Announcements', href: '/dashboard/student-announcements', icon: Bell },
          { label: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
        ];
      
      default:
        return baseItems;
    }
  })();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:inset-0 dashboard-sidebar
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LMS</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="nav-content px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActiveRoute(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {userRole}
                </p>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 dashboard-main">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </Link>

              <Link to="/courses" className="text-sm text-gray-600 hover:text-gray-900">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="dashboard-page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
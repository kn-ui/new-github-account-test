import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PasswordChangeDialog } from '@/components/PasswordChangeDialog';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Calendar,
  Bell,
  Search,
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { announcementService, FirestoreAnnouncement } from '@/lib/firestore';
import { useI18n } from '@/contexts/I18nContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'teacher' | 'student' | 'super_admin';
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

import logo from '/assets/logo.jpg';

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser, userProfile } = useAuth();
  const { lang, setLang, t } = useI18n();

  // Local storage helpers for per-user seen announcement IDs
  const seenStorageKey = React.useMemo(() => (
    currentUser?.uid ? `seen_announcements_${currentUser.uid}` : undefined
  ), [currentUser?.uid]);

  const getSeenAnnouncementIds = React.useCallback((): Set<string> => {
    if (!seenStorageKey) return new Set<string>();
    try {
      const raw = localStorage.getItem(seenStorageKey);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      return new Set<string>(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set<string>();
    }
  }, [seenStorageKey]);

  const saveSeenAnnouncementIds = React.useCallback((ids: Set<string>) => {
    if (!seenStorageKey) return;
    try {
      localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore storage errors
    }
  }, [seenStorageKey]);

  const navigationItems: NavigationItem[] = (() => {
    const baseItems = [
      { label: t('nav.dashboard'), href: '/dashboard', icon: Home },
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...baseItems,
          { label: t('nav.userManagement'), href: '/dashboard/users', icon: Users },
          { label: t('nav.courseManagement'), href: '/dashboard/courses', icon: BookOpen },
          { label: t('nav.attendance'), href: '/dashboard/admin-attendance', icon: ClipboardList },
          { label: t('nav.grades'), href: '/dashboard/admin-grades', icon: Award },
          { label: t('nav.events'), href: '/dashboard/events', icon: Calendar },
          { label: t('nav.reports'), href: '/dashboard/reports', icon: BarChart3 },
          { label: t('nav.announcements'), href: '/dashboard/admin-announcements', icon: Bell },
          { label: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
        ];
      case 'super_admin':
        return [
          ...baseItems,
          { label: t('nav.userManagement'), href: '/dashboard/users', icon: Users },
          { label: t('nav.courseManagement'), href: '/dashboard/courses', icon: BookOpen },
          { label: t('nav.manageAdmins'), href: '/dashboard/manage-admins', icon: Users },
          { label: t('nav.events'), href: '/dashboard/events', icon: Calendar },
          { label: t('nav.reports'), href: '/dashboard/reports', icon: BarChart3 },
        ];
      case 'teacher':
        return [
          ...baseItems,
          { label: t('nav.myCourses'), href: '/dashboard/my-courses', icon: BookOpen },
          { label: t('nav.students'), href: '/dashboard/students', icon: Users },
          { label: t('nav.assignments'), href: '/dashboard/assignments', icon: FileText },
          { label: t('nav.submissions'), href: '/dashboard/submissions', icon: ClipboardList },
          { label: t('nav.grades'), href: '/dashboard/teacher-grades', icon: Award },
          { label: t('nav.attendance'), href: '/dashboard/attendance', icon: ClipboardList },
          { label: t('nav.analytics'), href: '/dashboard/teacher-analytics', icon: BarChart3 },
          { label: t('nav.announcements'), href: '/dashboard/announcements', icon: Bell },
          { label: t('nav.materials'), href: '/dashboard/materials', icon: FolderOpen },
        ];
      
      case 'student':
        return [
          ...baseItems,
          { label: t('nav.myCourses'), href: '/dashboard/student-courses', icon: BookOpen },
          { label: t('nav.assignments'), href: '/dashboard/student-assignments', icon: FileText },
          { label: t('nav.submissions'), href: '/dashboard/student-submissions', icon: ClipboardList },
          { label: t('nav.exams'), href: '/dashboard/student-exams', icon: ClipboardList },
          { label: t('nav.myGrades'), href: '/dashboard/student-grades', icon: Award },
          { label: t('nav.announcements'), href: '/dashboard/student-announcements', icon: Bell },
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

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        // Get all announcements (increased limit to show more)
        const all = await announcementService.getAllAnnouncements(100);
        
        if (userRole === 'teacher') {
          // Teachers see: SPECIFIC_USER (if recipientUserId === teacher's id and authorRole "admin"), 
          // ALL_TEACHERS, GENERAL_ALL (if authorRole "admin")
          const filtered = all.filter((a: any) => {
            const targetAudience = a.targetAudience;
            const recipientUserId = a.recipientUserId;
            const authorRole = a.authorRole;
            
            // Direct message from admin to this teacher
            if (targetAudience === 'SPECIFIC_USER' && recipientUserId === currentUser?.uid && authorRole === 'admin') {
              return true;
            }
            
            // All teachers announcements
            if (targetAudience === 'ALL_TEACHERS') {
              return true;
            }
            
            // General announcements from admin
            if (targetAudience === 'GENERAL_ALL' && authorRole === 'admin') {
              return true;
            }
            
            return false;
          });
          setAnnouncements(filtered);
        } else if (userRole === 'student') {
          // Students see: COURSE_STUDENTS (if enrolled in that course), SPECIFIC_STUDENT (if recipientStudentId matches), ALL_STUDENTS, GENERAL_ALL (if authorRole is admin)
          if (currentUser?.uid) {
            // Get student's enrolled courses
            const { enrollmentService } = await import('@/lib/firestore');
            const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
            const enrolledCourseIds = enrollments.map((e: any) => e.courseId);
            
            const filtered = all.filter((a: any) => {
              const targetAudience = a.targetAudience;
              const recipientStudentId = a.recipientStudentId;
              const courseId = a.courseId;
              const authorRole = a.authorRole;
              
              // Direct message to this student
              if (targetAudience === 'SPECIFIC_STUDENT' && recipientStudentId === currentUser.uid) {
                return true;
              }
              
              // Course-specific announcements (if student is enrolled)
              if (targetAudience === 'COURSE_STUDENTS' && courseId && enrolledCourseIds.includes(courseId)) {
                return true;
              }
              
              // All students announcements
              if (targetAudience === 'ALL_STUDENTS') {
                return true;
              }
              
              // General announcements from admin
              if (targetAudience === 'GENERAL_ALL' && authorRole === 'admin') {
                return true;
              }
              
              return false;
            });
            setAnnouncements(filtered);
          } else {
            setAnnouncements([]);
          }
        } else if (userRole === 'admin') {
          // Admins see: SPECIFIC_USER (if recipientUserId === admin's id and authorRole "admin"), 
          // GENERAL_ALL (if authorRole "admin")
          const filtered = all.filter((a: any) => {
            const targetAudience = a.targetAudience;
            const recipientUserId = a.recipientUserId;
            const authorRole = a.authorRole;
            
            // Direct message from admin to this admin
            if (targetAudience === 'SPECIFIC_USER' && recipientUserId === currentUser?.uid && authorRole === 'admin') {
              return true;
            }
            
            // General announcements from admin
            if (targetAudience === 'GENERAL_ALL' && authorRole === 'admin') {
              return true;
            }
            
            return false;
          });
          setAnnouncements(filtered);
        } else if (userRole === 'super_admin') {
          // Super Admins see: SPECIFIC_USER (if recipientUserId === superAdmin's id and authorRole "admin"), 
          // GENERAL_ALL (if authorRole "admin")
          const filtered = all.filter((a: any) => {
            const targetAudience = a.targetAudience;
            const recipientUserId = a.recipientUserId;
            const authorRole = a.authorRole;
            
            // Direct message from admin to this super admin
            if (targetAudience === 'SPECIFIC_USER' && recipientUserId === currentUser?.uid && authorRole === 'admin') {
              return true;
            }
            
            // General announcements from admin
            if (targetAudience === 'GENERAL_ALL' && authorRole === 'admin') {
              return true;
            }
            
            return false;
          });
          setAnnouncements(filtered);
        } else {
          setAnnouncements(await announcementService.getAllAnnouncements(100));
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
        setAnnouncements([]);
      }
    };
    loadAnnouncements();
  }, [userRole, currentUser]);

  // Recompute unread count whenever announcements list or user changes
  useEffect(() => {
    const seen = getSeenAnnouncementIds();
    // Clean up any stale IDs not in current list (optional)
    const currentIds = new Set(announcements.map(a => a.id));
    const cleaned = new Set<string>();
    seen.forEach(id => { if (currentIds.has(id)) cleaned.add(id); });
    if (cleaned.size !== seen.size) saveSeenAnnouncementIds(cleaned);
    const unread = announcements.reduce((acc, a) => acc + (cleaned.has(a.id) ? 0 : 1), 0);
    setUnreadAnnouncementsCount(unread);
  }, [announcements, getSeenAnnouncementIds, saveSeenAnnouncementIds]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/dashboard/search?q=${encodeURIComponent(q)}`);
  };

  const toggleAnnouncementExpansion = (announcementId: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
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
            <Link to="/" className="flex items-center space-x-2 cursor-pointer">
              <img src={logo} alt="St. Raguel Church Logo" className="h-16 w-auto" />
            </Link>
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
                {userProfile && userProfile.role === 'admin' && userProfile.schoolTitle && (
                  <p className="text-sm font-semibold text-blue-700 truncate mt-1">
                    {userProfile.schoolTitle}
                  </p>
                )}

              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.logout')}
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
            
            <div className="flex items-center space-x-4 flex-1 justify-center">
              {/* Search Bar */}
              <form className="relative max-w-md w-full" onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    userRole === 'student' 
                      ? 'Search courses, events...' 
                      : userRole === 'teacher' 
                        ? 'Search courses, students...' 
                        : 'Search users, courses, events...'
                  }
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications - announcements only */}
              <DropdownMenu onOpenChange={(open) => {
                setIsNotificationsOpen(open);
                if (open) {
                  const seen = getSeenAnnouncementIds();
                  announcements.forEach(a => seen.add(a.id));
                  saveSeenAnnouncementIds(seen);
                  setUnreadAnnouncementsCount(0);
                }
              }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadAnnouncementsCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadAnnouncementsCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{t('notifications.announcements')}</span>
                    <span className="text-xs text-gray-500 font-normal">({announcements.length})</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {announcements.length === 0 && (
                    <div className="p-3 text-sm text-gray-600 text-center">{t('notifications.none')}</div>
                  )}
                  {announcements.map((a) => {
                    const isExpanded = expandedAnnouncements.has(a.id);
                    const isLongText = a.body.length > 150;
                    return (
                      <DropdownMenuItem key={a.id} className="block whitespace-normal p-3 hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100">
                        <div className="w-full">
                          <div className="font-medium text-sm mb-1 truncate text-gray-900 hover:text-gray-900" title={a.title}>{a.title}</div>
                          <div className="text-xs text-gray-600 hover:text-gray-600 break-words overflow-hidden">
                            {isExpanded ? a.body : (isLongText ? `${a.body.substring(0, 150)}...` : a.body)}
                          </div>
                          {(a as any).externalLink && (
                            <div className="mt-2">
                              <a 
                                href={(a as any).externalLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                🔗 External Link
                              </a>
                            </div>
                          )}
                          {isLongText && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAnnouncementExpansion(a.id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                            >
                              {isExpanded ? 'Show Less' : 'Expand'}
                            </button>
                          )}
                          <div className="text-xs text-gray-400 hover:text-gray-400 mt-1 flex items-center justify-between">
                            <span>{a.createdAt.toDate().toLocaleDateString()}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {a.targetAudience === 'SPECIFIC_STUDENT' ? 'Direct' : 
                               a.targetAudience === 'COURSE_STUDENTS' ? 'Course' :
                               a.targetAudience === 'ALL_STUDENTS' ? 'All Students' :
                               a.targetAudience === 'ALL_TEACHERS' ? 'All Teachers' :
                               a.targetAudience === 'GENERAL_ALL' ? 'General' :
                               a.targetAudience === 'SPECIFIC_USER' ? 'Direct' : 'General'}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  {announcements.length > 0 && userRole === 'student' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-center text-blue-600 hover:text-blue-800 hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100"
                        onClick={() => navigate('/dashboard/student-announcements')}
                      >
                        View All Announcements
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Language Switcher */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
                aria-label={t('language.label')}
              >
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
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
      
      {/* Password Change Dialog */}
      <PasswordChangeDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
      />
    </div>
  );
}
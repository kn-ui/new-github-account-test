import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  BookOpen, 
  Calendar,
  Users,
  MessageSquare,
  Pin,
  Star,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { announcementService, enrollmentService, courseService, FirestoreAnnouncement } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
  import DashboardHero from '@/components/DashboardHero';

interface AnnouncementWithDetails extends FirestoreAnnouncement {
  course?: any;
  isRead?: boolean;
}

export default function StudentAnnouncements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'course' | 'general'>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [currentUser?.uid]);

  const loadAnnouncements = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
      const courseIds = enrollments.map((e: any) => e.courseId);
      
      // Get course details for enrolled courses
      const courses = await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            return await courseService.getCourseById(courseId);
          } catch (error) {
            console.warn(`Failed to load course ${courseId}:`, error);
            return null;
          }
        })
      );
      
      const validCourses = courses.filter(Boolean);
      setEnrolledCourses(validCourses);
      
      // Get all announcements (course-specific and general)
      const allAnnouncements = await announcementService.getAllAnnouncements();
      
      // Filter announcements for enrolled courses and general ones
      const relevantAnnouncements = allAnnouncements.filter((announcement: any) => {
        // Include general announcements
        if (!announcement.courseId) return true;
        
        // Include course-specific announcements for enrolled courses
        return courseIds.includes(announcement.courseId);
      });
      
      // Enrich announcements with course details
      const announcementsWithDetails = relevantAnnouncements.map((announcement: any) => {
        const course = announcement.courseId 
          ? validCourses.find(c => c?.id === announcement.courseId)
          : null;
        
        return {
          ...announcement,
          course,
          isRead: false // In a real app, this would track read status
        };
      });
      
      // Sort by creation date (newest first) and importance
      announcementsWithDetails.sort((a, b) => {
        // Important announcements first
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        
        // Then by date
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAnnouncements(announcementsWithDetails);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = selectedCourse === 'all' || announcement.courseId === selectedCourse;
      
      const matchesType = selectedType === 'all' || 
        (selectedType === 'course' && announcement.courseId) ||
        (selectedType === 'general' && !announcement.courseId);
      
      const matchesReadStatus = !showUnreadOnly || !announcement.isRead;
      
      return matchesSearch && matchesCourse && matchesType && matchesReadStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          const dateAOld = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateBOld = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateAOld.getTime() - dateBOld.getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'course':
          const aCourse = a.course?.title || 'General';
          const bCourse = b.course?.title || 'General';
          return aCourse.localeCompare(bCourse);
        case 'important':
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          const dateAImp = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateBImp = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateBImp.getTime() - dateAImp.getTime();
        default:
          return 0;
      }
    });

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      const now = new Date();
      const diffTime = now.getTime() - d.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return d.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getAnnouncementIcon = (announcement: AnnouncementWithDetails) => {
    if (announcement.isImportant) return <Star className="h-5 w-5 text-yellow-500" />;
    if (announcement.courseId) return <BookOpen className="h-5 w-5 text-blue-500" />;
    return <Bell className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading announcements...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Announcements"
        subtitle="Stay updated with course announcements and important information"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {enrolledCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="course">Course-specific</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="important">Important First</SelectItem>
                  <SelectItem value="title-asc">Title A→Z</SelectItem>
                  <SelectItem value="title-desc">Title Z→A</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show unread only</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredAndSortedAnnouncements.length} announcement{filteredAndSortedAnnouncements.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAndSortedAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600 mb-4">
                {announcements.length === 0 
                  ? 'No announcements available yet'
                  : 'No announcements match your current filters'
                }
              </p>
              {announcements.length === 0 && (
                <Button onClick={() => navigate('/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedAnnouncements.map((announcement) => (
              <div 
                key={announcement.id} 
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  announcement.isImportant ? 'border-l-4 border-l-yellow-500 bg-yellow-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getAnnouncementIcon(announcement)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                        {announcement.isImportant && (
                          <Badge variant="default" className="bg-yellow-600">
                            <Pin className="h-3 w-3 mr-1" />
                            Important
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {announcement.courseId ? 'Course-specific' : 'General'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {formatDate(announcement.createdAt)}
                      </div>
                    </div>
                    
                    <div className="prose prose-sm text-gray-600 mb-4">
                      <p className="whitespace-pre-wrap">{announcement.body}</p>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      {announcement.courseId && (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{announcement.course?.title || 'Unknown Course'}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>All students</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>Announcement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard/student-assignments')}>
                <BookOpen className="h-4 w-4 mr-2" />
                View Assignments
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/student-progress')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Progress
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
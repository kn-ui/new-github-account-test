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
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { studentDataService, FirestoreAnnouncement } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

interface AnnouncementWithDetails extends FirestoreAnnouncement {
  course?: any;
  isRead?: boolean;
  isImportant?: boolean;
}

export default function StudentAnnouncements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'course' | 'general'>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithDetails | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (selectedAnnouncement && !selectedAnnouncement.isRead) {
      const updatedAnnouncements = announcements.map(ann =>
        ann.id === selectedAnnouncement.id ? { ...ann, isRead: true } : ann
      );
      setAnnouncements(updatedAnnouncements);
    }
  }, [selectedAnnouncement]);

  const loadAnnouncements = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      
      // Get all announcements and filter based on student targeting rules
      const { announcementService, enrollmentService } = await import('@/lib/firestore');
      const all = await announcementService.getAllAnnouncements(50);
      
      // Get student's enrolled courses
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
      const enrolledCourseIds = enrollments.map((e: any) => e.courseId);
      
      // Filter announcements based on student targeting rules
      const filtered = all.filter((a: any) => {
        const targetAudience = a.targetAudience;
        const recipientStudentId = a.recipientStudentId;
        const courseId = a.courseId;
        
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
        if (targetAudience === 'GENERAL_ALL' && a.authorRole === 'admin') {
          return true;
        }
        
        return false;
      });
      
      // Set enrolled courses for filtering
      const validCourses = enrollments
        .filter(e => e.course)
        .map(e => e.course);
      setEnrolledCourses(validCourses);

      // Process announcements with course details
      const withDetails = filtered.map((a: any) => ({
        ...a,
        course: a.courseId ? validCourses.find((c: any) => c?.id === a.courseId) : null,
        isRead: false,
      }));
      
      withDetails.sort((a: any, b: any) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      setAnnouncements(withDetails);
      toast.success(t('student.announcements.loadSuccess') || 'Announcements loaded successfully');
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast.error(t('student.announcements.loadError') || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (announcement.course?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('student.announcements.title')}</h1>
        </div>

        {/* Announcements List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcement List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="space-y-2">
                {filteredAndSortedAnnouncements.map((announcement) => (
                  <button
                    key={announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                      selectedAnnouncement?.id === announcement.id
                        ? 'bg-blue-100 border border-blue-300'
                        : !announcement.isRead 
                        ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      !announcement.isRead ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Bell size={18} className={!announcement.isRead ? 'text-blue-600' : 'text-gray-400'} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        !announcement.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`} title={announcement.title}>
                        {announcement.title}
                      </p>
                      <p className="text-sm text-gray-500">{announcement.createdAt.toDate().toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              {selectedAnnouncement ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedAnnouncement.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {selectedAnnouncement.createdAt.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {selectedAnnouncement.courseId ? 'Course Specific' : 'General'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                      {selectedAnnouncement.body}
                    </p>
                  </div>

                  {(selectedAnnouncement as any).externalLink && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">External Link:</p>
                      <a 
                        href={(selectedAnnouncement as any).externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {(selectedAnnouncement as any).externalLink}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Select an announcement to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
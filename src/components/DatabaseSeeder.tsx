import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  doc, 
  setDoc, 
  Timestamp,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Test data for all collections
const testData = {
  users: [
    {
      id: 'admin-001',
      displayName: 'Admin User',
      email: 'admin@straguel.edu',
      role: 'admin',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'teacher-001',
      displayName: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@straguel.edu',
      role: 'teacher',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'teacher-002',
      displayName: 'Rev. Michael Thompson',
      email: 'michael.thompson@straguel.edu',
      role: 'teacher',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'teacher-003',
      displayName: 'Prof. David Chen',
      email: 'david.chen@straguel.edu',
      role: 'teacher',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'student-001',
      displayName: 'John Smith',
      email: 'john.smith@student.straguel.edu',
      role: 'student',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'student-002',
      displayName: 'Mary Johnson',
      email: 'mary.johnson@student.straguel.edu',
      role: 'student',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'student-003',
      displayName: 'David Wilson',
      email: 'david.wilson@student.straguel.edu',
      role: 'student',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'student-004',
      displayName: 'Lisa Chen',
      email: 'lisa.chen@student.straguel.edu',
      role: 'student',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'student-005',
      displayName: 'Robert Brown',
      email: 'robert.brown@student.straguel.edu',
      role: 'student',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ],

  courses: [
    {
      id: 'course-001',
      title: 'Introduction to Biblical Studies',
      description: 'A comprehensive foundation course covering the essential principles of biblical interpretation and study.',
      category: 'Theology',
      duration: 8,
      maxStudents: 30,
      syllabus: 'Week 1: Introduction to the Bible\nWeek 2: Old Testament Overview\nWeek 3: New Testament Overview\nWeek 4: Biblical Interpretation Methods\nWeek 5: Historical Context\nWeek 6: Literary Analysis\nWeek 7: Theological Themes\nWeek 8: Application and Reflection',
      isActive: true,
      instructor: 'teacher-001',
      instructorName: 'Dr. Sarah Wilson',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'course-002',
      title: 'Christian Ethics and Moral Theology',
      description: 'Explore the foundations of Christian ethics and their application in modern life and decision-making.',
      category: 'Ethics',
      duration: 10,
      maxStudents: 25,
      syllabus: 'Week 1: Foundations of Christian Ethics\nWeek 2: Biblical Ethics\nWeek 3: Natural Law Theory\nWeek 4: Virtue Ethics\nWeek 5: Social Justice\nWeek 6: Bioethics\nWeek 7: Environmental Ethics\nWeek 8: Business Ethics\nWeek 9: Family Ethics\nWeek 10: Contemporary Challenges',
      isActive: true,
      instructor: 'teacher-002',
      instructorName: 'Rev. Michael Thompson',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'course-003',
      title: 'Church History and Traditions',
      description: 'Journey through 2000 years of church history, from the apostolic age to contemporary Christianity.',
      category: 'History',
      duration: 12,
      maxStudents: 35,
      syllabus: 'Week 1: Apostolic Age\nWeek 2: Early Church Fathers\nWeek 3: Councils and Creeds\nWeek 4: Medieval Period\nWeek 5: Reformation Era\nWeek 6: Modern Period\nWeek 7: Denominational Development\nWeek 8: Missionary Movements\nWeek 9: Ecumenical Efforts\nWeek 10: Contemporary Issues\nWeek 11: Global Christianity\nWeek 12: Future of the Church',
      isActive: true,
      instructor: 'teacher-003',
      instructorName: 'Prof. David Chen',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'course-004',
      title: 'Systematic Theology',
      description: 'Comprehensive study of Christian doctrine and theological systems.',
      category: 'Theology',
      duration: 16,
      maxStudents: 20,
      syllabus: 'Week 1: Introduction to Theology\nWeek 2: Doctrine of God\nWeek 3: Trinity\nWeek 4: Creation\nWeek 5: Humanity and Sin\nWeek 6: Christology\nWeek 7: Soteriology\nWeek 8: Pneumatology\nWeek 9: Ecclesiology\nWeek 10: Sacraments\nWeek 11: Eschatology\nWeek 12: Theological Method\nWeek 13: Contemporary Issues\nWeek 14: Interfaith Dialogue\nWeek 15: Theology and Culture\nWeek 16: Final Project',
      isActive: true,
      instructor: 'teacher-001',
      instructorName: 'Dr. Sarah Wilson',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'course-005',
      title: 'Pastoral Care and Counseling',
      description: 'Practical skills for providing spiritual guidance and pastoral care.',
      category: 'Practical Ministry',
      duration: 8,
      maxStudents: 15,
      syllabus: 'Week 1: Foundations of Pastoral Care\nWeek 2: Listening Skills\nWeek 3: Crisis Intervention\nWeek 4: Grief and Loss\nWeek 5: Family Counseling\nWeek 6: Addiction and Recovery\nWeek 7: Mental Health Awareness\nWeek 8: Self-Care for Caregivers',
      isActive: true,
      instructor: 'teacher-002',
      instructorName: 'Rev. Michael Thompson',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ],

  enrollments: [
    {
      id: 'enrollment-001',
      courseId: 'course-001',
      studentId: 'student-001',
      status: 'active',
      progress: 75,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003', 'lesson-004', 'lesson-005', 'lesson-006'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    },
    {
      id: 'enrollment-002',
      courseId: 'course-001',
      studentId: 'student-002',
      status: 'active',
      progress: 50,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003', 'lesson-004'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    },
    {
      id: 'enrollment-003',
      courseId: 'course-002',
      studentId: 'student-001',
      status: 'active',
      progress: 30,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    },
    {
      id: 'enrollment-004',
      courseId: 'course-002',
      studentId: 'student-003',
      status: 'completed',
      progress: 100,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003', 'lesson-004', 'lesson-005', 'lesson-006', 'lesson-007', 'lesson-008', 'lesson-009', 'lesson-010'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    },
    {
      id: 'enrollment-005',
      courseId: 'course-003',
      studentId: 'student-004',
      status: 'active',
      progress: 25,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    },
    {
      id: 'enrollment-006',
      courseId: 'course-004',
      studentId: 'student-005',
      status: 'active',
      progress: 60,
      completedLessons: ['lesson-001', 'lesson-002', 'lesson-003', 'lesson-004', 'lesson-005', 'lesson-006', 'lesson-007', 'lesson-008', 'lesson-009', 'lesson-010'],
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now()
    }
  ],

  submissions: [
    {
      id: 'submission-001',
      courseId: 'course-001',
      assignmentId: 'assignment-001',
      studentId: 'student-001',
      submittedAt: Timestamp.now(),
      status: 'graded',
      grade: 95,
      feedback: 'Excellent work! Your analysis shows deep understanding of the biblical text. Well done on connecting historical context with theological implications.'
    },
    {
      id: 'submission-002',
      courseId: 'course-001',
      assignmentId: 'assignment-001',
      studentId: 'student-002',
      submittedAt: Timestamp.now(),
      status: 'submitted',
      grade: null,
      feedback: null
    },
    {
      id: 'submission-003',
      courseId: 'course-002',
      assignmentId: 'assignment-002',
      studentId: 'student-003',
      submittedAt: Timestamp.now(),
      status: 'graded',
      grade: 88,
      feedback: 'Good analysis of ethical principles. Consider exploring alternative viewpoints more thoroughly in future assignments.'
    },
    {
      id: 'submission-004',
      courseId: 'course-003',
      assignmentId: 'assignment-003',
      studentId: 'student-004',
      submittedAt: Timestamp.now(),
      status: 'submitted',
      grade: null,
      feedback: null
    }
  ],

  supportTickets: [
    {
      id: 'ticket-001',
      userId: 'student-001',
      name: 'John Smith',
      email: 'john.smith@student.straguel.edu',
      subject: 'Course Access Issue',
      message: 'I am unable to access the course materials for Introduction to Biblical Studies. The page keeps showing an error.',
      status: 'open',
      createdAt: Timestamp.now()
    },
    {
      id: 'ticket-002',
      userId: 'student-002',
      name: 'Mary Johnson',
      email: 'mary.johnson@student.straguel.edu',
      subject: 'Assignment Submission Problem',
      message: 'I tried to submit my assignment but the system gave me an error message. Can you help me resolve this?',
      status: 'in_progress',
      createdAt: Timestamp.now()
    },
    {
      id: 'ticket-003',
      userId: null,
      name: 'Anonymous User',
      email: 'visitor@example.com',
      subject: 'General Inquiry',
      message: 'I am interested in enrolling in your theology courses. Can you provide more information about the admission process?',
      status: 'resolved',
      createdAt: Timestamp.now()
    }
  ],

  blogs: [
    {
      id: 'blog-001',
      title: 'The Importance of Biblical Literacy in Modern Times',
      content: 'In today\'s rapidly changing world, biblical literacy has become more important than ever. This article explores why understanding the Bible is crucial for spiritual growth and how it can guide us through contemporary challenges...',
      authorId: 'teacher-001',
      authorName: 'Dr. Sarah Wilson',
      createdAt: Timestamp.now(),
      likes: 15
    },
    {
      id: 'blog-002',
      title: 'Understanding Christian Ethics in a Secular World',
      content: 'As Christians living in an increasingly secular society, we face unique challenges in applying our faith to everyday decisions. This post examines how Christian ethics can provide a solid foundation for navigating complex moral issues...',
      authorId: 'teacher-002',
      authorName: 'Rev. Michael Thompson',
      createdAt: Timestamp.now(),
      likes: 23
    },
    {
      id: 'blog-003',
      title: 'The Role of Church History in Contemporary Ministry',
      content: 'Church history is not just about the past—it\'s about understanding how we got to where we are today and learning from the wisdom of those who came before us. This article explores how historical knowledge can enhance modern ministry...',
      authorId: 'teacher-003',
      authorName: 'Prof. David Chen',
      createdAt: Timestamp.now(),
      likes: 18
    }
  ],

  announcements: [
    {
      id: 'announcement-001',
      courseId: null,
      title: 'Welcome to the New Academic Year!',
      body: 'We are excited to welcome all students to the new academic year. Classes begin next week, and we look forward to an enriching learning experience together.',
      authorId: 'admin-001',
      createdAt: Timestamp.now()
    },
    {
      id: 'announcement-002',
      courseId: 'course-001',
      title: 'Assignment Due Date Extended',
      body: 'Due to technical issues, the due date for Assignment 1 has been extended to Friday. Please ensure you submit your work by the new deadline.',
      authorId: 'teacher-001',
      createdAt: Timestamp.now()
    },
    {
      id: 'announcement-003',
      courseId: null,
      title: 'New Course Available: Advanced Theology',
      body: 'We are pleased to announce a new advanced course in systematic theology. This course will be available for enrollment starting next month.',
      authorId: 'admin-001',
      createdAt: Timestamp.now()
    }
  ],

  events: [
    {
      id: 'event-001',
      title: 'Faculty Meeting',
      date: new Date('2025-01-20T10:00:00Z'),
      description: 'Monthly faculty meeting to discuss curriculum updates and student progress.',
      createdBy: 'admin-001'
    },
    {
      id: 'event-002',
      title: 'Student Orientation',
      date: new Date('2025-01-25T14:00:00Z'),
      description: 'Welcome orientation for new students joining the program.',
      createdBy: 'admin-001'
    },
    {
      id: 'event-003',
      title: 'Theology Symposium',
      date: new Date('2025-02-01T09:00:00Z'),
      description: 'Annual theology symposium featuring guest speakers and panel discussions.',
      createdBy: 'teacher-001'
    }
  ],

  forumThreads: [
    {
      id: 'thread-001',
      title: 'Discussion: Biblical Interpretation Methods',
      body: 'What methods do you find most effective for interpreting biblical texts? Let\'s discuss different approaches and their strengths and limitations.',
      authorId: 'teacher-001',
      authorName: 'Dr. Sarah Wilson',
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now()
    },
    {
      id: 'thread-002',
      title: 'Ethical Dilemmas in Modern Ministry',
      body: 'Share your experiences with ethical challenges in ministry and how you navigated them. This could be helpful for other students and practitioners.',
      authorId: 'teacher-002',
      authorName: 'Rev. Michael Thompson',
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now()
    },
    {
      id: 'thread-003',
      title: 'Study Group: Church History',
      body: 'Looking for study partners for the Church History course. Anyone interested in forming a study group?',
      authorId: 'student-004',
      authorName: 'Lisa Chen',
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now()
    }
  ]
};

export default function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Function to seed the database
  const seedDatabase = async () => {
    setIsSeeding(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🌱 Starting database seeding...');

      // Seed users
      console.log('👥 Seeding users...');
      for (const user of testData.users) {
        await setDoc(doc(db, 'users', user.id), user);
        console.log(`✅ Added user: ${user.displayName}`);
      }

      // Seed courses
      console.log('📚 Seeding courses...');
      for (const course of testData.courses) {
        await setDoc(doc(db, 'courses', course.id), course);
        console.log(`✅ Added course: ${course.title}`);
      }

      // Seed enrollments
      console.log('🎓 Seeding enrollments...');
      for (const enrollment of testData.enrollments) {
        await setDoc(doc(db, 'enrollments', enrollment.id), enrollment);
        console.log(`✅ Added enrollment: ${enrollment.id}`);
      }

      // Seed submissions
      console.log('📝 Seeding submissions...');
      for (const submission of testData.submissions) {
        await setDoc(doc(db, 'submissions', submission.id), submission);
        console.log(`✅ Added submission: ${submission.id}`);
      }

      // Seed support tickets
      console.log('🎫 Seeding support tickets...');
      for (const ticket of testData.supportTickets) {
        await setDoc(doc(db, 'support_tickets', ticket.id), ticket);
        console.log(`✅ Added ticket: ${ticket.subject}`);
      }

      // Seed blogs
      console.log('📖 Seeding blogs...');
      for (const blog of testData.blogs) {
        await setDoc(doc(db, 'blogs', blog.id), blog);
        console.log(`✅ Added blog: ${blog.title}`);
      }

      // Seed announcements
      console.log('📢 Seeding announcements...');
      for (const announcement of testData.announcements) {
        await setDoc(doc(db, 'announcements', announcement.id), announcement);
        console.log(`✅ Added announcement: ${announcement.title}`);
      }

      // Seed events
      console.log('📅 Seeding events...');
      for (const event of testData.events) {
        await setDoc(doc(db, 'events', event.id), event);
        console.log(`✅ Added event: ${event.title}`);
      }

      // Seed forum threads
      console.log('💬 Seeding forum threads...');
      for (const thread of testData.forumThreads) {
        await setDoc(doc(db, 'forum_threads', thread.id), thread);
        console.log(`✅ Added forum thread: ${thread.title}`);
      }

      console.log('🎉 Database seeding completed successfully!');
      setStatus('success');
      setMessage(`Database seeded successfully! Added ${testData.users.length} users, ${testData.courses.length} courses, ${testData.enrollments.length} enrollments, ${testData.submissions.length} submissions, ${testData.supportTickets.length} support tickets, ${testData.blogs.length} blogs, ${testData.announcements.length} announcements, ${testData.events.length} events, and ${testData.forumThreads.length} forum threads.`);
      toast.success('Database seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      setStatus('error');
      setMessage(`Error seeding database: ${error.message}`);
      toast.error('Failed to seed database');
    } finally {
      setIsSeeding(false);
    }
  };

  // Function to clear all test data
  const clearTestData = async () => {
    setIsClearing(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🧹 Clearing test data...');
      
      const collections = [
        'users', 'courses', 'enrollments', 'submissions', 
        'support_tickets', 'blogs', 'announcements', 'events', 'forum_threads'
      ];

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`✅ Cleared ${collectionName}`);
      }

      console.log('🎉 Test data cleared successfully!');
      setStatus('success');
      setMessage('All test data cleared successfully!');
      toast.success('Test data cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing test data:', error);
      setStatus('error');
      setMessage(`Error clearing test data: ${error.message}`);
      toast.error('Failed to clear test data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Seeder
          </CardTitle>
          <CardDescription>
            Seed the Firebase database with comprehensive test data for all collections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          {status !== 'idle' && (
            <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={status === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Data Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900">{testData.users.length}</div>
              <div className="text-blue-600">Users</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-900">{testData.courses.length}</div>
              <div className="text-green-600">Courses</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-900">{testData.enrollments.length}</div>
              <div className="text-purple-600">Enrollments</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-900">{testData.submissions.length}</div>
              <div className="text-orange-600">Submissions</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={seedDatabase}
              disabled={isSeeding || isClearing}
              className="flex-1"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database
                </>
              )}
            </Button>

            <Button
              onClick={clearTestData}
              disabled={isSeeding || isClearing}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Data...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Clear All Data
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Warning:</strong> This will overwrite existing data in the database. 
              Make sure you have proper permissions and backup if needed.
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Click "Seed Database" to populate all collections with test data</li>
              <li>Use "Clear All Data" to remove all test data if needed</li>
              <li>Check the browser console for detailed progress logs</li>
              <li>Refresh the page after seeding to see the new data</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
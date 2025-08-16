import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UIDMapping {
  [key: string]: string;
}

export default function UIDMapper() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uidMapping, setUidMapping] = useState<UIDMapping>({});
  const [isMapping, setIsMapping] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Function to map seeded user IDs to actual Firebase Auth UIDs
  const mapUIDs = async () => {
    setIsMapping(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔄 Starting UID mapping process...');

      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const mapping: UIDMapping = {};
      const updatePromises: Promise<void>[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const seededId = userData.id;
        
        if (seededId && !userData.uid) {
          // This user needs UID mapping
          // For now, we'll use the document ID as the UID
          // In a real scenario, you'd need to create Firebase Auth users first
          mapping[seededId] = userDoc.id;
          
          // Update the user document with the UID
          const updatePromise = updateDoc(doc(db, 'users', userDoc.id), {
            uid: userDoc.id
          });
          updatePromises.push(updatePromise);
        }
      }

      // Execute all updates
      await Promise.all(updatePromises);
      
      setUidMapping(mapping);
      setStatus('success');
      setMessage(`Successfully mapped ${Object.keys(mapping).length} users!`);
      toast.success('UID mapping completed successfully!');

    } catch (error: any) {
      console.error('❌ Error mapping UIDs:', error);
      setStatus('error');
      setMessage(`Error mapping UIDs: ${error.message}`);
      toast.error('Failed to map UIDs');
    } finally {
      setIsMapping(false);
    }
  };

  // Function to update course instructor references
  const updateCourseInstructors = async () => {
    if (Object.keys(uidMapping).length === 0) {
      toast.error('Please map UIDs first');
      return;
    }

    setIsMapping(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔄 Updating course instructor references...');

      // Get all courses from Firestore
      const coursesRef = collection(db, 'courses');
      const coursesSnapshot = await getDocs(coursesRef);
      
      const updatePromises: Promise<void>[] = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();
        const seededInstructorId = courseData.instructor;
        
        if (seededInstructorId && uidMapping[seededInstructorId]) {
          // Update the course with the actual UID
          const updatePromise = updateDoc(doc(db, 'courses', courseDoc.id), {
            instructor: uidMapping[seededInstructorId]
          });
          updatePromises.push(updatePromise);
        }
      }

      // Execute all updates
      await Promise.all(updatePromises);
      
      setStatus('success');
      setMessage(`Successfully updated ${updatePromises.length} courses!`);
      toast.success('Course instructor references updated successfully!');

    } catch (error: any) {
      console.error('❌ Error updating course instructors:', error);
      setStatus('error');
      setMessage(`Error updating course instructors: ${error.message}`);
      toast.error('Failed to update course instructors');
    } finally {
      setIsMapping(false);
    }
  };

  // Function to update enrollment student references
  const updateEnrollmentStudents = async () => {
    if (Object.keys(uidMapping).length === 0) {
      toast.error('Please map UIDs first');
      return;
    }

    setIsMapping(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔄 Updating enrollment student references...');

      // Get all enrollments from Firestore
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);
      
      const updatePromises: Promise<void>[] = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data();
        const seededStudentId = enrollmentData.studentId;
        
        if (seededStudentId && uidMapping[seededStudentId]) {
          // Update the enrollment with the actual UID
          const updatePromise = updateDoc(doc(db, 'enrollments', enrollmentDoc.id), {
            studentId: uidMapping[seededStudentId]
          });
          updatePromises.push(updatePromise);
        }
      }

      // Execute all updates
      await Promise.all(updatePromises);
      
      setStatus('success');
      setMessage(`Successfully updated ${updatePromises.length} enrollments!`);
      toast.success('Enrollment student references updated successfully!');

    } catch (error: any) {
      console.error('❌ Error updating enrollments:', error);
      setStatus('error');
      setMessage(`Error updating enrollments: ${error.message}`);
      toast.error('Failed to update enrollments');
    } finally {
      setIsMapping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            UID Mapper
          </CardTitle>
          <CardDescription>
            Map seeded user IDs to actual Firebase Auth UIDs and update references
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

          {/* Current User Info */}
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <div className="text-sm space-y-1">
                <div><strong>UID:</strong> {currentUser.uid}</div>
                <div><strong>Email:</strong> {currentUser.email}</div>
              </div>
            </div>
          )}

          {/* UID Mapping Results */}
          {Object.keys(uidMapping).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">UID Mapping Results:</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(uidMapping).map(([seededId, actualUid]) => (
                  <div key={seededId} className="flex justify-between text-sm">
                    <span className="font-mono">{seededId}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-mono">{actualUid}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={mapUIDs}
              disabled={isMapping}
              className="w-full"
              size="lg"
            >
              {isMapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mapping UIDs...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Map User UIDs
                </>
              )}
            </Button>

            {Object.keys(uidMapping).length > 0 && (
              <>
                <Button
                  onClick={updateCourseInstructors}
                  disabled={isMapping}
                  variant="outline"
                  className="w-full"
                >
                  Update Course Instructor References
                </Button>

                <Button
                  onClick={updateEnrollmentStudents}
                  disabled={isMapping}
                  variant="outline"
                  className="w-full"
                >
                  Update Enrollment Student References
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, create Firebase Auth users using the "🔐 Auth Users" tool</li>
              <li>Click "Map User UIDs" to map seeded IDs to actual UIDs</li>
              <li>Update course instructor references</li>
              <li>Update enrollment student references</li>
              <li>Test the dashboards</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
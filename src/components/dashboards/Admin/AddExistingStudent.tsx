/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CSVUpload from '@/components/ui/CSVUpload';
import { useI18n } from '@/contexts/I18nContext';
import { courseService, gradeService, userService, studentMetaService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface PastGrade {
  courseId: string;
  courseTitle: string;
  grade: number;
}

const AddExistingStudent = ({ onStudentAdded }: { onStudentAdded: () => void }) => {
  const { t } = useI18n();
  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    role: 'student' as 'student',
    password: '',
    studentId: '',
    studentGroup: '',
    programType: '',
    classSection: '',
    phoneNumber: '',
    address: '',
    year: ''
  });
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [pastGrades, setPastGrades] = useState<PastGrade[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [grade, setGrade] = useState<number | ''>('');
  const { userProfile } = useAuth();
  const [studentMeta, setStudentMeta] = useState<{ studentGroups: string[]; programTypes: string[]; classSections: string[] }>({ studentGroups: [], programTypes: [], classSections: [] });
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const allCourses = await courseService.getAllCourses();
        setCourses(allCourses);
        const opts = await studentMetaService.getOptions();
        setStudentMeta(opts);
      } catch (e) {
        console.error('Failed to load courses or student meta options', e);
      }
    })();
  }, []);

  useEffect(() => {
    const generateStudentId = async () => {
      if (newUser.programType) {
        setIsGeneratingId(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-id/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              programType: newUser.programType,
            }),
          });
          if (!response.ok) {
            throw new Error('API Error');
          }
          const data = await response.json();
          if (data.studentId) {
            setNewUser(prev => ({ ...prev, studentId: data.studentId }));
          }
        } catch (error) {
          console.error('Error generating student ID:', error);
          setNewUser(prev => ({ ...prev, studentId: 'Error generating ID' }));
        } finally {
          setIsGeneratingId(false);
        }
      }
    };

    generateStudentId();
  }, [newUser.programType]);

  const handleAddUser = async () => {
    setIsCreatingUser(true);
    try {
      const defaultPasswords = {
        student: 'student123',
      };
      const password = defaultPasswords[newUser.role];

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        password
      );

      const studentData = {
        ...(newUser.studentGroup && { studentGroup: newUser.studentGroup }),
        ...(newUser.programType && { programType: newUser.programType }),
        ...(newUser.classSection && { classSection: newUser.classSection }),
        ...(newUser.year && { year: newUser.year }),
      };

      await userService.createUser({
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        isActive: true,
        uid: userCredential.user.uid,
        passwordChanged: false,
        studentId: newUser.studentId,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
        ...studentData
      });

      if (pastGrades.length > 0) {
        for (const grade of pastGrades) {
          await gradeService.createGrade({
            studentId: userCredential.user.uid,
            courseId: grade.courseId,
            finalGrade: grade.grade,
            letterGrade: getLetterGrade(grade.grade),
            gradePoints: getGradePoints(grade.grade),
            calculatedBy: userProfile?.uid || '',
            calculationMethod: 'manual',
            isPublished: true,
          });
        }
      }

      await signOut(secondaryAuth);

      setNewUser({
        displayName: '',
        email: '',
        role: 'student',
        password: '',
        studentGroup: '',
        programType: '',
        classSection: '',
        phoneNumber: '',
        address: '',
        studentId: '',
        year: '',
      });
      setPastGrades([]);
      onStudentAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  const getGradePoints = (grade: number) => {
    if (grade >= 90) return 4.0;
    if (grade >= 80) return 3.0;
    if (grade >= 70) return 2.0;
    if (grade >= 60) return 1.0;
    return 0.0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Add Existing Students</h2>
        <div className="flex items-center gap-2 text-sm">
          <button className={`px-3 py-1 rounded ${mode === 'single' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setMode('single')}>Single</button>
          <button className={`px-3 py-1 rounded ${mode === 'bulk' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setMode('bulk')}>Bulk</button>
        </div>
      </div>
      {mode === 'single' ? (
        <>
          <div className="grid gap-4 py-4">
            {/* Form fields for single student */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">{t('users.form.name')}</Label>
              <Input
                id="displayName"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                className="col-span-3"
                placeholder={t('users.form.name_placeholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
                placeholder={t('auth.email_placeholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                className="col-span-3"
                placeholder="Phone Number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={newUser.address}
                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                className="col-span-3"
                placeholder="Address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentGroup" className="text-right">Student Group</Label>
              <Select value={newUser.studentGroup} onValueChange={(value) => setNewUser({ ...newUser, studentGroup: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Student Group" />
                </SelectTrigger>
                <SelectContent>
                  {studentMeta.studentGroups.map(sg => (
                    <SelectItem key={sg} value={sg}>{sg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="programType" className="text-right">Program Type</Label>
              <Select value={newUser.programType} onValueChange={(value) => setNewUser({ ...newUser, programType: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Program Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Six Months">Six Months</SelectItem>
                  {studentMeta.programTypes.map(pt => (
                    <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classSection" className="text-right">Class Section</Label>
              <Select value={newUser.classSection} onValueChange={(value) => setNewUser({ ...newUser, classSection: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Class Section" />
                </SelectTrigger>
                <SelectContent>
                  {studentMeta.classSections.map(cs => (
                    <SelectItem key={cs} value={cs}>{cs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Select value={newUser.year} onValueChange={(value) => setNewUser({ ...newUser, year: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Past Grades</Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Select onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses
                        .filter(course => !pastGrades.some(pg => pg.courseId === course.id))
                        .map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Grade"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedCourse && grade !== '') {
                        const course = courses.find(c => c.id === selectedCourse);
                        if (course) {
                          setPastGrades([...pastGrades, { courseId: selectedCourse, courseTitle: course.title, grade: Number(grade) }]);
                          setSelectedCourse('');
                          setGrade('');
                        }
                      }
                    }}
                  >
                    Add Grade
                  </Button>
                </div>
                {pastGrades.length > 0 && (
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastGrades.map((g, index) => (
                        <TableRow key={index}>
                          <TableCell>{g.courseTitle}</TableCell>
                          <TableCell>{g.grade}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setPastGrades(pastGrades.filter((_, i) => i !== index))}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <LoadingButton
              type="submit"
              onClick={handleAddUser}
              loading={isCreatingUser}
              loadingText="Creating User…"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('users.create')}
            </LoadingButton>
          </div>
        </>
      ) : (
        <div className="py-2">
          <CSVUpload
            onUsersCreated={(count) => { onStudentAdded(); }}
            onError={(msg) => console.error(msg)}
          />
        </div>
      )}
    </div>
  );
};

export default AddExistingStudent;

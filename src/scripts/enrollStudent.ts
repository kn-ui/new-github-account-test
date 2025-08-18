
import { enrollmentService, userService, courseService } from '../lib/firestore';

const enrollStudent = async () => {
  try {
    // --- IMPORTANT ---
    // Replace with the actual email of your student and the titles of the courses.
    const studentEmail = 'student@example.com';
    const courseTitles = ['Introduction to Biblical Studies', 'Christian Ethics and Moral Theology'];

    // --- Get Student ---
    const student = await userService.getUserByEmail(studentEmail);
    if (!student) {
      console.log(`Student with email ${studentEmail} not found.`);
      return;
    }

    // --- Get Courses ---
    const courses = await Promise.all(
      courseTitles.map(title => courseService.getCoursesByTitle(title))
    );

    // --- Enroll Student in Courses ---
    for (const course of courses) {
      if (course) {
        await enrollmentService.createEnrollment({
          courseId: course.id,
          studentId: student.uid,
          status: 'active',
          progress: 0,
          completedLessons: [],
        });
        console.log(`Enrolled student ${studentEmail} in course ${course.title}`);
      }
    }

  } catch (error) {
    console.error('Error enrolling student:', error);
  }
};

enrollStudent();

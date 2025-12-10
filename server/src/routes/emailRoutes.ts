import { Router } from 'express';
import { sendEmail } from '../services/emailService';
import userService from '../services/userService';
import enrollmentService from '../services/enrollmentService';
import { UserRole } from '../types';

import courseService from '../services/courseService';

const router = Router();

router.post('/contact', async (req, res) => {
  // const { name, email, subject, message } = req.body;

  // if (!name || !email || !subject || !message) {
  //   return res.status(400).json({ success: false, message: 'All fields are required.' });
  // }

  // try {
  //   await sendEmail({
  //     from: email,
  //     to: 'kalid630324@gmail.com', // real email
  //     subject: `New Contact Message: ${subject}`,
  //     text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  //     html: `<p><strong>Name:</strong> ${name}</p>
  //            <p><strong>Email:</strong> ${email}</p>
  //            <p><strong>Subject:</strong> ${subject}</p>
  //            <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
  //   });

  //   return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  // } catch (error) {
  //   console.error('Error in contact form submission:', error);
  //   return res.status(500).json({ success: false, message: 'Failed to send message.' });
  // }
  console.log('Contact form submission received, email sending disabled.');
  return res.status(200).json({ success: true, message: 'Message received (email sending disabled).' });
});

router.post('/announcement', async (req, res) => {
  console.log('--- Announcement Email Route Hit (disabled) ---');
  // const { announcement } = req.body;

  // if (!announcement) {
  //   console.log('Error: Announcement data is required.');
  //   return res.status(400).json({ success: false, message: 'Announcement data is required.' });
  // }

  // console.log('Received announcement:', JSON.stringify(announcement, null, 2));

  // const { title, body, targetAudience, courseId, recipientUserId, authorId, authorRole } = announcement;

  // try {
  //   let studentEmails: string[] = [];
  //   console.log(`Target Audience: ${targetAudience}`);

  //   if (targetAudience === 'ALL_STUDENTS') {
  //     if (authorRole === 'admin' || authorRole === 'super_admin') {
  //       const { users } = await userService.getAllUsers(1, 1000, UserRole.STUDENT);
  //       studentEmails = users.map(user => user.email).filter((email): email is string => !!email);
  //       console.log(`Found ${studentEmails.length} students for ALL_STUDENTS (admin).`);
  //     } else {
  //       const { courses: teacherCourses } = await courseService.getAllCourses(1, 1000, undefined, authorId);
  //       const courseIds = teacherCourses.map(course => course.id);
  //       if (courseIds.length > 0) {
  //         const enrollmentPromises = courseIds.map(id => enrollmentService.getEnrollmentsByCourse(id));
  //         const enrollments = (await Promise.all(enrollmentPromises)).flat();
  //         const studentIds = [...new Set(enrollments.map(e => e.studentId))];
  //         const students = await Promise.all(studentIds.map(id => userService.getUserById(id)));
  //         studentEmails = students.map(student => student?.email).filter((email): email is string => !!email);
  //       }
  //       console.log(`Found ${studentEmails.length} students for ALL_STUDENTS (teacher's students).`);
  //     }
  //   } else if (targetAudience === 'COURSE_STUDENTS' && courseId) {      console.log(`Fetching students for course: ${courseId}`);
  //     const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
  //     const studentIds = enrollments.map(e => e.studentId);
  //     console.log(`Found ${studentIds.length} enrollments.`);
  //     const students = await Promise.all(studentIds.map(id => userService.getUserById(id)));
  //     studentEmails = students.map(student => student?.email).filter((email): email is string => !!email);
  //     console.log(`Found ${studentEmails.length} student emails for course.`);
  //   } else if (targetAudience === 'SPECIFIC_USER' && recipientUserId) {
  //     console.log(`Fetching student: ${recipientUserId}`);
  //     const student = await userService.getUserById(recipientUserId);
  //     if (student && student.email) {
  //       studentEmails.push(student.email);
  //     }
  //     console.log(`Found ${studentEmails.length} student emails for specific student.`);
  //   }

  //   console.log('Student emails to send to:', studentEmails);

  //   if (studentEmails.length > 0) {
  //     const emailPromises = studentEmails.map(email => 
  //       sendEmail({
  //         to: email,
  //         subject: `New Announcement: ${title}`,
  //         text: body,
  //         html: `<h1>${title}</h1><p>${body}</p>`,
  //       })
  //     );

  //     const results = await Promise.allSettled(emailPromises);

  //     results.forEach((result, index) => {
  //       if (result.status === 'rejected') {
  //         console.error(`Failed to send email to ${studentEmails[index]}:`, result.reason);
  //       }
  //     });

  //     console.log('Finished sending announcement emails.');
  //     return res.status(200).json({ success: true, message: 'Announcement emails processed.' });
  //   } else {
  //     console.log('No students to notify.');
  //     return res.status(200).json({ success: true, message: 'No students to notify.' });
  //   }
  // } catch (error) {
  //   console.error('Error sending announcement email:', error);
  //   return res.status(500).json({ success: false, message: 'Failed to send announcement email.' });
  // }
  return res.status(200).json({ success: true, message: 'Announcement email sending disabled.' });
});

export default router;

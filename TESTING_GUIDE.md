# 🧪 **School Management System - Comprehensive Testing Guide**

## 📋 **Overview**

This guide provides comprehensive instructions for testing every functionality of the St. Raguel Church School Management System. The system includes comprehensive test data that allows you to test all features without needing database write permissions.

## 🚀 **Getting Started**

### **Prerequisites**
- Both frontend and backend servers running
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### **Test Data Available**
The system includes comprehensive test data for all collections:
- **9 Users** (1 admin, 3 teachers, 5 students)
- **5 Courses** (Theology, Ethics, History, Practical Ministry)
- **6 Enrollments** (various progress levels)
- **4 Submissions** (graded and pending)
- **3 Support Tickets** (different statuses)
- **3 Blog Posts** (by different teachers)
- **3 Announcements** (general and course-specific)
- **3 Events** (calendar items)
- **3 Forum Threads** (discussions)

## 🎯 **Testing Scenarios by User Role**

### **👑 Admin User Testing**

#### **Login & Authentication**
1. Navigate to `/login`
2. Use credentials: `admin@straguel.edu` / `password123`
3. Verify redirect to admin dashboard

#### **Admin Dashboard Features**
1. **System Statistics**
   - Total Users: 9
   - Active Courses: 5
   - Completion Rate: 17% (1/6 enrollments completed)
   - System Health: 99.9%

2. **Recent Users Widget**
   - Should display 10 most recent users
   - Verify user roles, status, and join dates

3. **Analytics Charts**
   - Enrollment Trends Chart
   - Course Completion Chart
   - User Activity Chart
   - Role Distribution Chart

4. **Quick Actions**
   - **Add New User**: Opens user creation modal
   - **Create Course**: Navigates to course creation
   - **Generate Report**: Opens report generation modal
   - **Calendar Events**: Navigates to calendar

#### **User Management**
1. **Add Single User**
   - Click "Add New User" → "Single User" tab
   - Fill form: Name, Email, Role, Password
   - Submit and verify success message

2. **Bulk User Creation**
   - Click "Add New User" → "Bulk Upload" tab
   - Download CSV template
   - Upload sample CSV with multiple users
   - Verify preview and creation

3. **Report Generation**
   - Click "Generate Report"
   - Select report type: User List, Enrollment Records, Course Analytics, System Overview
   - Choose format: CSV or PDF
   - Generate and verify download

### **👨‍🏫 Teacher User Testing**

#### **Login & Authentication**
1. Navigate to `/login`
2. Use credentials: `sarah.wilson@straguel.edu` / `password123`
3. Verify redirect to teacher dashboard

#### **Teacher Dashboard Features**
1. **Statistics Cards**
   - Active Courses: 2 (Biblical Studies, Systematic Theology)
   - Total Students: 3 (enrolled in teacher's courses)
   - Pending Reviews: 1 (submission needs grading)
   - Average Rating: 4.8

2. **My Courses Section**
   - Should display courses where teacher is instructor
   - Verify course details, enrollment counts
   - Test "View" and "Analytics" buttons

3. **Recent Submissions**
   - Display submissions from teacher's courses
   - Verify status (submitted/graded)
   - Test "Grade" button for pending submissions

4. **Announcements**
   - View existing announcements
   - **Post New Announcement**: Opens modal
   - Fill title, body, course selection
   - Submit and verify creation

5. **Quick Actions**
   - **Create Assignment**: Navigate to assignment creation
   - **Message Students**: Use announcement system
   - **View Reports**: Access analytics

### **👨‍🎓 Student User Testing**

#### **Login & Authentication**
1. Navigate to `/login`
2. Use credentials: `john.smith@student.straguel.edu` / `password123`
3. Verify redirect to student dashboard

#### **Student Dashboard Features**
1. **Statistics Cards**
   - Enrolled Courses: 2 (Biblical Studies, Ethics)
   - Average Progress: 53% (average of 75% and 30%)
   - Pending Assignments: 1 (submission needs grading)
   - Certificates: 2

2. **My Courses Section**
   - Display enrolled courses with progress bars
   - Verify course titles and progress percentages
   - Test "Continue" button navigation

3. **Upcoming Assignments**
   - Show assignments with due dates
   - Verify assignment details and status

4. **Announcements**
   - Display general and course-specific announcements
   - Verify announcement content and dates

5. **Quick Actions**
   - **View Schedule**: Navigate to calendar
   - **Browse Courses**: Navigate to course catalog
   - **My Certificates**: Navigate to certificates page

## 🔍 **Feature-Specific Testing**

### **📚 Course Management**
1. **Course Catalog** (`/courses`)
   - Verify all 5 courses display
   - Test category filtering
   - Test search functionality
   - Verify course details (duration, max students, instructor)

2. **Course Detail** (`/courses/:courseId`)
   - Navigate to specific course
   - Verify course information display
   - Test enrollment functionality
   - Verify syllabus content

3. **Course Creation** (`/create-course`)
   - Fill course creation form
   - Test validation
   - Submit and verify success

### **💬 Forum System**
1. **Forum Main Page** (`/forum`)
   - Display all forum threads
   - Verify thread titles and authors
   - Test thread creation (admin/teacher only)

2. **Thread Detail** (`/forum/:threadId`)
   - View thread content
   - Test reply functionality
   - Verify permissions (students can reply, not create threads)

### **📖 Blog System**
1. **Blog Main Page** (`/blog`)
   - Display all blog posts
   - Verify post titles, authors, and content
   - Test like functionality

2. **Blog Creation** (Admin/Teacher only)
   - Create new blog post
   - Fill title and content
   - Submit and verify creation

### **📅 Calendar & Events**
1. **Calendar Page** (`/calendar`)
   - Display all events
   - Verify event details and dates
   - Test event creation (admin/teacher only)

### **📞 Contact & Support**
1. **Contact Page** (`/contact`)
   - Fill contact form
   - Test submission for non-authenticated users
   - Verify support ticket creation

2. **Support Ticket Management**
   - View ticket status
   - Test ticket updates
   - Verify email notifications

## 🧪 **Testing Checklist**

### **✅ Core Functionality**
- [ ] User authentication and role-based access
- [ ] Dashboard loading and data display
- [ ] Navigation between pages
- [ ] Form submissions and validation
- [ ] Real-time data updates

### **✅ User Management**
- [ ] User creation (single and bulk)
- [ ] Role assignment and permissions
- [ ] User profile management
- [ ] User search and filtering

### **✅ Course Management**
- [ ] Course creation and editing
- [ ] Course enrollment and progress tracking
- [ ] Assignment submission and grading
- [ ] Course analytics and reporting

### **✅ Communication Features**
- [ ] Announcement creation and display
- [ ] Forum thread creation and replies
- [ ] Blog post creation and interaction
- [ ] Support ticket system

### **✅ Analytics & Reporting**
- [ ] Dashboard statistics
- [ ] Chart data visualization
- [ ] Report generation (CSV/PDF)
- [ ] Data export functionality

### **✅ UI/UX Testing**
- [ ] Responsive design on different screen sizes
- [ ] Accessibility features
- [ ] Loading states and error handling
- [ ] Toast notifications and user feedback

## 🐛 **Common Issues & Solutions**

### **Issue: Dashboard Not Loading**
- **Solution**: Check browser console for errors
- **Check**: Firebase configuration and network connectivity

### **Issue: Data Not Displaying**
- **Solution**: Verify test data is properly imported
- **Check**: Component props and data flow

### **Issue: Forms Not Submitting**
- **Solution**: Check form validation and required fields
- **Check**: Browser console for JavaScript errors

### **Issue: Navigation Not Working**
- **Solution**: Verify React Router configuration
- **Check**: Route definitions and component imports

## 📊 **Performance Testing**

### **Load Testing**
- Test dashboard with large datasets
- Verify chart rendering performance
- Test form submission response times

### **Memory Testing**
- Monitor memory usage during navigation
- Check for memory leaks in components
- Verify proper cleanup of event listeners

## 🔒 **Security Testing**

### **Authentication**
- Test unauthorized access to protected routes
- Verify role-based permissions
- Test session management

### **Data Validation**
- Test form input validation
- Verify SQL injection prevention
- Test XSS protection

## 📱 **Cross-Platform Testing**

### **Browser Compatibility**
- Chrome, Firefox, Safari, Edge
- Test responsive design
- Verify JavaScript functionality

### **Device Testing**
- Desktop, tablet, mobile
- Touch interactions
- Screen size adaptations

## 📝 **Reporting Issues**

When reporting issues, include:
1. **User Role**: Admin/Teacher/Student
2. **Page/Component**: Specific location of issue
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Expected vs Actual**: What should happen vs what happens
5. **Browser/Device**: Environment details
6. **Console Errors**: Any JavaScript errors
7. **Screenshots**: Visual evidence of issue

## 🎯 **Success Criteria**

The system is considered fully functional when:
- ✅ All user roles can access appropriate dashboards
- ✅ All CRUD operations work correctly
- ✅ Real-time data updates function properly
- ✅ All navigation and routing works
- ✅ Forms submit and validate correctly
- ✅ Analytics and charts display accurate data
- ✅ Responsive design works on all devices
- ✅ No console errors or warnings
- ✅ All features are accessible and functional

---

**Happy Testing! 🎉**

For technical support or questions, refer to the development team or check the project documentation.
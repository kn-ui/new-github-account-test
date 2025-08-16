# 🗄️ **Database Seeding Guide**

## 📋 **Overview**

This guide explains how to seed the Firebase database with comprehensive test data for the St. Raguel Church School Management System.

## 🚀 **Method 1: Using the Database Seeder Component (Recommended)**

### **Step 1: Access the Database Seeder**
1. Navigate to the application in your browser: `http://localhost:5173`
2. Look for the **"🗄️ Seed DB"** button in the header (only visible in development mode)
3. Click on it to navigate to `/seed-database`

### **Step 2: Seed the Database**
1. On the Database Seeder page, you'll see a summary of all test data
2. Click the **"Seed Database"** button
3. Wait for the seeding process to complete
4. You'll see success messages and progress in the console

### **Step 3: Verify the Data**
1. Check the browser console for detailed logs
2. Navigate to different parts of the application to see the new data
3. Test user dashboards with the seeded data

## 🔧 **Method 2: Browser Console Script**

If you prefer to run the seeding from the browser console:

### **Step 1: Open Browser Console**
1. Navigate to the application: `http://localhost:5173`
2. Open Developer Tools (F12)
3. Go to the Console tab

### **Step 2: Run the Seeding Script**
Copy and paste the entire content of `src/scripts/browserSeed.js` into the console and press Enter.

## 📊 **Test Data Overview**

The seeder will create the following data:

### **👥 Users (9 total)**
- **1 Admin**: `admin@straguel.edu`
- **3 Teachers**: Dr. Sarah Wilson, Rev. Michael Thompson, Prof. David Chen
- **5 Students**: John Smith, Mary Johnson, David Wilson, Lisa Chen, Robert Brown

### **📚 Courses (5 total)**
- Introduction to Biblical Studies (8 weeks)
- Christian Ethics and Moral Theology (10 weeks)
- Church History and Traditions (12 weeks)
- Systematic Theology (16 weeks)
- Pastoral Care and Counseling (8 weeks)

### **🎓 Enrollments (6 total)**
- Various progress levels (25% to 100%)
- Mix of active and completed enrollments
- Realistic lesson completion tracking

### **📝 Submissions (4 total)**
- Graded and pending submissions
- Realistic feedback and grades
- Different assignment types

### **🎫 Support Tickets (3 total)**
- Different statuses (open, in-progress, resolved)
- Mix of authenticated and anonymous users

### **📖 Blog Posts (3 total)**
- Theological topics by different teachers
- Realistic content and engagement metrics

### **📢 Announcements (3 total)**
- General and course-specific announcements
- Different authors and content types

### **📅 Events (3 total)**
- Faculty meetings, orientations, symposiums
- Various dates and descriptions

### **💬 Forum Threads (3 total)**
- Discussion topics and study groups
- Mix of teacher and student authors

## 🧪 **Testing After Seeding**

### **Admin Dashboard**
- Login with: `admin@straguel.edu` / `password123`
- Verify user statistics and analytics
- Test user management features

### **Teacher Dashboard**
- Login with: `sarah.wilson@straguel.edu` / `password123`
- Verify course data and student enrollments
- Test announcement creation

### **Student Dashboard**
- Login with: `john.smith@student.straguel.edu` / `password123`
- Verify enrolled courses and progress
- Test assignment viewing

## 🗑️ **Clearing Test Data**

### **Using the Component**
1. Go to `/seed-database`
2. Click **"Clear All Data"** button
3. Confirm the action

### **Using Console Script**
Run the clear function from the browser console.

## ⚠️ **Important Notes**

### **Permissions**
- The database seeder requires write permissions to Firebase
- If you get permission errors, the Firebase project may be read-only
- In that case, use the frontend test data system instead

### **Data Overwrite**
- Seeding will overwrite existing data with the same IDs
- Use the clear function before re-seeding if needed
- Always backup important data before seeding

### **Development Use**
- The database seeder is intended for development and testing
- Don't use it in production environments
- The "Seed DB" button only appears in development mode

## 🔍 **Troubleshooting**

### **Issue: Permission Denied**
- **Cause**: Firebase project doesn't allow writes
- **Solution**: Use frontend test data or contact project admin

### **Issue: Seeding Fails Partially**
- **Cause**: Some collections may have permission issues
- **Solution**: Check console logs for specific errors
- **Workaround**: Seed collections individually

### **Issue: Data Not Visible**
- **Cause**: Page needs refresh after seeding
- **Solution**: Refresh the page or navigate to a different route
- **Check**: Verify data exists in Firebase console

### **Issue: Component Not Loading**
- **Cause**: Missing dependencies or build errors
- **Solution**: Check browser console for errors
- **Check**: Verify all imports are correct

## 📱 **Mobile Testing**

The database seeder is fully responsive and works on:
- Desktop browsers
- Tablet devices
- Mobile phones
- All screen sizes

## 🎯 **Success Criteria**

Seeding is successful when:
- ✅ All collections show the expected number of documents
- ✅ No console errors during the process
- ✅ Success message appears
- ✅ Data is visible in the application
- ✅ All user roles can access their dashboards
- ✅ Analytics and charts display correctly

## 📞 **Support**

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase configuration
3. Check network connectivity
4. Review the troubleshooting section above
5. Contact the development team if needed

---

**Happy Seeding! 🌱**

For technical support or questions, refer to the development team or check the project documentation.
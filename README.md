# St. Raguel Church School Management System

A comprehensive full-stack school management system built for St. Raguel Church School. This system provides an e-learning platform with user management, course management, and role-based access control.

## 🚀 Features

### For Students
- 📚 Browse and search course catalog
- 📝 Enroll in courses
- 📊 Track learning progress
- 📋 Submit assignments
- 💬 Participate in course discussions
- 🏆 Receive completion certificates

### For Teachers
- 👨‍🏫 Create and manage courses
- 📄 Add lessons and learning materials
- 📝 Create and grade assignments
- 👥 View student enrollment and progress
- 📈 Access teaching analytics

### For Administrators
- 👤 Manage all users (students, teachers)
- 🎯 Assign and modify user roles
- 📊 View system-wide statistics
- 🔧 Manage platform settings
- 🗃️ Oversee all courses and content

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Firebase SDK** for authentication

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Firebase Admin SDK** for server-side operations
- **Firebase Firestore** as database
- **Firebase Storage** for file uploads
- **Firebase Authentication** for user management

### Database & Authentication
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication and authorization
- **Firebase Storage** - File storage for course materials and assignments

## 📁 Project Structure

```
st-raguel-school-management-system/
├── src/                          # Frontend React application
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   └── assets/                  # Static assets
├── server/                      # Backend Node.js application
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Custom middleware
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   ├── dist/                   # Compiled JavaScript
│   └── package.json            # Backend dependencies
├── public/                     # Public static files
├── package.json               # Root package.json
└── README.md                  # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore, Auth, and Storage enabled

### 1. Clone the Repository
```bash
git clone <repository-url>
cd st-raguel-school-management-system
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run install:backend
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Email/Password provider)
4. Enable Storage
5. Download service account key for backend
6. Get web app config for frontend

### 4. Environment Configuration

#### Backend Environment (server/.env)
```env
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Upload Configuration
MAX_FILE_SIZE=10485760
```

#### Frontend Environment (.env)
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

Note: Add your real keys to `.env` (not committed). Example starter file: `.env.example`.

### 5. Database Setup

#### Required Firestore Collections
- `users` - User profiles and roles
- `courses` - Course information
- `lessons` - Course lessons and content
- `assignments` - Course assignments
- `enrollments` - Student course enrollments
- `submissions` - Assignment submissions
- `forums` - Discussion forums

## 🚀 Running the Application

### Development Mode

#### Start Both Frontend and Backend
```bash
npm run dev:all
```

#### Start Frontend Only
```bash
npm run dev
```

#### Start Backend Only
```bash
npm run dev:backend
```

### Production Build

#### Build Both Applications
```bash
npm run build:all
```

#### Build Frontend Only
```bash
npm run build
```

#### Build Backend Only
```bash
npm run build:backend
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require Firebase ID token:
```
Authorization: Bearer <firebase-id-token>
```

### Key Endpoints

#### Users
- `POST /api/users/profile` - Create/Update profile
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/` - Get all users (Admin)
- `PUT /api/users/:id/role` - Update user role (Admin)

#### Courses
- `GET /api/courses/` - Get course catalog
- `POST /api/courses/` - Create course (Teacher/Admin)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course (Student)
- `GET /api/courses/student/enrollments` - Get student enrollments

## 🔒 Security Features

- **Firebase Authentication** - Secure user authentication
- **Role-Based Access Control** - Different permissions for students, teachers, and admins
- **Input Validation** - Request validation middleware
- **CORS Protection** - Configured for secure cross-origin requests
- **Security Headers** - Helmet.js for security headers
- **Environment Variables** - Sensitive data in environment variables

## 👥 User Roles & Permissions

### Student Role
- View course catalog
- Enroll in courses
- Access enrolled course content
- Submit assignments
- Track learning progress
- Participate in discussions

### Teacher Role
- All student permissions
- Create and manage courses
- Add lessons and materials
- Create assignments
- Grade student submissions
- View student progress
- Manage course discussions

### Admin Role
- All teacher permissions
- Manage all users
- Assign and modify user roles
- Delete courses
- Access system statistics
- Deactivate/activate users

## 🎯 Development Milestones Completed

✅ **Milestone 1: Project Setup & Foundation**
- Monorepo structure created
- Backend with Node.js/Express/TypeScript
- Frontend with React/Vite/TypeScript
- Firebase project integration

✅ **Milestone 2: Authentication & User Roles**
- Firebase Authentication integration
- Role-based access control
- User profile management
- Protected routes and middleware

✅ **Milestone 3: Course Management (Core)**
- Course creation and management
- Public course catalog
- Course detail pages
- Search and filter functionality

✅ **Milestone 4: Role-Based Dashboards**
- Protected dashboard layouts
- Admin user management
- Teacher course management
- Student enrollment interface

## 🔄 Next Steps (Future Milestones)

### Milestone 5: Student Experience
- [ ] Assignment submission system
- [ ] Progress tracking enhancements
- [ ] Learning resource management

### Milestone 6: Teacher Tools
- [ ] Lesson content management
- [ ] Grading system
- [ ] Student progress analytics

### Milestone 7: Supporting Features
- [ ] Progress charts with Highcharts
- [ ] Certificate generation
- [ ] Q&A forums
- [ ] Help desk and support pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 📞 Contact

**St. Raguel Church School**
- Website: [Coming Soon]
- Email: [Contact Information]
- Phone: [Contact Information]

---

Built with ❤️ for St. Raguel Church School community

# St. Raguel Church School - Backend API

A comprehensive backend API for the St. Raguel Church School Management System built with Node.js, Express, TypeScript, and Firebase.

## Features

- **User Management**: Registration, authentication, role-based access control
- **Course Management**: Create, update, delete, and manage courses
- **Enrollment System**: Student enrollment and progress tracking
- **Role-Based Access**: Student, Teacher, and Admin roles with specific permissions
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **RESTful API**: Clean, documented API endpoints
- **TypeScript**: Full type safety and better development experience

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the `.env` file and update the values:
   ```bash
   cp .env.example .env
   ```
   
   Update the following environment variables:
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

4. **Firebase Setup**
   
   - Create a Firebase project
   - Enable Firestore, Authentication, and Storage
   - Download the service account key
   - Update the environment variables with your Firebase credentials

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### Health Check
- `GET /health` - Check API status

#### User Management
- `POST /api/users/profile` - Create/Update user profile
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/` - Get all users (Admin only)
- `GET /api/users/search` - Search users (Teacher/Admin)
- `GET /api/users/:userId` - Get user by ID (Teacher/Admin)
- `PUT /api/users/:userId/role` - Update user role (Admin only)
- `PUT /api/users/:userId/deactivate` - Deactivate user (Admin only)
- `PUT /api/users/:userId/activate` - Activate user (Admin only)
- `GET /api/users/admin/stats` - Get user statistics (Admin only)

#### Course Management
- `GET /api/courses/` - Get all courses (Public)
- `GET /api/courses/search` - Search courses (Public)
- `GET /api/courses/:courseId` - Get course by ID (Public)
- `POST /api/courses/` - Create course (Teacher/Admin)
- `PUT /api/courses/:courseId` - Update course (Teacher/Admin)
- `DELETE /api/courses/:courseId` - Delete course (Admin only)
- `POST /api/courses/:courseId/enroll` - Enroll in course (Student)
- `GET /api/courses/student/enrollments` - Get student enrollments (Student)
- `GET /api/courses/instructor/my-courses` - Get instructor courses (Teacher/Admin)
- `GET /api/courses/:courseId/enrollments` - Get course enrollments (Teacher/Admin)
- `PUT /api/courses/enrollments/:enrollmentId/progress` - Update progress (Student)
- `GET /api/courses/admin/stats` - Get course statistics (Teacher/Admin)

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

#### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## User Roles

### Student
- Create and update profile
- View course catalog
- Enroll in courses
- Track learning progress
- Access enrolled course content

### Teacher
- All student permissions
- Create and manage courses
- View student enrollments
- Track student progress
- Manage course content

### Admin
- All teacher permissions
- Manage all users
- Update user roles
- Delete courses
- Access system statistics
- Deactivate/activate users

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   └── firebase.ts   # Firebase configuration
│   ├── controllers/      # Request handlers
│   │   ├── userController.ts
│   │   └── courseController.ts
│   ├── middleware/       # Custom middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   └── validation.ts # Validation middleware
│   ├── models/           # Data models (if needed)
│   ├── routes/           # Route definitions
│   │   ├── userRoutes.ts
│   │   └── courseRoutes.ts
│   ├── services/         # Business logic
│   │   ├── userService.ts
│   │   └── courseService.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── response.ts   # Response helpers
│   └── index.ts          # Main application file
├── dist/                 # Compiled JavaScript files
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## Security Features

- **Firebase Authentication**: Secure user authentication
- **Role-Based Access Control**: Different permissions for different user roles
- **Input Validation**: Request validation middleware
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **Rate Limiting**: (Recommended for production)

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comprehensive logging

### Database Design
- Use Firestore collections for different entities
- Implement proper indexing for queries
- Use subcollections where appropriate
- Follow Firebase best practices

### Testing
- Write unit tests for services
- Write integration tests for controllers
- Use proper mocking for Firebase services

## Deployment

### Environment Variables for Production
Make sure to set production values for:
- `NODE_ENV=production`
- `JWT_SECRET` (strong, unique secret)
- `FRONTEND_URL` (production frontend URL)
- Firebase production credentials

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please contact the development team or create an issue in the repository.
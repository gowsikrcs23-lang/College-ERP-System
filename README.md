# College ERP System

A comprehensive full-stack College ERP (Enterprise Resource Planning) system built with React.js, Node.js, Express.js, and MongoDB.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system access
- **Faculty**: Attendance, marks, timetable management
- **Student**: View attendance, results, fees
- **Accountant**: Fee management

### Core Modules
1. **User Authentication** - JWT-based secure authentication
2. **Student Management** - Complete CRUD operations
3. **Faculty Management** - Faculty profiles and management
4. **Attendance Management** - Mark and track attendance
5. **Examination & Results** - Exam creation and result management
6. **Fee Management** - Fee tracking and payment processing
7. **Timetable Management** - Class scheduling
8. **Notifications** - System-wide announcements
9. **Report Generation** - Various reports and analytics

## 🛠️ Tech Stack

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **CORS** for cross-origin requests

## 📁 Project Structure

```
college-erp-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── facultyController.js
│   │   ├── attendanceController.js
│   │   ├── examController.js
│   │   ├── feeController.js
│   │   ├── timetableController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Attendance.js
│   │   ├── Exam.js
│   │   ├── Fee.js
│   │   ├── Timetable.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── faculty.js
│   │   ├── attendance.js
│   │   ├── exams.js
│   │   ├── fees.js
│   │   ├── timetables.js
│   │   └── notifications.js
│   ├── utils/
│   │   └── seedData.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Students.jsx
    │   │   └── Attendance.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd college-erp-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/college_erp
   JWT_SECRET=your_jwt_secret_key_here_make_it_strong
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

5. **Database Setup**
   
   Make sure MongoDB is running, then seed the database:
   ```bash
   cd backend
   npm run seed
   ```

6. **Start the Application**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 👥 Demo Credentials

After running the seed script, use these credentials to login:

- **Admin**: admin@college.edu / admin123
- **Faculty**: john.smith@college.edu / faculty123
- **Student**: alice.johnson@student.college.edu / student123
- **Accountant**: accountant@college.edu / accountant123

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Faculty
- `GET /api/faculty` - Get all faculty
- `POST /api/faculty` - Create faculty
- `GET /api/faculty/:id` - Get faculty by ID
- `PUT /api/faculty/:id` - Update faculty
- `DELETE /api/faculty/:id` - Delete faculty

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/class` - Get class attendance
- `PUT /api/attendance/:id` - Update attendance

### Exams
- `POST /api/exams` - Create exam
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam by ID
- `POST /api/exams/:examId/results` - Add exam results
- `GET /api/exams/student/:studentId/results` - Get student results

### Fees
- `POST /api/fees` - Create fee record
- `GET /api/fees` - Get all fees
- `GET /api/fees/student/:studentId` - Get student fees
- `POST /api/fees/:feeId/payment` - Make payment
- `PUT /api/fees/:id/status` - Update fee status

### Timetables
- `POST /api/timetables` - Create timetable
- `GET /api/timetables` - Get timetables
- `GET /api/timetables/:id` - Get timetable by ID
- `PUT /api/timetables/:id` - Update timetable
- `DELETE /api/timetables/:id` - Delete timetable

### Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/:id` - Get notification by ID
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Environment variable configuration

## 🎨 UI Features

- Responsive design with Tailwind CSS
- Role-based navigation
- Interactive dashboards
- Form validation
- Toast notifications
- Loading states
- Modern icons with Lucide React

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use a cloud MongoDB service
2. Update environment variables for production
3. Deploy to services like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to services like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- Some advanced features are placeholder implementations
- File upload functionality not implemented
- Email notifications not configured
- Advanced reporting features pending

## 🔮 Future Enhancements

- File upload for documents
- Email notification system
- Advanced reporting and analytics
- Mobile app development
- Integration with external systems
- Backup and restore functionality

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for educational purposes**
## Deployment Notes

This repository is configured for a split deployment:

- Backend on Render
- Frontend on Vercel

### Render Backend

Use the included `render.yaml`.

Required Render environment variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

Optional:

```env
JWT_EXPIRE=7d
NODE_ENV=production
```

### Vercel Frontend

Use the included `vercel.json`.

Required Vercel environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Example env files are included in:

- `backend/.env.example`
- `frontend/.env.example`

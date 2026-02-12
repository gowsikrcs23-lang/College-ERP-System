# College ERP System - API Routes Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Required
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🔐 Authentication Routes

### POST /auth/login
Login user and get JWT token
```json
{
  "email": "admin@college.edu",
  "password": "admin123"
}
```

### POST /auth/register
Register new user (Admin only)
```json
{
  "email": "user@college.edu",
  "password": "password123",
  "role": "student|faculty|admin|accountant",
  "profileData": {
    // Student or Faculty specific data
  }
}
```

### GET /auth/profile
Get current user profile (Requires Auth)

---

## 👥 Students Routes

### GET /students
Get all students (Admin, Faculty only)

### GET /students/:id
Get student by ID

### GET /students/department/:department
Get students by department (Admin, Faculty only)

### POST /students
Create new student (Admin only)
```json
{
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@student.college.edu",
  "password": "password123",
  "phone": "1234567890",
  "dateOfBirth": "2002-01-15",
  "department": "Computer Science",
  "semester": 3,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  }
}
```

### PUT /students/:id
Update student (Admin only)

### DELETE /students/:id
Delete student (Admin only)

---

## 👨‍🏫 Faculty Routes

### GET /faculty
Get all faculty (Admin only)

### GET /faculty/:id
Get faculty by ID

### POST /faculty
Create new faculty (Admin only)
```json
{
  "facultyId": "FAC001",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@college.edu",
  "password": "password123",
  "phone": "1234567890",
  "department": "Computer Science",
  "designation": "Professor",
  "qualification": "PhD in Computer Science",
  "experience": 10,
  "subjects": ["Data Structures", "Algorithms"]
}
```

### PUT /faculty/:id
Update faculty (Admin only)

### DELETE /faculty/:id
Delete faculty (Admin only)

---

## 📅 Attendance Routes

### POST /attendance/mark
Mark attendance (Faculty only)
```json
{
  "students": [
    {
      "studentId": "student_object_id",
      "status": "present|absent|late"
    }
  ],
  "subject": "Data Structures",
  "date": "2024-01-15",
  "semester": 3,
  "department": "Computer Science"
}
```

### GET /attendance/student/:studentId
Get student attendance
Query params: `subject`, `semester`

### GET /attendance/class
Get class attendance (Faculty, Admin only)
Query params: `department`, `semester`, `subject`, `date`

### PUT /attendance/:id
Update attendance record (Faculty only)
```json
{
  "status": "present|absent|late"
}
```

---

## 📝 Exams Routes

### POST /exams
Create exam (Faculty, Admin only)
```json
{
  "examName": "Mid Term Exam",
  "subject": "Data Structures",
  "department": "Computer Science",
  "semester": 3,
  "examDate": "2024-02-15T10:00:00Z",
  "duration": 180,
  "totalMarks": 100
}
```

### GET /exams
Get all exams
Query params: `department`, `semester`

### GET /exams/:id
Get exam by ID

### POST /exams/:examId/results
Add exam results (Faculty only)
```json
{
  "results": [
    {
      "student": "student_object_id",
      "marksObtained": 85
    }
  ]
}
```

### GET /exams/student/:studentId/results
Get student results
Query params: `semester`

---

## 💰 Fees Routes

### POST /fees
Create fee record (Admin, Accountant only)
```json
{
  "student": "student_object_id",
  "semester": 3,
  "academicYear": "2024-25",
  "tuitionFee": 50000,
  "libraryFee": 2000,
  "labFee": 5000,
  "otherFees": 1000,
  "dueDate": "2024-03-31"
}
```

### GET /fees
Get all fees (Admin, Accountant only)
Query params: `status`, `semester`

### GET /fees/student/:studentId
Get student fees

### GET /fees/:id
Get fee by ID

### POST /fees/:feeId/payment
Make payment (Accountant, Admin only)
```json
{
  "amount": 25000,
  "paymentMethod": "cash|card|online",
  "transactionId": "TXN123456"
}
```

### PUT /fees/:id/status
Update fee status (Admin, Accountant only)
```json
{
  "status": "pending|partial|paid|overdue"
}
```

---

## 🕐 Timetables Routes

### POST /timetables
Create timetable (Admin only)
```json
{
  "department": "Computer Science",
  "semester": 3,
  "academicYear": "2024-25",
  "schedule": [
    {
      "day": "Monday",
      "periods": [
        {
          "startTime": "09:00",
          "endTime": "10:00",
          "subject": "Data Structures",
          "faculty": "faculty_object_id",
          "room": "CS-101",
          "type": "lecture"
        }
      ]
    }
  ]
}
```

### GET /timetables
Get timetables
Query params: `department`, `semester`

### GET /timetables/:id
Get timetable by ID

### PUT /timetables/:id
Update timetable (Admin only)

### DELETE /timetables/:id
Delete timetable (Admin only)

---

## 🔔 Notifications Routes

### POST /notifications
Create notification (Admin only)
```json
{
  "title": "Important Notice",
  "message": "Classes will be suspended tomorrow due to maintenance.",
  "type": "general|academic|fee|exam|attendance",
  "targetAudience": "all|students|faculty|department",
  "department": "Computer Science",
  "semester": 3,
  "expiryDate": "2024-02-01"
}
```

### GET /notifications
Get notifications
Query params: `type`, `targetAudience`, `department`

### GET /notifications/:id
Get notification by ID

### PUT /notifications/:id
Update notification (Admin only)

### DELETE /notifications/:id
Delete notification (Admin only)

---

## 📊 Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🔒 Role-Based Access

| Route | Admin | Faculty | Student | Accountant |
|-------|-------|---------|---------|------------|
| Students CRUD | ✅ | ❌ | ❌ | ❌ |
| Faculty CRUD | ✅ | ❌ | ❌ | ❌ |
| Mark Attendance | ❌ | ✅ | ❌ | ❌ |
| View Attendance | ✅ | ✅ | ✅ (own) | ❌ |
| Manage Exams | ✅ | ✅ | ❌ | ❌ |
| View Results | ✅ | ✅ | ✅ (own) | ❌ |
| Manage Fees | ✅ | ❌ | ❌ | ✅ |
| View Fees | ✅ | ❌ | ✅ (own) | ✅ |
| Manage Timetables | ✅ | ❌ | ❌ | ❌ |
| View Timetables | ✅ | ✅ | ✅ | ✅ |
| Manage Notifications | ✅ | ❌ | ❌ | ❌ |
| View Notifications | ✅ | ✅ | ✅ | ✅ |

---

## 📝 Notes

1. All dates should be in ISO 8601 format
2. ObjectIds should be valid MongoDB ObjectIds
3. Passwords are automatically hashed before storage
4. JWT tokens expire based on JWT_EXPIRE environment variable
5. All endpoints return appropriate HTTP status codes
6. Input validation is performed on all POST/PUT requests
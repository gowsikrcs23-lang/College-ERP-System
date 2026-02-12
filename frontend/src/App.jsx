import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Faculty from './pages/Faculty';
import Attendance from './pages/Attendance';
import Admissions from './pages/Admissions';
import ExamSchedule from './pages/ExamSchedule';
import Timetables from './pages/Timetables';
import Notifications from './pages/Notifications';
import Results from './pages/Results';
import Reports from './pages/Reports';

import Fees from './pages/Fees';

// Placeholder components for other pages
const Exams = () => <div className="p-6"><h1 className="text-2xl font-bold">Exams & Results</h1><p>Exam management functionality will be implemented here.</p></div>;
const Unauthorized = () => <div className="p-6"><h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1><p>You don't have permission to access this page.</p></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/students" element={
              <ProtectedRoute allowedRoles={['admin', 'hod']}>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Layout>
                  <StudentProfile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/faculty" element={
              <ProtectedRoute allowedRoles={['admin', 'hod']}>
                <Layout>
                  <Faculty />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admissions" element={
              <ProtectedRoute allowedRoles={['admission', 'admin']}>
                <Layout>
                  <Admissions />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/exams" element={
              <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                <Layout>
                  <Exams />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/exam-schedule" element={
              <ProtectedRoute>
                <Layout>
                  <ExamSchedule />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/results" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}>
                <Layout>
                  <Results />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'hod', 'faculty']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/fees" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'accountant', 'faculty']}>
                <Layout>
                  <Fees />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/timetables" element={
              <ProtectedRoute>
                <Layout>
                  <Timetables />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
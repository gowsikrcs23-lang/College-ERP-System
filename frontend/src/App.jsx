import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GraduationCap, Sparkles } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import ViewStudent from './pages/ViewStudent';
import Faculty from './pages/Faculty';
import Attendance from './pages/Attendance';
import Admissions from './pages/Admissions';
import ExamSchedule from './pages/ExamSchedule';
import Timetables from './pages/Timetables';
import Results from './pages/Results';
import Reports from './pages/Reports';
import MailUnblock from './pages/MailUnblock';
import Notifications from './pages/Notifications';

import Fees from './pages/Fees';

// Placeholder components for other pages
const Exams = () => <div className="p-6"><h1 className="text-2xl font-bold">Exams & Results</h1><p>Exam management functionality will be implemented here.</p></div>;
const Unauthorized = () => <div className="p-6"><h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1><p>You don't have permission to access this page.</p></div>;

function App() {
  const [showStartupLoader, setShowStartupLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupLoader(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showStartupLoader) {
    return (
      <div className="startup-loader">
        <div className="startup-loader__panel">
          <div className="startup-loader__orbit" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="startup-loader__badge">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="startup-loader__title">College ERP</h1>
          <p className="startup-loader__text">Loading your workspace...</p>
          <div className="startup-loader__track" aria-hidden="true">
            <div className="startup-loader__track-line"></div>
            <div className="startup-loader__track-runner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App app-shell">
          <Toaster position="top-right" />
          <div className="app-shell__content">
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
                <ProtectedRoute allowedRoles={['admin', 'management', 'hod', 'faculty']}>
                  <Layout>
                    <Students />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'management', 'faculty', 'accountant', 'hod']}>
                  <Layout>
                    <StudentProfile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/students/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'management', 'faculty', 'accountant', 'hod']}>
                  <Layout>
                    <ViewStudent />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/faculty" element={
                <ProtectedRoute allowedRoles={['admin', 'management', 'hod']}>
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
                <ProtectedRoute allowedRoles={['admission', 'admin', 'management']}>
                  <Layout>
                    <Admissions />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/exams" element={
                <ProtectedRoute allowedRoles={['admin', 'management', 'faculty']}>
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
                <ProtectedRoute allowedRoles={['student', 'admin', 'management', 'faculty']}>
                  <Layout>
                    <Results />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'management', 'hod', 'faculty']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/fees" element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'management', 'accountant', 'faculty']}>
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

              <Route path="/mail-unblock" element={
                <ProtectedRoute allowedRoles={['management', 'faculty']}>
                  <Layout>
                    <MailUnblock />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'management', 'faculty', 'accountant', 'admission', 'hod']}>
                  <Layout>
                    <Notifications />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          <footer className="global-credit-bar" aria-label="Credits">
            <div className="global-credit-bar__text">
              <span className="global-credit-bar__icon" aria-hidden="true">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="global-credit-bar__copy">
                This College ERP System was designed and developed by Gowsik R in 2026. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

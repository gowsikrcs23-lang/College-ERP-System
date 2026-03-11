import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-primary-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-3 shadow-lg animate-bounce">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 animate-pulse">
            College ERP
          </h2>
          <p className="text-xs text-gray-600 animate-fade-in">
            Academic Portal
          </p>
          
          {/* Study Icons Animation */}
          <div className="flex justify-center space-x-4 mt-3 mb-3">
            <div className="animate-bounce" style={{animationDelay: '0s'}}>
              📚
            </div>
            <div className="animate-bounce" style={{animationDelay: '0.2s'}}>
              🎓
            </div>
            <div className="animate-bounce" style={{animationDelay: '0.4s'}}>
              📝
            </div>
          </div>
        </div>
        
        <div className="card-main p-4">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white text-sm"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white text-sm"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                New student?{' '}
                <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Apply for Admission
                </a>
              </p>
            </div>
          </form>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-700 mb-2">🌟 Welcome</p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">👨💼 Admin:</span>
                  <span className="font-mono">Your Gateway to Academic Excellence</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">🚀 Manage • Learn • Succeed:</span>
                  <span className="font-mono">Excellence in Education</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


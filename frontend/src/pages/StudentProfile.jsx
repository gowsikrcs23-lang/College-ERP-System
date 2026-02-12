import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, MapPin, BookOpen, GraduationCap, Edit } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    department: '',
    semester: '',
    bio: {
      fullName: '',
      registrationNumber: '',
      fatherName: '',
      motherName: '',
      guardianContact: '',
      emergencyContact: ''
    }
  });

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const response = await axios.get(`/api/students/${user.profile._id}`);
      setStudent(response.data);
      setFormData({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phone: response.data.phone,
        dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
        address: response.data.address || { street: '', city: '', state: '', zipCode: '' },
        department: response.data.department,
        semester: response.data.semester,
        bio: response.data.bio || {
          fullName: '',
          registrationNumber: '',
          fatherName: '',
          motherName: '',
          guardianContact: '',
          emergencyContact: ''
        }
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/students/${user.profile._id}`, formData);
      toast.success('Profile updated successfully');
      fetchStudentProfile();
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-blue-100">View your personal information</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
            >
              <Edit className="h-5 w-5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-gray-600 mt-1">Student ID: {student.studentId}</p>
              {student.fn && <p className="text-gray-600">FN: {student.fn}</p>}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{student.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{student.phone}</p>
                </div>
              </div>

              {student.dateOfBirth && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium text-gray-900">
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {student.address && (student.address.street || student.address.city) && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">
                      {student.address.street && `${student.address.street}, `}
                      {student.address.city && `${student.address.city}, `}
                      {student.address.state && `${student.address.state} `}
                      {student.address.zipCode}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                Academic Information
              </h3>

              <div className="flex items-start">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{student.department}</p>
                </div>
              </div>

              <div className="flex items-start">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="font-medium text-gray-900">Semester {student.semester}</p>
                </div>
              </div>

              {student.admissionDate && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Admission Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(student.admissionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        {student.bio && Object.values(student.bio).some(val => val) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.bio.fullName && (
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium text-gray-900">{student.bio.fullName}</p>
                </div>
              )}
              {student.bio.registrationNumber && (
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium text-gray-900">{student.bio.registrationNumber}</p>
                </div>
              )}
              {student.bio.fatherName && (
                <div>
                  <p className="text-sm text-gray-600">Father's Name</p>
                  <p className="font-medium text-gray-900">{student.bio.fatherName}</p>
                </div>
              )}
              {student.bio.motherName && (
                <div>
                  <p className="text-sm text-gray-600">Mother's Name</p>
                  <p className="font-medium text-gray-900">{student.bio.motherName}</p>
                </div>
              )}
              {student.bio.guardianContact && (
                <div>
                  <p className="text-sm text-gray-600">Guardian Contact</p>
                  <p className="font-medium text-gray-900">{student.bio.guardianContact}</p>
                </div>
              )}
              {student.bio.emergencyContact && (
                <div>
                  <p className="text-sm text-gray-600">Emergency Contact</p>
                  <p className="font-medium text-gray-900">{student.bio.emergencyContact}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal - Admin Only */}
      {showEditModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
              <h3 className="text-xl font-bold">Edit Student Profile</h3>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    maxLength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    className="input-field"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Street"
                    className="input-field col-span-2"
                    value={formData.address.street}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    className="input-field"
                    value={formData.address.city}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    className="input-field"
                    value={formData.address.state}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className="input-field"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Bio Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" className="input-field" value={formData.bio.fullName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, fullName: e.target.value}})} />
                  <input type="text" placeholder="Registration Number" className="input-field" value={formData.bio.registrationNumber} onChange={(e) => setFormData({...formData, bio: {...formData.bio, registrationNumber: e.target.value}})} />
                  <input type="text" placeholder="Father's Name" className="input-field" value={formData.bio.fatherName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, fatherName: e.target.value}})} />
                  <input type="text" placeholder="Mother's Name" className="input-field" value={formData.bio.motherName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, motherName: e.target.value}})} />
                  <input type="text" placeholder="Guardian Contact" className="input-field" maxLength="10" pattern="[0-9]{10}" value={formData.bio.guardianContact} onChange={(e) => setFormData({...formData, bio: {...formData.bio, guardianContact: e.target.value}})} />
                  <input type="text" placeholder="Emergency Contact" className="input-field" maxLength="10" pattern="[0-9]{10}" value={formData.bio.emergencyContact} onChange={(e) => setFormData({...formData, bio: {...formData.bio, emergencyContact: e.target.value}})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
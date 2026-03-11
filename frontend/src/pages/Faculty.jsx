import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { facultyAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    department: '',
    designation: '',
    qualification: '',
    joiningDate: '',
    subjects: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculty(response.data);
    } catch (error) {
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await facultyAPI.update(editingFaculty._id, formData);
        toast.success('Faculty updated successfully');
      } else {
        await facultyAPI.create(formData);
        toast.success('Faculty created successfully');
      }
      fetchFaculty();
      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await facultyAPI.delete(id);
        toast.success('Faculty deleted successfully');
        fetchFaculty();
      } catch (error) {
        toast.error('Failed to delete faculty');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      department: '',
      designation: '',
      qualification: '',
      joiningDate: '',
      subjects: [],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
    setEditingFaculty(null);
  };

  const openEditModal = (facultyMember) => {
    setEditingFaculty(facultyMember);
    setFormData({
      firstName: facultyMember.firstName,
      lastName: facultyMember.lastName,
      email: facultyMember.email,
      password: '',
      phone: facultyMember.phone,
      dateOfBirth: facultyMember.dateOfBirth?.split('T')[0] || '',
      department: facultyMember.department,
      designation: facultyMember.designation,
      qualification: facultyMember.qualification || '',
      joiningDate: facultyMember.joiningDate?.split('T')[0] || '',
      subjects: facultyMember.subjects || [],
      address: facultyMember.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
    setShowModal(true);
  };

  const filteredFaculty = faculty.filter(facultyMember =>
    facultyMember.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facultyMember.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facultyMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facultyMember.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Faculty
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search faculty..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Faculty Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFaculty.map((facultyMember) => (
                <tr key={facultyMember._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facultyMember.firstName} {facultyMember.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(facultyMember)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(facultyMember._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-primary-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Form Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="input-field text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        className="input-field text-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        maxLength="10"
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                  </div>

                  {/* Password for new faculty */}
                  {!editingFaculty && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          className="input-field text-sm"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="input-field text-sm"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Department and Designation */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                      <select
                        className="input-field text-sm"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Computer Science">CS</option>
                        <option value="Electronics">EE</option>
                        <option value="Mechanical">ME</option>
                        <option value="Civil">CE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                      <select
                        className="input-field text-sm"
                        value={formData.designation}
                        onChange={(e) => setFormData({...formData, designation: e.target.value})}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Guest Lecturer">Guest Lecturer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Qualification</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                        placeholder="e.g. M.Tech, PhD"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        className="input-field text-sm"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        required
                      />
                    </div>
                    {editingFaculty && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="input-field text-sm"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Address Row */}
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">Address Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Street</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={formData.address.street}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={formData.address.city}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={formData.address.state}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      {editingFaculty ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;

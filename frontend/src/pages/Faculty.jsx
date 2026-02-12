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
    facultyId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    department: '',
    designation: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    subjects: ''
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
    if (window.confirm('Are you sure you want to delete this faculty?')) {
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
      facultyId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      department: '',
      designation: '',
      qualification: '',
      experience: '',
      joiningDate: '',
      subjects: ''
    });
    setEditingFaculty(null);
  };

  const openEditModal = (facultyMember) => {
    setEditingFaculty(facultyMember);
    setFormData({
      facultyId: facultyMember.facultyId,
      firstName: facultyMember.firstName,
      lastName: facultyMember.lastName,
      email: facultyMember.email,
      password: '',
      phone: facultyMember.phone,
      dateOfBirth: facultyMember.dateOfBirth ? new Date(facultyMember.dateOfBirth).toISOString().split('T')[0] : '',
      gender: facultyMember.gender || '',
      address: facultyMember.address || { street: '', city: '', state: '', zipCode: '' },
      department: facultyMember.department,
      designation: facultyMember.designation,
      qualification: facultyMember.qualification,
      experience: facultyMember.experience,
      joiningDate: facultyMember.joiningDate ? new Date(facultyMember.joiningDate).toISOString().split('T')[0] : '',
      subjects: Array.isArray(facultyMember.subjects) ? facultyMember.subjects.join(', ') : ''
    });
    setShowModal(true);
  };

  const filteredFaculty = faculty.filter(f =>
    f.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.facultyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                  Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
                      <div className="text-sm text-gray-500">{facultyMember.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.facultyId}
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
          <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Faculty ID *"
                    className="input-field"
                    value={formData.facultyId}
                    onChange={(e) => setFormData({...formData, facultyId: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="First Name *"
                    className="input-field"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    className="input-field"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  {!editingFaculty && (
                    <input
                      type="password"
                      placeholder="Password *"
                      className="input-field"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  )}
                  <input
                    type="tel"
                    placeholder="Phone *"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    className="input-field"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                  <select
                    className="input-field"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
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
                <h4 className="font-semibold text-gray-700 mb-2">Professional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  >
                    <option value="">Select Department *</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Designation *"
                    className="input-field"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Qualification *"
                    className="input-field"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Experience (years) *"
                    className="input-field"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Joining Date"
                    className="input-field"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Subjects (comma separated)"
                    className="input-field"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
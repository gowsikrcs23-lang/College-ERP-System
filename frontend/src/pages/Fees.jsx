import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, Plus, Search, Eye, Trash2 } from 'lucide-react';

const Fees = () => {
  const { user } = useAuth();

  if (user?.role === 'accountant') {
    return <AccountantFeesView />;
  }

  if (user?.role === 'management' || user?.role === 'faculty') {
    return <ViewOnlyFeesView />;
  }

  if (user?.role === 'student') {
    return <StudentFeesView />;
  }

  return null;
};

const AccountantFeesView = () => {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFee, setExpandedFee] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    semester: '',
    academicYear: '',
    tuitionFee: '',
    libraryFee: '',
    labFee: '',
    otherFees: '',
    dueDate: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchFees();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchFees = async () => {
    try {
      const response = await axios.get('/api/fees');
      setFees(response.data);
    } catch (error) {
      toast.error('Failed to fetch fees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/fees', formData);
      toast.success('Fee record created successfully');
      setShowModal(false);
      resetForm();
      fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create fee record');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/fees/${selectedFee._id}/payment`, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', paymentMethod: 'cash', transactionId: '' });
      fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const resetForm = () => {
    setFormData({
      student: '',
      semester: '',
      academicYear: '',
      tuitionFee: '',
      libraryFee: '',
      labFee: '',
      otherFees: '',
      dueDate: ''
    });
  };

  const filteredFees = fees.filter(fee =>
    fee.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Fee Record
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by student name or ID..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFees.map((fee) => (
                <>
                  <tr key={fee._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fee.student?.firstName} {fee.student?.lastName}</div>
                    <div className="text-sm text-gray-500">{fee.student?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.semester}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{fee.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{fee.paidAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{fee.dueAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                      fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setExpandedFee(expandedFee === fee._id ? null : fee._id)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      {expandedFee === fee._id ? 'Hide' : 'View'}
                    </button>
                    {fee.status !== 'paid' && (
                      <button
                        onClick={() => {
                          setSelectedFee(fee);
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Add Payment
                      </button>
                    )}
                  </td>
                </tr>
                {expandedFee === fee._id && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                          <div>
                            <p className="text-xs text-gray-600">Tuition Fee</p>
                            <p className="text-sm font-semibold text-gray-900">₹{fee.tuitionFee}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Library Fee</p>
                            <p className="text-sm font-semibold text-gray-900">₹{fee.libraryFee}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Lab Fee</p>
                            <p className="text-sm font-semibold text-gray-900">₹{fee.labFee}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Other Fees</p>
                            <p className="text-sm font-semibold text-gray-900">₹{fee.otherFees}</p>
                          </div>
                        </div>
                        {fee.payments.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h4>
                            <div className="space-y-2">
                              {fee.payments.map((payment, index) => (
                                <div key={index} className="flex justify-between text-sm bg-white p-2 rounded">
                                  <span className="text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMethod}</span>
                                  <span className="font-semibold text-green-600">₹{payment.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Fee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md rounded-md border bg-white p-5 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Fee Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="input-field" value={formData.student} onChange={(e) => setFormData({...formData, student: e.target.value})} required>
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select className="input-field" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} required>
                  <option value="">Semester</option>
                  {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                </select>
                <select className="input-field" value={formData.academicYear} onChange={(e) => setFormData({...formData, academicYear: e.target.value})} required>
                  <option value="">Academic Year</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>
              <input type="number" placeholder="Tuition Fee" className="input-field" value={formData.tuitionFee} onChange={(e) => setFormData({...formData, tuitionFee: e.target.value})} required />
              <input type="number" placeholder="Library Fee" className="input-field" value={formData.libraryFee} onChange={(e) => setFormData({...formData, libraryFee: e.target.value})} />
              <input type="number" placeholder="Lab Fee" className="input-field" value={formData.labFee} onChange={(e) => setFormData({...formData, labFee: e.target.value})} />
              <input type="number" placeholder="Other Fees" className="input-field" value={formData.otherFees} onChange={(e) => setFormData({...formData, otherFees: e.target.value})} />
              <input type="date" className="input-field" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md rounded-md border bg-white p-5 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Due Amount: ₹{selectedFee.dueAmount}</p>
            <form onSubmit={handlePayment} className="space-y-4">
              <input type="number" placeholder="Payment Amount" className="input-field" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} max={selectedFee.dueAmount} required />
              <select className="input-field" value={paymentData.paymentMethod} onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})} required>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              <input type="text" placeholder="Transaction ID (optional)" className="input-field" value={paymentData.transactionId} onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewOnlyFeesView = () => {
  const [fees, setFees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedFee, setExpandedFee] = useState(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axios.get('/api/fees');
      setFees(response.data);
    } catch (error) {
      toast.error('Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = fees.filter(fee =>
    fee.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">View Fee Records</h1>
        <DollarSign className="h-6 w-6 text-primary-600" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by student name or ID..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFees.map((fee) => (
                <>
                  <tr key={fee._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{fee.student?.firstName} {fee.student?.lastName}</div>
                      <div className="text-sm text-gray-500">{fee.student?.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.student?.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{fee.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{fee.paidAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{fee.dueAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                        fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setExpandedFee(expandedFee === fee._id ? null : fee._id)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {expandedFee === fee._id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedFee === fee._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                            <div>
                              <p className="text-xs text-gray-600">Tuition Fee</p>
                              <p className="text-sm font-semibold text-gray-900">₹{fee.tuitionFee}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Library Fee</p>
                              <p className="text-sm font-semibold text-gray-900">₹{fee.libraryFee}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Lab Fee</p>
                              <p className="text-sm font-semibold text-gray-900">₹{fee.labFee}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Other Fees</p>
                              <p className="text-sm font-semibold text-gray-900">₹{fee.otherFees}</p>
                            </div>
                          </div>
                          {fee.payments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h4>
                              <div className="space-y-2">
                                {fee.payments.map((payment, index) => (
                                  <div key={index} className="flex justify-between text-sm bg-white p-2 rounded">
                                    <span className="text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMethod}</span>
                                    <span className="font-semibold text-green-600">₹{payment.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StudentFeesView = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axios.get(`/api/fees/student/${user.profile._id}`);
      setFees(response.data);
    } catch (error) {
      toast.error('Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Fee Records</h1>
        <DollarSign className="h-6 w-6 text-primary-600" />
      </div>

      {fees.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <div key={fee._id} className="card">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Semester {fee.semester}</h3>
                  <p className="text-sm text-gray-600">{fee.academicYear}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                  fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {fee.status}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">₹{fee.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-lg font-semibold text-green-600">₹{fee.paidAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Amount</p>
                  <p className="text-lg font-semibold text-red-600">₹{fee.dueAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(fee.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              {fee.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h4>
                  <div className="space-y-2">
                    {fee.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMethod}</span>
                        <span className="font-semibold text-green-600">₹{payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Fees;

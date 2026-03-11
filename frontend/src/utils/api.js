import axios from 'axios';

const API_BASE_URL = '/api';

// Students API
export const studentsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/students`),
  getById: (id) => axios.get(`${API_BASE_URL}/students/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/students`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/students/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/students/${id}`),
  getByDepartment: (department) => axios.get(`${API_BASE_URL}/students/department/${department}`),
  blockMail: (id, data) => axios.put(`${API_BASE_URL}/students/${id}/block-mail`, data),
  approveUnblock: (id) => axios.put(`${API_BASE_URL}/students/${id}/approve-unblock`),
  unblockMail: (id) => axios.put(`${API_BASE_URL}/students/${id}/unblock-mail`),
  clearMailBlockCount: (id) => axios.put(`${API_BASE_URL}/students/${id}/clear-mail-block-count`)
};

// Faculty API
export const facultyAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/faculty`),
  getById: (id) => axios.get(`${API_BASE_URL}/faculty/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/faculty`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/faculty/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/faculty/${id}`)
};

// Attendance API
export const attendanceAPI = {
  mark: (data) => axios.post(`${API_BASE_URL}/attendance/mark`, data),
  getByStudent: (studentId, params) => axios.get(`${API_BASE_URL}/attendance/student/${studentId}`, { params }),
  getByClass: (params) => axios.get(`${API_BASE_URL}/attendance/class`, { params }),
  getStats: (params) => axios.get(`${API_BASE_URL}/attendance/stats`, { params }),
  update: (id, data) => axios.put(`${API_BASE_URL}/attendance/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/attendance/${id}`)
};

// Exams API
export const examsAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/exams`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/exams`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/exams/${id}`),
  addResults: (examId, data) => axios.post(`${API_BASE_URL}/exams/${examId}/results`, data),
  getStudentResults: (studentId, params) => axios.get(`${API_BASE_URL}/exams/student/${studentId}/results`, { params }),
  getResults: (params) => axios.get(`${API_BASE_URL}/results`, { params }),
  getByStudent: (studentId) => axios.get(`${API_BASE_URL}/results/student/${studentId}`)
};

// Fees API
export const feesAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/fees`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/fees`, { params }),
  getByStudent: (studentId) => axios.get(`${API_BASE_URL}/fees/student/${studentId}`),
  getById: (id) => axios.get(`${API_BASE_URL}/fees/${id}`),
  makePayment: (feeId, data) => axios.post(`${API_BASE_URL}/fees/${feeId}/payment`, data),
  updateStatus: (id, data) => axios.put(`${API_BASE_URL}/fees/${id}/status`, data)
};

// Timetables API
export const timetablesAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/timetables`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/timetables`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/timetables/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/timetables/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/timetables/${id}`)
};

// Notifications API
export const notificationsAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/notifications`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/notifications`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/notifications/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/notifications/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/notifications/${id}`)
};

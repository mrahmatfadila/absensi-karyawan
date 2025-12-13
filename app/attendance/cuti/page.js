"use client";

import { useState, useEffect } from 'react';
import { Calendar, Send, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CutiPage() {
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [cutiList, setCutiList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sisaCuti, setSisaCuti] = useState(12);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCutiList();
    }
  }, [user]);

  const fetchCutiList = async () => {
    try {
      const response = await fetch(`/api/leave?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setCutiList(data);
        
        // Hitung sisa cuti (12 - jumlah cuti yang disetujui tahun ini)
        const approvedLeaves = data.filter(leave => 
          leave.status === 'approved' && 
          new Date(leave.start_date).getFullYear() === new Date().getFullYear()
        );
        
        let totalDays = 0;
        approvedLeaves.forEach(leave => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          totalDays += days;
        });
        
        setSisaCuti(12 - totalDays);
      }
    } catch (error) {
      console.error('Error fetching leave list:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User tidak ditemukan');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          ...formData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success('Pengajuan cuti berhasil dikirim!');
        
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: ''
          });
          fetchCutiList();
        }, 2000);
      } else {
        toast.error(data.error || 'Gagal mengajukan cuti');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      console.error('Error submitting leave:', error);
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Disetujui';
      case 'pending': return 'Pending';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const getLeaveTypeText = (type) => {
    switch(type) {
      case 'annual': return 'Cuti Tahunan';
      case 'sick': return 'Cuti Sakit';
      case 'urgent': return 'Cuti Mendesak';
      case 'maternity': return 'Cuti Melahirkan';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} hari`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pengajuan Cuti</h1>
          <p className="text-gray-600">Ajukan permohonan cuti Anda di sini</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Form Pengajuan Cuti</h2>
              </div>

              {submitted && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-800">Pengajuan cuti berhasil dikirim!</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Cuti *
                  </label>
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jenis Cuti</option>
                    <option value="annual">Cuti Tahunan</option>
                    <option value="sick">Cuti Sakit</option>
                    <option value="urgent">Cuti Mendesak</option>
                    <option value="maternity">Cuti Melahirkan</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Cuti *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Jelaskan alasan pengajuan cuti Anda..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="font-medium">Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="font-medium">Ajukan Cuti</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sisa Kuota Cuti</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cuti Tahunan</span>
                  <span className="font-bold text-indigo-600 text-xl">{sisaCuti} hari</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${(sisaCuti / 12) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Pengajuan</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cutiList.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Belum ada pengajuan cuti
                  </p>
                ) : (
                  cutiList.slice(0, 5).map((cuti) => (
                    <div key={cuti.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">
                          {getLeaveTypeText(cuti.leave_type)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cuti.status)}`}>
                          {getStatusText(cuti.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(cuti.start_date)} - {formatDate(cuti.end_date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateDuration(cuti.start_date, cuti.end_date)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Informasi Penting</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ajukan cuti minimal 3 hari sebelumnya</li>
                    <li>• Cuti sakit wajib melampirkan surat dokter</li>
                    <li>• Maksimal cuti 14 hari berturut-turut</li>
                    <li>• Kuota cuti tahunan: 12 hari</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
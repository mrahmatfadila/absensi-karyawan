'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
  FiUser
} from 'react-icons/fi';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchAttendance();
  }, [dateRange]);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance?start=${dateRange.start}&end=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Tepat Waktu';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      case 'leave': return 'Cuti';
      default: return status;
    }
  };

  // Filter attendance based on user role
  const displayedAttendance = user?.role === 'admin' 
    ? attendance 
    : attendance.filter(att => att.user_id === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Absensi</h1>
      <p className="text-gray-600 mb-8">
        {user?.role === 'admin' ? 'Manajemen absensi semua karyawan' : 'Riwayat absensi Anda'}
      </p>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <FiFilter className="mr-2" />
              Terapkan Filter
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateRange({
              start: format(new Date(), 'yyyy-MM-dd'),
              end: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Hari Ini
          </button>
          <button
            onClick={() => setDateRange({
              start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
              end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Bulan Ini
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 7);
              setDateRange({
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd')
              });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            7 Hari Terakhir
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Karyawan
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durasi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedAttendance.length > 0 ? (
                displayedAttendance.map((att) => {
                  const checkIn = att.check_in ? new Date(att.check_in) : null;
                  const checkOut = att.check_out ? new Date(att.check_out) : null;
                  let duration = '-';
                  
                  if (checkIn && checkOut) {
                    const diffMs = checkOut - checkIn;
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    duration = `${diffHrs}j ${diffMins}m`;
                  }

                  return (
                    <tr key={att.id} className="hover:bg-gray-50">
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiUser className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{att.user_name}</div>
                              <div className="text-sm text-gray-500">{att.employee_id}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checkIn ? format(checkIn, 'dd/MM/yyyy', { locale: id }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checkIn ? format(checkIn, 'HH:mm') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checkOut ? format(checkOut, 'HH:mm') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(att.status)}`}>
                          {getStatusText(att.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {duration}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td 
                    colSpan={user?.role === 'admin' ? 6 : 5} 
                    className="px-6 py-12 text-center"
                  >
                    <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Tidak ada data absensi
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user?.role === 'admin' 
                        ? 'Tidak ada data absensi untuk periode yang dipilih'
                        : 'Anda belum memiliki riwayat absensi'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      {displayedAttendance.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Hari</span>
                <span className="font-semibold">{displayedAttendance.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tepat Waktu</span>
                <span className="font-semibold text-green-600">
                  {displayedAttendance.filter(a => a.status === 'present').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terlambat</span>
                <span className="font-semibold text-yellow-600">
                  {displayedAttendance.filter(a => a.status === 'late').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Kehadiran</span>
                  <span className="text-sm font-medium">
                    {displayedAttendance.length > 0 
                      ? `${Math.round((displayedAttendance.filter(a => a.status === 'present').length / displayedAttendance.length) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: displayedAttendance.length > 0 
                        ? `${Math.round((displayedAttendance.filter(a => a.status === 'present').length / displayedAttendance.length) * 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi</h3>
            <div className="space-y-3">
              <button
                onClick={fetchAttendance}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" />
                Refresh Data
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin/attendance')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Lihat Laporan Lengkap
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
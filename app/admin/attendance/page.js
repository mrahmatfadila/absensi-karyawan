'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiCalendar, 
  FiDownload, 
  FiFilter, 
  FiSearch,
  FiEye,
  FiEdit,
  FiTrash2,
  FiBarChart2
} from 'react-icons/fi';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AttendanceReport() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchAttendance();
  }, [dateRange]);

  useEffect(() => {
    filterAttendance();
  }, [search, attendance]);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/');
      }
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance?start=${dateRange.start}&end=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
        setFilteredAttendance(data);
        
        // Calculate stats
        const present = data.filter(a => a.status === 'present').length;
        const late = data.filter(a => a.status === 'late').length;
        const absent = data.filter(a => a.status === 'absent').length;
        
        setStats({
          total: data.length,
          present,
          late,
          absent
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    if (!search.trim()) {
      setFilteredAttendance(attendance);
      return;
    }

    const filtered = attendance.filter(att =>
      att.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      att.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      att.status?.toLowerCase().includes(search.toLowerCase())
    );
    
    setFilteredAttendance(filtered);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = () => {
    toast.success('Fitur export akan segera tersedia');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Absensi</h1>
            <p className="text-gray-600 mt-2">Monitoring dan analisis kehadiran karyawan</p>
          </div>
          
          <button
            onClick={handleExport}
            className="btn-primary flex items-center mt-4 sm:mt-0"
          >
            <FiDownload className="mr-2" />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Absensi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCalendar className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tepat Waktu</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.present}</p>
              <p className="text-green-600 text-sm mt-1">
                {stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCalendar className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Terlambat</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.late}</p>
              <p className="text-yellow-600 text-sm mt-1">
                {stats.total > 0 ? `${Math.round((stats.late / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiCalendar className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tidak Hadir</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.absent}</p>
              <p className="text-red-600 text-sm mt-1">
                {stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiCalendar className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              className="input-primary"
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
              className="input-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="btn-primary w-full flex items-center justify-center"
            >
              <FiFilter className="mr-2" />
              Terapkan Filter
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
              start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
              end: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            7 Hari Terakhir
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
            onClick={() => setDateRange({
              start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
              end: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durasi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((att) => {
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {checkIn ? format(checkIn, 'dd MMM yyyy', { locale: id }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-800 font-medium">
                            {att.user_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{att.user_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{att.employee_id}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toast.info('Fitur detail akan segera tersedia')}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => toast.info('Fitur edit akan segera tersedia')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <FiEdit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredAttendance.length === 0 && (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data absensi</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Tidak ditemukan hasil pencarian' : 'Tidak ada data untuk periode yang dipilih'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
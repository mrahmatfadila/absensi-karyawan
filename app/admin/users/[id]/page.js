'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiCalendar, 
  FiClock,
  FiEdit, 
  FiArrowLeft,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiHash
} from 'react-icons/fi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const [user, setUser] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceRate: '0%'
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  // Handle role change
  const handleRoleChange = (newRoleId) => {
    setEditingRole(newRoleId);
  };

  // Save role changes
  const handleRoleSave = async () => {
    if (!editingRole || editingRole === (user.role_id || (user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3'))) {
      toast.info('Tidak ada perubahan role');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengubah role ${user.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: parseInt(editingRole) }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Role berhasil diubah');
        fetchUserData(); // Refresh data
        setEditingRole(null);
      } else {
        toast.error(data.error || 'Gagal mengubah role');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  // Get role select color
  const getRoleSelectColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-700';
      case 'manager': return 'text-blue-700';
      case 'employee': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  // Set editing role when user data loads
  useEffect(() => {
    if (user) {
      setEditingRole(user.role_id || (user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3'));
    }
  }, [user]);

  // Fetch user data on mount
  useEffect(() => {
    if (userId) {
      fetchUserData();
    } else {
      setError('User ID tidak ditemukan');
      setLoading(false);
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user data for ID:', userId);
      
      // Fetch user data
      const userResponse = await fetch(`/api/users/${userId}`);
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Gagal memuat data pengguna');
      }
      
      const userData = await userResponse.json();
      setUser(userData);
      
      // Fetch attendance stats
      try {
        const statsResponse = await fetch(`/api/attendance/stats?user_id=${userId}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setAttendanceStats(statsData);
        }
      } catch (statsError) {
        console.log('Stats error, using defaults:', statsError);
      }
      
      // Fetch recent attendance
      try {
        const attendanceResponse = await fetch(`/api/attendance?user_id=${userId}&limit=5`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setRecentAttendance(attendanceData);
        }
      } catch (attError) {
        console.log('Attendance fetch error:', attError);
      }
      
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/users/${userId}/edit`);
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

  const getRoleBadgeColor = (role) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Memuat data pengguna...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Kembali ke Daftar Pengguna
        </button>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Pengguna tidak ditemukan'}
          </h2>
          <p className="text-gray-600 mb-6">
            User ID: {userId}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/users')}
              className="btn-primary"
            >
              Kembali ke Daftar Pengguna
            </button>
            <button
              onClick={fetchUserData}
              className="btn-secondary ml-3"
            >
              Coba Lagi
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <p className="font-medium text-yellow-800 mb-2">Troubleshooting:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-yellow-700">
              <li>Pastikan user dengan ID {userId} ada di database</li>
              <li>Check console browser (F12) untuk detail error</li>
              <li>Pastikan API endpoint /api/users/{userId} berjalan</li>
              <li>Check koneksi database MySQL</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <FiArrowLeft className="mr-2" />
              Kembali ke Daftar Pengguna
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Detail Pengguna
            </h1>
            <p className="text-gray-600 mt-2">
              Informasi lengkap dan statistik karyawan
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center"
            >
              <FiEdit className="mr-2" />
              Edit Pengguna
            </button>
          </div>
        </div>
      </div>

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile Card */}
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ID: {user.employee_id}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-sm text-gray-600">Bergabung</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.hire_date ? format(new Date(user.hire_date), 'dd MMMM yyyy', { locale: id }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Role Warning Messages */}
                  {user.role === 'admin' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ User ini adalah Administrator
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Administrator memiliki akses penuh ke semua fitur sistem.
                      </p>
                    </div>
                  )}

                  {user.role === 'manager' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        📊 User ini adalah Manager
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Manager dapat mengelola tim dan melihat laporan.
                      </p>
                    </div>
                  )}

                  {/* Role Editor */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Pengguna
                    </label>
                    <div className="flex items-center space-x-4">
                      <select
                        value={editingRole || (user.role_id || (user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3'))}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className={`px-4 py-2 rounded-lg border ${
                          user.role === 'admin' ? 'border-red-300 bg-red-50' :
                          user.role === 'manager' ? 'border-blue-300 bg-blue-50' :
                          'border-green-300 bg-green-50'
                        } ${getRoleSelectColor(user.role)} font-medium`}
                      >
                        <option value="1">Administrator</option>
                        <option value="2">Manager</option>
                        <option value="3">Employee</option>
                      </select>
                      
                      <button
                        onClick={handleRoleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Simpan Role
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <FiMail className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FiBriefcase className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Posisi</p>
                        <p className="font-medium text-gray-900">{user.position || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <FiBriefcase className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Departemen</p>
                        <p className="font-medium text-gray-900">{user.department || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                        <FiCalendar className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Masa Kerja</p>
                        <p className="font-medium text-gray-900">
                          {user.hire_date ? 
                            `${Math.floor((new Date() - new Date(user.hire_date)) / (1000 * 60 * 60 * 24 * 30))} bulan` 
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Absensi</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceStats.total}</p>
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
                    <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceStats.present}</p>
                    <p className="text-green-600 text-sm mt-1">
                      {attendanceStats.total > 0 ? 
                        `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiCheckCircle className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Terlambat</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceStats.late}</p>
                    <p className="text-yellow-600 text-sm mt-1">
                      {attendanceStats.total > 0 ? 
                        `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <FiAlertCircle className="text-yellow-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Rate Kehadiran</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceStats.attendanceRate}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FiBarChart2 className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Riwayat Absensi Terbaru</h2>
                <button
                  onClick={() => router.push(`/admin/attendance?user_id=${userId}`)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              
              {recentAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-in
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-out
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentAttendance.map((att, index) => {
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
                          <tr key={att.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {checkIn ? format(checkIn, 'dd/MM/yyyy', { locale: id }) : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {checkIn ? format(checkIn, 'HH:mm') : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {checkOut ? format(checkOut, 'HH:mm') : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(att.status)}`}>
                                {getStatusText(att.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {duration}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data absensi</h3>
                  <p className="mt-1 text-sm text-gray-500">Tidak ada riwayat absensi untuk pengguna ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/attendance?user_id=${userId}`)}
                  className="w-full btn-secondary text-left py-3 flex items-center"
                >
                  <FiCalendar className="mr-2" />
                  Lihat Absensi Lengkap
                </button>
                <button
                  onClick={() => toast.success('Fitur laporan akan segera tersedia')}
                  className="w-full btn-primary py-3 flex items-center"
                >
                  <FiBarChart2 className="mr-2" />
                  Generate Laporan
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full btn-secondary text-left py-3 flex items-center"
                >
                  <FiEdit className="mr-2" />
                  Edit Profil
                </button>
              </div>
            </div>

            {/* User Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pengguna</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ID Karyawan</p>
                  <p className="font-medium text-gray-900">{user.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departemen</p>
                  <p className="font-medium text-gray-900">{user.department || 'Tidak ditentukan'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Posisi</p>
                  <p className="font-medium text-gray-900">{user.position || 'Tidak ditentukan'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Bergabung</p>
                  <p className="font-medium text-gray-900">
                    {user.hire_date ? format(new Date(user.hire_date), 'dd MMMM yyyy', { locale: id }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
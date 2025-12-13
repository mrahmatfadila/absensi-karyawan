'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import { 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiClock, 
  FiTrendingUp,
  FiAlertCircle,
  FiBarChart2,
  FiLogIn,
  FiLogOut,
  FiUserCheck,
  FiActivity,
  FiHome
} from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Home() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    onLeave: 0,
    departments: 0,
    avgCheckIn: '08:00',
    attendanceRate: '0%'
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Redirect berdasarkan role
      if (parsedUser.role === 'employee') {
        router.push('/attendance/absensi');
      }
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch semua data sekaligus
      const [statsRes, activityRes, weeklyRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-activity'),
        fetch('/api/dashboard/weekly-data')
      ]);

      if (statsRes.ok && activityRes.ok && weeklyRes.ok) {
        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        const weeklyData = await weeklyRes.json();
        
        console.log('📊 Stats data:', statsData);
        console.log('📈 Activity data:', activityData);
        console.log('📅 Weekly data:', weeklyData);
        
        if (statsData.success) {
          setStats(statsData.data);
        }
        
        if (activityData.success) {
          setRecentActivity(activityData.data);
        }
        
        if (weeklyData.success) {
          setWeeklyData(weeklyData.data);
        }
        
      } else {
        toast.error('Gagal memuat data dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Chart data untuk weekly attendance
  const weeklyChartData = {
    labels: weeklyData.labels || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Kehadiran (%)',
        data: weeklyData.data || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Format waktu
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'check-in': return 'bg-blue-100 text-blue-800';
      case 'check-out': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      case 'check-in': return 'Check-in';
      case 'check-out': return 'Check-out';
      default: return status;
    }
  };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'employee': return 'Karyawan';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Selamat Datang, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <div className="mt-2 flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                user?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getRoleDisplay(user?.role)}
              </span>
              {user?.department && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {user.department}
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all flex items-center"
                >
                  <FiUsers className="mr-2" />
                  Kelola Karyawan
                </button>
                <button
                  onClick={() => router.push('/admin/attendance')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all flex items-center"
                >
                  <FiBarChart2 className="mr-2" />
                  Laporan
                </button>
              </>
            )}
            
            {user?.role === 'manager' && (
              <>
                <button
                  onClick={() => router.push('/manager/team')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all flex items-center"
                >
                  <FiUsers className="mr-2" />
                  Tim Saya
                </button>
                <button
                  onClick={() => router.push('/manager/reports')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all flex items-center"
                >
                  <FiBarChart2 className="mr-2" />
                  Laporan
                </button>
              </>
            )}
            
            <button
              onClick={() => router.push('/attendance/absensi')}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 font-medium transition-all flex items-center"
            >
              <FiHome className="mr-2" />
              Absensi
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <DashboardCard
          title="Total Karyawan"
          value={stats.totalEmployees}
          icon={<FiUsers className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={`${stats.departments} departemen`}
          trend={{ 
            type: 'info', 
            value: `↑ ${stats.totalEmployees} orang` 
          }}
        />
        <DashboardCard
          title="Hadir Hari Ini"
          value={stats.presentToday}
          icon={<FiUserCheck className="text-2xl text-white" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle={`${stats.attendanceRate} dari target`}
          trend={{ 
            type: stats.presentToday > 0 ? 'up' : 'down', 
            value: `${stats.attendanceRate}` 
          }}
        />
        <DashboardCard
          title="Terlambat"
          value={stats.lateToday}
          icon={<FiAlertCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          subtitle="hari ini"
          trend={{ 
            type: stats.lateToday > 0 ? 'warning' : 'info', 
            value: `${stats.lateToday} orang` 
          }}
        />
        <DashboardCard
          title="Tidak Hadir"
          value={stats.absentToday}
          icon={<FiCalendar className="text-2xl text-white" />}
          color="bg-gradient-to-r from-red-500 to-red-600"
          subtitle="hari ini"
        />
        <DashboardCard
          title="Cuti Pending"
          value={stats.onLeave}
          icon={<FiClock className="text-2xl text-white" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="perlu persetujuan"
        />
        <DashboardCard
          title="Rata Check-in"
          value={stats.avgCheckIn}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="waktu masuk"
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Attendance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Kehadiran Mingguan</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Minggu ini</option>
              <option>Minggu lalu</option>
            </select>
          </div>
          <div className="h-64">
            <Line 
              data={weeklyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.parsed.y}% kehadiran`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                    title: {
                      display: true,
                      text: 'Persentase Kehadiran'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Hari'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Rata-rata minggu ini: <span className="font-semibold">
              {weeklyData.data && weeklyData.data.length > 0 ? 
                Math.round(weeklyData.data.reduce((a, b) => a + b, 0) / weeklyData.data.length) : 0}%
            </span></p>
            <p className="mt-1">Total karyawan: <span className="font-semibold">{stats.totalEmployees}</span></p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h2>
            <button 
              onClick={() => router.push('/attendance/riwayat')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'check_in' ? 'bg-blue-100' :
                      activity.type === 'check_out' ? 'bg-purple-100' :
                      activity.status === 'present' ? 'bg-green-100' :
                      activity.status === 'late' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'check_in' ? (
                        <FiLogIn className="text-blue-600" />
                      ) : activity.type === 'check_out' ? (
                        <FiLogOut className="text-purple-600" />
                      ) : activity.status === 'present' ? (
                        <FiCheckCircle className="text-green-600" />
                      ) : activity.status === 'late' ? (
                        <FiAlertCircle className="text-yellow-600" />
                      ) : (
                        <FiClock className="text-gray-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{activity.user_name || 'Unknown'}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{activity.employee_id || ''}</span>
                        {activity.department && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {activity.department}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.type === 'check_in' ? 'Check-in' : 
                         activity.type === 'check_out' ? 'Check-out' : 
                         'Absensi'} • {formatTime(activity.time)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    getStatusColor(activity.status || activity.type)
                  }`}>
                    {getStatusText(activity.status || activity.type)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">Belum ada aktivitas hari ini</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-600">Aktivitas hari ini:</span>
                <span className="font-semibold ml-2">{recentActivity.length} aktivitas</span>
              </div>
              <div className="text-right">
                <span className="text-gray-600">Terakhir update:</span>
                <span className="font-semibold ml-2">{new Date().toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistik Hari Ini</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tingkat Kehadiran</span>
                <span className="text-sm font-bold text-gray-900">{stats.attendanceRate}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${parseInt(stats.attendanceRate) || 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.presentToday} dari {stats.totalEmployees} karyawan hadir
              </p>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tingkat Keterlambatan</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalEmployees > 0 ? 
                    Math.round((stats.lateToday / stats.totalEmployees) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalEmployees > 0 ? 
                      Math.round((stats.lateToday / stats.totalEmployees) * 100) : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.lateToday} karyawan terlambat hari ini
              </p>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cuti Pending</span>
                <span className="text-sm font-bold text-gray-900">{stats.onLeave}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalEmployees > 0 ? 
                      Math.round((stats.onLeave / stats.totalEmployees) * 100) : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.onLeave} pengajuan cuti menunggu persetujuan
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/attendance/absensi')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all"
            >
              <FiLogIn className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Check-in/out</span>
            </button>
            
            <button
              onClick={() => router.push('/attendance/cuti')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all"
            >
              <FiCalendar className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Ajukan Cuti</span>
            </button>
            
            <button
              onClick={() => router.push('/attendance/riwayat')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all"
            >
              <FiBarChart2 className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Riwayat</span>
            </button>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/users')}
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 transition-all"
              >
                <FiUsers className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-sm font-medium text-red-900">Kelola User</span>
              </button>
            )}
            
            {user?.role === 'manager' && (
              <button
                onClick={() => router.push('/manager/team')}
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all"
              >
                <FiUsers className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">Tim Saya</span>
              </button>
            )}
            
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all"
            >
              <FiLogOut className="h-8 w-8 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Keluar</span>
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Informasi Sistem</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Versi:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="font-medium">NeonDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Data:</span>
                <span className="font-medium">{stats.totalEmployees + stats.onLeave}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
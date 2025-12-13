'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import { 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiClock, 
  FiTrendingUp,
  FiAlertCircle,
  FiActivity,
  FiFileText,
  FiRefreshCw
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    onLeave: 0,
    departments: 0,
    avgAttendance: '0%',
    totalAttendance: 0,
    attendanceRate: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState({
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    data: [0, 0, 0, 0, 0, 0, 0]
  });
  const [monthlyTrend, setMonthlyTrend] = useState({
    labels: [],
    data: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== 'admin') {
        router.push('/');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {  
      const response = await fetch('/api/admin/stats');     
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        toast.error(`Gagal memuat data: ${errorMessage}`);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const { stats, departmentStats, recentAttendance, weeklyData, monthlyTrend } = result.data;
        
        setStats(stats);
        setDepartmentStats(departmentStats);
        setRecentAttendance(recentAttendance);
        setWeeklyData(weeklyData);
        setMonthlyTrend(monthlyTrend);
      } else {
        console.error('API returned unsuccessful:', result);
        toast.error(result.error || 'Gagal memuat data dashboard');
      }
    } catch (error) {
      console.error('Network error fetching dashboard:', error);
      toast.error('Koneksi jaringan bermasalah');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper functions
  const getRoleString = (roleId) => {
    switch(roleId) {
      case 1: return 'admin';
      case 2: return 'manager';
      case 3: return 'employee';
      default: return 'unknown';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'late': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      case 'absent': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'present': return 'Tepat waktu';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      default: return status;
    }
  };

  // Chart configurations
  const weeklyChartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Persentase Kehadiran',
        data: weeklyData.data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const departmentChartData = {
    labels: departmentStats.map(dept => dept.name),
    datasets: [
      {
        data: departmentStats.map(dept => dept.total),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const monthlyChartData = {
    labels: monthlyTrend.labels,
    datasets: [
      {
        label: 'Rata-rata Kehadiran',
        data: monthlyTrend.data,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Format numbers
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
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
              Dashboard Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.name || 'Admin'} • {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memuat...' : 'Refresh'}
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 font-medium transition-all flex items-center"
            >
              <FiUsers className="mr-2" />
              Kelola Karyawan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <DashboardCard
          title="Total Karyawan"
          value={formatNumber(stats.totalEmployees)}
          icon={<FiUsers className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={`${stats.departments} departemen`}
        />
        <DashboardCard
          title="Hadir Hari Ini"
          value={formatNumber(stats.presentToday)}
          icon={<FiCheckCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle={`${stats.attendanceRate}% hadir`}
          trend={{ 
            type: stats.attendanceRate > 70 ? 'up' : stats.attendanceRate > 50 ? 'stable' : 'down', 
            value: `${stats.attendanceRate}%` 
          }}
        />
        <DashboardCard
          title="Terlambat"
          value={formatNumber(stats.lateToday)}
          icon={<FiClock className="text-2xl text-white" />}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          subtitle="hari ini"
        />
        <DashboardCard
          title="Cuti Pending"
          value={formatNumber(stats.onLeave)}
          icon={<FiCalendar className="text-2xl text-white" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="perlu persetujuan"
        />
        <DashboardCard
          title="Departemen"
          value={formatNumber(stats.departments)}
          icon={<FiActivity className="text-2xl text-white" />}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
          subtitle="aktif"
        />
        <DashboardCard
          title="Total Absensi"
          value={formatNumber(stats.totalAttendance)}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
          subtitle="hari ini"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Attendance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Kehadiran 7 Hari Terakhir</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Persentase</span>
              </div>
            </div>
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
              {weeklyData.data.length > 0 ? 
                Math.round(weeklyData.data.reduce((a, b) => a + b, 0) / weeklyData.data.length) : 0}%
            </span></p>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribusi Karyawan per Departemen</h2>
          <div className="h-64">
            <Doughnut
              data={departmentChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} karyawan (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {departmentStats.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 truncate mr-2">{dept.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-primary-600">{dept.total}</span>
                  <span className="text-xs text-gray-500">orang</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trend Kehadiran 6 Bulan Terakhir</h2>
          <div className="h-64">
            <Line 
              data={monthlyChartData}
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
                      text: 'Bulan'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Rata-rata 6 bulan: <span className="font-semibold text-green-600">
              {monthlyTrend.data.length > 0 ? 
                Math.round(monthlyTrend.data.reduce((a, b) => a + b, 0) / monthlyTrend.data.length) : 0}%
            </span></p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Absensi Terbaru Hari Ini</h2>
            <button 
              onClick={() => router.push('/admin/attendance')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              <FiFileText className="mr-1" />
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3">
            {recentAttendance.length > 0 ? (
              recentAttendance.map((att) => {
                const statusColors = getStatusColor(att.status);
                const roleString = getRoleString(att.role_id);
                
                return (
                  <div key={att.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${statusColors.bg}`}>
                        <FiCalendar className={statusColors.text} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{att.user_name || 'Unknown'}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{att.employee_id}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {roleString}
                          </span>
                          {att.department && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {att.department}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {att.check_in_time} • {att.check_out_time || 'Belum check-out'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                        {getStatusText(att.status)}
                      </span>
                      {att.location && (
                        <span className="text-xs text-gray-500 mt-1 truncate max-w-[120px]" title={att.location}>
                          📍 {att.location.substring(0, 20)}...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">Belum ada absensi hari ini</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tanggal: {new Date().toLocaleDateString('id-ID')}
                </p>
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
                <span className="text-gray-600">Total absensi hari ini:</span>
                <span className="font-semibold ml-2">{stats.totalAttendance} dari {stats.totalEmployees}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-600">Rata-rata:</span>
                <span className="font-semibold ml-2 text-green-600">{stats.avgAttendance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center">
            <FiAlertCircle className="text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">Pengajuan Cuti</h3>
              <p className="text-sm text-blue-700 mt-1">
                {stats.onLeave > 0 ? 
                  `${stats.onLeave} pengajuan cuti menunggu persetujuan` : 
                  'Tidak ada pengajuan cuti pending'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center">
            <FiTrendingUp className="text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">Statistik Kehadiran</h3>
              <p className="text-sm text-green-700 mt-1">
                Rata-rata kehadiran: {stats.avgAttendance} • Terlambat: {stats.lateToday} orang
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center">
            <FiUsers className="text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold text-purple-900">Distribusi Karyawan</h3>
              <p className="text-sm text-purple-700 mt-1">
                {stats.totalEmployees} karyawan di {stats.departments} departemen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
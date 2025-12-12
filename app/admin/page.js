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
  FiDollarSign,
  FiActivity
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
    avgAttendance: '0%'
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
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
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/');
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [usersRes, attendanceRes, departmentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/attendance?date=' + new Date().toISOString().split('T')[0]),
        fetch('/api/departments')
      ]);

      if (usersRes.ok && attendanceRes.ok && departmentsRes.ok) {
        const users = await usersRes.json();
        const attendance = await attendanceRes.json();
        const departments = await departmentsRes.json();
        
        const presentToday = attendance.filter(a => a.status === 'present').length;
        const lateToday = attendance.filter(a => a.status === 'late').length;
        
        setStats({
          totalEmployees: users.length,
          presentToday,
          lateToday,
          onLeave: Math.floor(users.length * 0.15),
          departments: departments.length,
          avgAttendance: `${Math.round((presentToday / users.length) * 100)}%`
        });

        // Set recent attendance
        setRecentAttendance(attendance.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Chart Data
  const attendanceData = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Kehadiran',
        data: [65, 78, 66, 79, 82, 45, 30],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const departmentDistribution = {
    labels: ['IT', 'HR', 'Finance', 'Marketing', 'Operations'],
    datasets: [
      {
        data: [25, 15, 20, 25, 15],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const monthlyTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
      {
        label: 'Rata-rata Kehadiran',
        data: [85, 78, 90, 88, 92, 95],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }
    ]
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Ringkasan dan statistik sistem absensi
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => router.push('/admin/users')}
              className="btn-primary"
            >
              Kelola Karyawan
            </button>
            <button
              onClick={() => router.push('/admin/attendance')}
              className="btn-secondary"
            >
              Laporan Absensi
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <DashboardCard
          title="Total Karyawan"
          value={stats.totalEmployees}
          icon={<FiUsers className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <DashboardCard
          title="Hadir Hari Ini"
          value={stats.presentToday}
          icon={<FiCheckCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend={{ type: 'up', value: '8' }}
        />
        <DashboardCard
          title="Terlambat"
          value={stats.lateToday}
          icon={<FiClock className="text-2xl text-white" />}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        <DashboardCard
          title="Sedang Cuti"
          value={stats.onLeave}
          icon={<FiCalendar className="text-2xl text-white" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <DashboardCard
          title="Departemen"
          value={stats.departments}
          icon={<FiActivity className="text-2xl text-white" />}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
        />
        <DashboardCard
          title="Rata-rata Hadir"
          value={stats.avgAttendance}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Attendance Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Kehadiran Mingguan</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Minggu ini</option>
              <option>Minggu lalu</option>
              <option>Bulan ini</option>
            </select>
          </div>
          <div className="h-64">
            <Line 
              data={attendanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
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
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribusi Departemen</h2>
          <div className="h-64">
            <Doughnut
              data={departmentDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      padding: 15
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trend Bulanan</h2>
          <div className="h-64">
            <Line 
              data={monthlyTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
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
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {recentAttendance.length > 0 ? (
              recentAttendance.map((att, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                      att.status === 'present' ? 'bg-green-100' :
                      att.status === 'late' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      <FiCalendar className={
                        att.status === 'present' ? 'text-green-600' :
                        att.status === 'late' ? 'text-yellow-600' :
                        'text-gray-600'
                      } />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{att.user_name}</p>
                      <p className="text-sm text-gray-600">
                        {att.check_in_time} - {att.check_out_time || 'Belum check-out'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    att.status === 'present' ? 'bg-green-100 text-green-800' :
                    att.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {att.status === 'present' ? 'Tepat waktu' : 
                     att.status === 'late' ? 'Terlambat' : 
                     att.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada aktivitas hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
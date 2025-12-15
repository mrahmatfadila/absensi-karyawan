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
  FiBarChart2,
  FiTarget,
  FiRefreshCw
} from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ManagerDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    lateToday: 0,
    onLeave: 0,
    productivity: '85%',
    avgAttendance: '92%'
  });
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: []
  });
  const [attendanceDistribution, setAttendanceDistribution] = useState({
    labels: [],
    datasets: []
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchChartsData();
    }
  }, [user]);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const user = JSON.parse(userData);
      setUser(user);
      if (user.role !== 'manager') {
        router.push('/');
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch team stats
      const statsRes = await fetch('/api/manager/stats');
      
      // Fetch today's attendance
      const todayRes = await fetch('/api/manager/today-attendance');

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          teamSize: statsData.teamSize || 0,
          presentToday: statsData.presentToday || 0,
          lateToday: statsData.lateToday || 0,
          onLeave: statsData.onLeave || 0,
          productivity: statsData.productivity || '85%',
          avgAttendance: statsData.avgAttendance || '92%'
        });
      }

      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTeamAttendance(todayData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartsData = async () => {
  try {
    setChartLoading(true);
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Fetch team performance data with user headers
    const performanceRes = await fetch('/api/manager/performance', {
      headers: {
        'user': JSON.stringify(userData)
      }
    });
    
    const distributionRes = await fetch('/api/manager/attendance-distribution', {
      headers: {
        'user': JSON.stringify(userData)
      }
    });

    if (performanceRes.ok) {
      const performanceData = await performanceRes.json();
      console.log('Performance chart data:', performanceData);
      setPerformanceData({
        labels: performanceData.labels || ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
        datasets: [{
          label: 'Produktivitas',
          data: performanceData.data || [78, 82, 85, 88],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        }]
      });
    }

    if (distributionRes.ok) {
      const distributionData = await distributionRes.json();
      console.log('Distribution chart data:', distributionData);
      setAttendanceDistribution({
        labels: distributionData.labels || ['Tepat Waktu', 'Terlambat', 'Cuti', 'Tidak Hadir'],
        datasets: [{
          data: distributionData.data || [75, 15, 8, 2],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderWidth: 1,
        }]
      });
    }

  } catch (error) {
    console.error('Error fetching charts data:', error);
    toast.error('Gagal memuat data chart');
  } finally {
    setChartLoading(false);
  }
};

  const refreshData = () => {
    fetchDashboardData();
    fetchChartsData();
    toast.success('Data diperbarui');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
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
              Dashboard Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.name}! Kelola dan pantau tim Anda
            </p>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="font-medium">Departemen ID:</span>
                <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                  {user?.department_id}
                </span>
              </span>
              <span className="flex items-center">
                <span className="font-medium">Email:</span>
                <span className="ml-1">{user?.email}</span>
              </span>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </button>
            <button
              onClick={() => router.push('/manager/team')}
              className="btn-primary"
            >
              Kelola Tim
            </button>
            <button
              onClick={() => router.push('/manager/reports')}
              className="btn-secondary"
            >
              Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Anggota Tim"
          value={stats.teamSize}
          icon={<FiUsers className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle="Total anggota dalam tim"
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
          title="Produktivitas"
          value={stats.productivity}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
          trend={{ type: 'up', value: '12' }}
        />
        <DashboardCard
          title="Rata-rata Kehadiran"
          value={stats.avgAttendance}
          icon={<FiTarget className="text-2xl text-white" />}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Team Performance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performa Tim (Bulan Ini)</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
              <option>3 Bulan Terakhir</option>
            </select>
          </div>
          <div className="h-64">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <Bar 
                data={performanceData}
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
            )}
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribusi Kehadiran (30 Hari)</h2>
          <div className="h-64">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <Doughnut
                data={attendanceDistribution}
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
            )}
          </div>
        </div>
      </div>
            {/* Team Attendance Today */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Kehadiran Tim Hari Ini</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Departemen ID: {user?.department_id} • Total: {teamAttendance.length} anggota
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/manager/reports')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Lihat Detail
                </button>
              </div>
              
              {teamAttendance.length > 0 ? (
                <div className="space-y-3">
                  {teamAttendance.map((member, index) => {
                    // Get status info
                    let statusConfig = {
                      present: { text: 'Tepat Waktu', color: 'text-green-800', bg: 'bg-green-100' },
                      late: { text: 'Terlambat', color: 'text-yellow-800', bg: 'bg-yellow-100' },
                      leave: { text: 'Cuti', color: 'text-blue-800', bg: 'bg-blue-100' },
                      not_checked: { text: 'Belum Check-in', color: 'text-gray-800', bg: 'bg-gray-100' },
                      absent: { text: 'Tidak Hadir', color: 'text-red-800', bg: 'bg-red-100' }
                    };
                    
                    const status = member.status || 'not_checked';
                    const statusInfo = statusConfig[status] || statusConfig.not_checked;
                    
                    return (
                      <div key={member.id || member.user_id || index} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-all">
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                            {member.user_name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{member.user_name || 'Anggota Tim'}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {member.employee_id || 'ID Tidak Tersedia'}
                                  </span>
                                  {member.position && (
                                    <span className="text-xs text-gray-500">
                                      {member.position}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-0 sm:text-right">
                                {member.check_in ? (
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatTime(member.check_in)} 
                                      {member.check_out && ` - ${formatTime(member.check_out)}`}
                                    </p>
                                    {!member.check_out && (
                                      <p className="text-xs text-yellow-600">Belum Check-out</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Belum check-in</p>
                                )}
                              </div>
                            </div>
                            {member.notes && (
                              <p className="text-xs text-gray-600 mt-2">{member.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-4">
                    <FiUsers className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data Kehadiran</h3>
                  <p className="text-gray-600 mb-6">
                    Belum ada anggota tim yang check-in hari ini atau tidak ada anggota dalam departemen Anda.
                  </p>
                  <div className="inline-block p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Departemen ID:</span>
                        <span className="font-bold text-blue-700">{user?.department_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Anggota dalam Statistik:</span>
                        <span className="font-bold">{stats.teamSize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={refreshData}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Coba muat ulang data
                    </button>
                  </div>
                </div>
              )}
            </div>
    </div>
  );
}
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
  FiTarget
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
      setUser(user);
      if (user.role !== 'manager') {
        router.push('/');
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setStats({
        teamSize: 15,
        presentToday: 12,
        lateToday: 2,
        onLeave: 1,
        productivity: '85%',
        avgAttendance: '92%'
      });

      setTeamAttendance([
        { name: 'Andi Setiawan', status: 'present', checkIn: '08:00', checkOut: '17:00' },
        { name: 'Budi Santoso', status: 'present', checkIn: '08:15', checkOut: '17:30' },
        { name: 'Citra Dewi', status: 'late', checkIn: '09:05', checkOut: '17:15' },
        { name: 'Dian Pratama', status: 'present', checkIn: '08:30', checkOut: '16:45' },
        { name: 'Eko Wijaya', status: 'leave', checkIn: '-', checkOut: '-' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Chart Data
  const teamPerformanceData = {
    labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
    datasets: [
      {
        label: 'Produktivitas',
        data: [78, 82, 85, 88],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      }
    ]
  };

  const attendanceDistribution = {
    labels: ['Tepat Waktu', 'Terlambat', 'Cuti', 'Tidak Hadir'],
    datasets: [
      {
        data: [75, 15, 8, 2],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 1,
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
              Dashboard Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.name}! Kelola dan pantau tim Anda
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
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
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performa Tim (Bulan Ini)</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
              <option>3 Bulan Terakhir</option>
            </select>
          </div>
          <div className="h-64">
            <Bar 
              data={teamPerformanceData}
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

        {/* Attendance Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribusi Kehadiran</h2>
          <div className="h-64">
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
          </div>
        </div>
      </div>

      {/* Team Attendance Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Kehadiran Tim Hari Ini</h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Lihat Detail
            </button>
          </div>
          <div className="space-y-4">
            {teamAttendance.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    member.status === 'present' ? 'bg-green-100' :
                    member.status === 'late' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <FiUsers className={
                      member.status === 'present' ? 'text-green-600' :
                      member.status === 'late' ? 'text-yellow-600' :
                      'text-blue-600'
                    } />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">
                      {member.checkIn} - {member.checkOut}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  member.status === 'present' ? 'bg-green-100 text-green-800' :
                  member.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {member.status === 'present' ? 'Tepat waktu' : 
                   member.status === 'late' ? 'Terlambat' : 
                   'Cuti'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary py-3">
                Approve Cuti
              </button>
              <button className="btn-primary py-3">
                Buat Laporan
              </button>
              <button className="btn-secondary py-3">
                Meeting Tim
              </button>
              <button className="btn-primary py-3">
                Evaluasi Kinerja
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifikasi</h3>
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">Persetujuan Cuti</p>
                <p className="text-sm text-yellow-700 mt-1">
                  2 permintaan cuti menunggu persetujuan Anda.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Meeting Besok</p>
                <p className="text-sm text-blue-700 mt-1">
                  Meeting evaluasi tim dijadwalkan besok pukul 10:00.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Laporan Selesai</p>
                <p className="text-sm text-green-700 mt-1">
                  Laporan kinerja bulanan sudah siap untuk di-review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
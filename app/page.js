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
  FiBarChart2 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Home() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    onLeave: 0,
    averageCheckIn: '08:15',
    productivity: '92%'
  });
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
      setUser(JSON.parse(userData));
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [usersRes, attendanceRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/attendance?date=' + new Date().toISOString().split('T')[0])
      ]);

      if (usersRes.ok && attendanceRes.ok) {
        const users = await usersRes.json();
        const attendance = await attendanceRes.json();
        
        const presentToday = attendance.filter(a => a.status === 'present').length;
        const lateToday = attendance.filter(a => a.status === 'late').length;
        
        setStats({
          totalEmployees: users.length,
          presentToday,
          lateToday,
          onLeave: Math.floor(users.length * 0.1), // Contoh
          averageCheckIn: '08:15',
          productivity: '92%'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'check_in' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Check-in berhasil!');
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Gagal check-in');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'check_out' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Check-out berhasil!');
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Gagal check-out');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Selamat Datang, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleCheckIn}
              className="btn-primary flex items-center"
            >
              <FiCheckCircle className="mr-2" />
              Check-in
            </button>
            <button
              onClick={handleCheckOut}
              className="btn-secondary flex items-center"
            >
              <FiClock className="mr-2" />
              Check-out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Karyawan"
          value={stats.totalEmployees}
          icon={<FiUsers className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={{ type: 'up', value: '12' }}
        />
        <DashboardCard
          title="Hadir Hari Ini"
          value={stats.presentToday}
          icon={<FiCheckCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <DashboardCard
          title="Terlambat"
          value={stats.lateToday}
          icon={<FiAlertCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        <DashboardCard
          title="Cuti"
          value={stats.onLeave}
          icon={<FiCalendar className="text-2xl text-white" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <DashboardCard
          title="Rata-rata Check-in"
          value={stats.averageCheckIn}
          icon={<FiClock className="text-2xl text-white" />}
          color="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="Waktu masuk rata-rata"
        />
        <DashboardCard
          title="Produktivitas"
          value={stats.productivity}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
          trend={{ type: 'up', value: '5' }}
        />
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {[
              { time: '08:00', user: 'Andi Setiawan', action: 'Check-in', status: 'Tepat waktu' },
              { time: '08:15', user: 'Budi Santoso', action: 'Check-in', status: 'Tepat waktu' },
              { time: '09:05', user: 'Citra Dewi', action: 'Check-in', status: 'Terlambat' },
              { time: '12:00', user: 'Dian Pratama', action: 'Istirahat', status: 'Normal' },
              { time: '17:00', user: 'Eko Wijaya', action: 'Check-out', status: 'Selesai' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiClock className="text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action} • {activity.time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'Tepat waktu' ? 'bg-green-100 text-green-800' :
                  activity.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistik Mingguan</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Kehadiran</span>
                <span className="text-sm font-bold text-gray-900">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Keterlambatan</span>
                <span className="text-sm font-bold text-gray-900">8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Produktivitas</span>
                <span className="text-sm font-bold text-gray-900">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary py-3">
                Ajukan Cuti
              </button>
              <button className="btn-primary py-3">
                Laporan
              </button>
              <button className="btn-secondary py-3">
                Pengaturan
              </button>
              <button className="btn-primary py-3">
                Profil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
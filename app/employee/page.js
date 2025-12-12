'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import { 
  FiCalendar, 
  FiCheckCircle, 
  FiClock, 
  FiTrendingUp,
  FiAlertCircle,
  FiBarChart2,
  FiUser,
  FiTarget
} from 'react-icons/fi';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    presentThisMonth: 0,
    lateThisMonth: 0,
    attendanceRate: '0%',
    averageCheckIn: '08:15',
    totalHours: '0',
    remainingLeave: 12
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
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
      if (user.role !== 'employee') {
        router.push('/');
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [attendanceRes] = await Promise.all([
        fetch('/api/attendance')
      ]);

      if (attendanceRes.ok) {
        const attendance = await attendanceRes.json();
        
        // Calculate monthly stats
        const currentMonth = format(new Date(), 'yyyy-MM');
        const monthAttendance = attendance.filter(a => 
          a.check_in && format(new Date(a.check_in), 'yyyy-MM') === currentMonth
        );
        
        const presentCount = monthAttendance.filter(a => a.status === 'present').length;
        const lateCount = monthAttendance.filter(a => a.status === 'late').length;
        
        // Get today's attendance
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayAtt = attendance.find(a => 
          a.check_in && format(new Date(a.check_in), 'yyyy-MM-dd') === today
        );
        
        // Calculate weekly attendance
        const weekStart = startOfWeek(new Date(), { locale: id });
        const weekEnd = endOfWeek(new Date(), { locale: id });
        const weekData = [];
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayAtt = attendance.find(a => 
            a.check_in && format(new Date(a.check_in), 'yyyy-MM-dd') === dateStr
          );
          
          weekData.push({
            day: format(date, 'EEE', { locale: id }),
            date: format(date, 'dd', { locale: id }),
            present: dayAtt ? (dayAtt.status === 'present' || dayAtt.status === 'late') : false,
            status: dayAtt?.status || 'absent'
          });
        }

        setStats({
          presentThisMonth: presentCount,
          lateThisMonth: lateCount,
          attendanceRate: monthAttendance.length > 0 
            ? `${Math.round((presentCount / monthAttendance.length) * 100)}%`
            : '0%',
          averageCheckIn: '08:15',
          totalHours: '168',
          remainingLeave: 12
        });

        setTodayAttendance(todayAtt);
        setWeeklyAttendance(weekData);
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
              Dashboard Karyawan
            </h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.name}! {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {!todayAttendance ? (
              <button
                onClick={handleCheckIn}
                className="btn-primary flex items-center"
              >
                <FiCheckCircle className="mr-2" />
                Check-in
              </button>
            ) : !todayAttendance.check_out ? (
              <button
                onClick={handleCheckOut}
                className="btn-secondary flex items-center"
              >
                <FiClock className="mr-2" />
                Check-out
              </button>
            ) : (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  Sudah check-out hari ini
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {todayAttendance && (
        <div className="mb-8">
          <div className={`p-6 rounded-xl border ${
            todayAttendance.status === 'present' 
              ? 'bg-green-50 border-green-200' 
              : todayAttendance.status === 'late'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Status Hari Ini</h3>
                <div className="mt-2 flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    todayAttendance.status === 'present' ? 'bg-green-500' :
                    todayAttendance.status === 'late' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <p className="text-gray-700">
                    {todayAttendance.status === 'present' ? 'Tepat waktu' :
                     todayAttendance.status === 'late' ? 'Terlambat' :
                     todayAttendance.status}
                  </p>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Check-in: {format(new Date(todayAttendance.check_in), 'HH:mm')}
                  {todayAttendance.check_out && ` • Check-out: ${format(new Date(todayAttendance.check_out), 'HH:mm')}`}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {todayAttendance.check_out ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total jam kerja hari ini</p>
                    <p className="text-2xl font-bold text-gray-900">8 jam 15 menit</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sudah bekerja selama</p>
                    <p className="text-2xl font-bold text-gray-900">4 jam 30 menit</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Hadir Bulan Ini"
          value={stats.presentThisMonth}
          icon={<FiCheckCircle className="text-2xl text-white" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle="Total kehadiran tepat waktu"
        />
        <DashboardCard
          title="Keterlambatan"
          value={stats.lateThisMonth}
          icon={<FiClock className="text-2xl text-white" />}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          subtitle="Bulan ini"
        />
        <DashboardCard
          title="Rate Kehadiran"
          value={stats.attendanceRate}
          icon={<FiTrendingUp className="text-2xl text-white" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={{ type: 'up', value: '5' }}
        />
        <DashboardCard
          title="Rata-rata Check-in"
          value={stats.averageCheckIn}
          icon={<FiTarget className="text-2xl text-white" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="Waktu masuk rata-rata"
        />
        <DashboardCard
          title="Total Jam Kerja"
          value={stats.totalHours}
          icon={<FiBarChart2 className="text-2xl text-white" />}
          color="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="Jam kerja bulan ini"
        />
        <DashboardCard
          title="Sisa Cuti"
          value={stats.remainingLeave}
          icon={<FiCalendar className="text-2xl text-white" />}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
          subtitle="Hari cuti tersisa"
        />
      </div>

      {/* Weekly Attendance */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Kehadiran Minggu Ini</h2>
        <div className="grid grid-cols-7 gap-2">
          {weeklyAttendance.map((day, index) => (
            <div key={index} className="text-center">
              <div className={`p-4 rounded-lg ${
                day.present
                  ? day.status === 'present'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="text-sm font-medium text-gray-900">{day.day}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{day.date}</p>
                <div className="mt-2">
                  <div className={`h-2 w-2 mx-auto rounded-full ${
                    day.present
                      ? day.status === 'present'
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}></div>
                  <p className="text-xs text-gray-600 mt-1">
                    {day.present
                      ? day.status === 'present'
                        ? 'Hadir'
                        : 'Terlambat'
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/attendance/history')}
              className="w-full btn-secondary text-left py-3"
            >
              Lihat Riwayat Absensi
            </button>
            <button
              onClick={() => router.push('/leave/request')}
              className="w-full btn-primary py-3"
            >
              Ajukan Cuti
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="w-full btn-secondary text-left py-3"
            >
              Edit Profil
            </button>
          </div>
        </div>

        <div className="card md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengumuman</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Pengumuman HRD</p>
              <p className="text-sm text-blue-700 mt-1">
                Meeting bulanan akan dilaksanakan pada Jumat, 15 Desember 2023 di Ruang Rapat Utama.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Libur Nasional</p>
              <p className="text-sm text-green-700 mt-1">
                Tanggal 25 Desember 2023 (Hari Natal) ditetapkan sebagai hari libur nasional.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900">Perubahan Jadwal</p>
              <p className="text-sm text-yellow-700 mt-1">
                Mulai minggu depan, jam kerja efektif dimulai pukul 08:00 WIB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
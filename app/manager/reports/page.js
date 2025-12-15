'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiDownload, 
  FiFilter, 
  FiSearch,
  FiCalendar,
  FiBarChart2,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiFileText,
  FiPrinter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ManagerReportsPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    averageAttendance: '0%',
    averageProductivity: '0%',
    totalLate: 0,
    totalAbsent: 0
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user, dateRange]);

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

  // Di bagian fetchReportsData, tambahkan query untuk mengambil data real
const fetchReportsData = async () => {
  try {
    setLoading(true);
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Fetching reports for user:', userData);

    // Fetch reports with type parameter
    const reportsRes = await fetch(
      `/api/manager/reports?start=${dateRange.start}&end=${dateRange.end}&type=${selectedReport}`,
      {
        headers: {
          'user': JSON.stringify(userData)
        }
      }
    );
    
    // Fetch stats
    const statsRes = await fetch(
      `/api/manager/reports/stats?start=${dateRange.start}&end=${dateRange.end}`,
      {
        headers: {
          'user': JSON.stringify(userData)
        }
      }
    );

    if (reportsRes.ok) {
      const reportsData = await reportsRes.json();
      console.log(`Loaded ${reportsData.length} ${selectedReport} reports`);
      setReports(reportsData);
    } else {
      const error = await reportsRes.json();
      console.error('Reports fetch failed:', error);
      toast.error('Gagal memuat laporan');
    }

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      console.log('Stats loaded:', statsData);
      setTeamStats({
        totalMembers: statsData.totalMembers || 0,
        averageAttendance: statsData.averageAttendance || '0%',
        averageProductivity: statsData.averageProductivity || '0%',
        totalLate: statsData.totalLate || 0,
        totalAbsent: statsData.totalAbsent || 0
      });
    } else {
      console.error('Stats fetch failed');
    }

  } catch (error) {
    console.error('Error fetching reports data:', error);
    toast.error('Gagal memuat data laporan');
  } finally {
    setLoading(false);
  }
};

  const handleDateRangeChange = (range) => {
    const today = new Date();
    let start, end;

    switch(range) {
      case 'today':
        start = end = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        end = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      default:
        start = dateRange.start;
        end = dateRange.end;
    }

    setDateRange({ start, end });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const handleExportReport = (format = 'pdf') => {
    toast.success(`Laporan diexport dalam format ${format.toUpperCase()}`);
    // In real implementation, this would generate and download the report
  };

  const refreshData = () => {
    fetchReportsData();
    toast.success('Data laporan diperbarui');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data laporan...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Tim</h1>
            <p className="text-gray-600 mt-2">
              Periode: {format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - {format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            <button
              onClick={() => handleExportReport('pdf')}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all"
            >
              <FiDownload className="mr-2" />
              Export Laporan
            </button>
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <button
              onClick={() => router.push('/manager')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap space-x-8">
            {['attendance', 'performance', 'productivity', 'leave'].map((report) => (
              <button
                key={report}
                onClick={() => setSelectedReport(report)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedReport === report
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {report === 'attendance' && 'Kehadiran'}
                {report === 'performance' && 'Kinerja'}
                {report === 'productivity' && 'Produktivitas'}
                {report === 'leave' && 'Cuti'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Anggota</p>
              <p className="text-3xl font-bold mt-2">{teamStats.totalMembers}</p>
            </div>
            <FiUsers className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Rata Kehadiran</p>
              <p className="text-3xl font-bold mt-2">{teamStats.averageAttendance}</p>
            </div>
            <FiCheckCircle className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Terlambat</p>
              <p className="text-3xl font-bold mt-2">{teamStats.totalLate}</p>
            </div>
            <FiClock className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Tidak Hadir</p>
              <p className="text-3xl font-bold mt-2">{teamStats.totalAbsent}</p>
            </div>
            <FiXCircle className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Rata Produktivitas</p>
              <p className="text-3xl font-bold mt-2">{teamStats.averageProductivity}</p>
            </div>
            <FiTrendingUp className="text-2xl opacity-90" />
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDateRangeChange('today')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleDateRangeChange('week')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Minggu Ini
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handleDateRangeChange('lastMonth')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Bulan Lalu
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden">
  <div className="p-6 border-b border-gray-200">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold text-gray-900">
        {selectedReport === 'attendance' && 'Laporan Kehadiran'}
        {selectedReport === 'performance' && 'Laporan Kinerja'}
        {selectedReport === 'productivity' && 'Laporan Produktivitas'}
        {selectedReport === 'leave' && 'Laporan Cuti'}
      </h2>
      <div className="mt-2 sm:mt-0 flex space-x-3">
        <div className="text-sm text-gray-600">
          Menampilkan data dari <span className="font-medium">{teamStats.totalMembers}</span> anggota tim
        </div>
        <button
          onClick={() => handleExportReport('pdf')}
          className="flex items-center px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
        >
          <FiPrinter className="mr-2" />
          Print
        </button>
      </div>
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Anggota Tim
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Departemen
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Posisi
          </th>
          {selectedReport === 'attendance' && (
            <>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hadir
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terlambat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tidak Hadir
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Presentase
              </th>
            </>
          )}
          {selectedReport === 'performance' && (
            <>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produktivitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </>
          )}
          {selectedReport === 'leave' && (
            <>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jenis Cuti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Periode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Detail
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {reports.length > 0 ? (
          reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                    {report.user_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.user_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {report.employee_id || '-'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{report.department || '-'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{report.position || '-'}</div>
              </td>
              
              {selectedReport === 'attendance' && (
                <>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-green-600">{report.present_days || 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-yellow-600">{report.late_days || 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-red-600">{report.absent_days || 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.attendance_rate >= 90 ? 'bg-green-100 text-green-800' :
                        report.attendance_rate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.attendance_rate || 0}%
                      </span>
                    </div>
                  </td>
                </>
              )}
              
              {selectedReport === 'performance' && (
                <>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {report.rating || '4.0'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.productivity_rate >= 90 ? 'bg-green-100 text-green-800' :
                        report.productivity_rate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.productivity_rate || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'good' ? 'bg-green-100 text-green-800' :
                      report.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'good' ? 'Baik' :
                       report.status === 'warning' ? 'Perhatian' : 'Perlu Perbaikan'}
                    </span>
                  </td>
                </>
              )}
              
              {selectedReport === 'leave' && (
                <>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.leave_type || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(report.start_date)} - {formatDate(report.end_date)}
                      <div className="text-xs text-gray-500">({report.duration} hari)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'approved' ? 'bg-green-100 text-green-800' :
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status_text || report.status || '-'}
                    </span>
                  </td>
                </>
              )}
              
              <td className="px-6 py-4">
                <button
                  onClick={() => toast.info(`Detail ${selectedReport} untuk ${report.user_name}`)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" className="px-6 py-12 text-center">
              <FiFileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada data laporan</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.department_id 
                  ? `Tidak ada data untuk departemen ${user?.department_id}`
                  : 'Tidak ada data laporan untuk periode yang dipilih'}
              </p>
              {user?.department_id && (
                <button
                  onClick={refreshData}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Coba Muat Ulang
                </button>
              )}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      {/* Summary Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Laporan</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Periode Laporan</span>
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(dateRange.start), 'dd/MM/yyyy')} - {format(new Date(dateRange.end), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Jenis Laporan</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedReport === 'attendance' && 'Kehadiran'}
                {selectedReport === 'performance' && 'Kinerja'}
                {selectedReport === 'productivity' && 'Produktivitas'}
                {selectedReport === 'leave' && 'Cuti'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Jumlah Data</span>
              <span className="text-sm font-medium text-gray-900">{reports.length} record</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Terakhir Diperbarui</span>
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insight & Rekomendasi</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Peningkatan Kehadiran</p>
              <p className="text-sm text-blue-700 mt-1">
                Rata-rata kehadiran tim Anda adalah {teamStats.averageAttendance}. Terus tingkatkan!
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Pencapaian Positif</p>
              <p className="text-sm text-green-700 mt-1">
                Produktivitas tim mencapai {teamStats.averageProductivity}. Pertahankan momentum ini!
              </p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900">Perhatian Khusus</p>
              <p className="text-sm text-yellow-700 mt-1">
                Terdapat {teamStats.totalLate} kali keterlambatan. Evaluasi dan berikan perhatian.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
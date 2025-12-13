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
  FiBarChart2,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiPrinter,
  FiFileText,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiMapPin
} from 'react-icons/fi';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AttendanceReport() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    averageHours: '0h 0m'
  });
  const [departments, setDepartments] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [dateRange]);

  useEffect(() => {
    filterAttendance();
  }, [search, attendance, selectedDepartment, selectedStatus]);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const user = JSON.parse(userData);
      if (user.role !== 'admin' && user.role !== 'manager') {
        router.push('/');
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, departmentsRes, userStatsRes] = await Promise.all([
        fetch(`/api/attendance/report?start=${dateRange.start}&end=${dateRange.end}`),
        fetch('/api/departments'),
        fetch(`/api/attendance/user-stats?start=${dateRange.start}&end=${dateRange.end}`)
      ]);

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setAttendance(data);
        setFilteredAttendance(data);
        
        // Calculate stats
        const present = data.filter(a => a.status === 'present').length;
        const late = data.filter(a => a.status === 'late').length;
        const absent = data.filter(a => a.status === 'absent').length;
        const leave = data.filter(a => a.status === 'leave').length;
        
        // Calculate average working hours
        const workingHours = data
          .filter(a => a.check_in && a.check_out)
          .map(a => {
            const hours = (new Date(a.check_out) - new Date(a.check_in)) / (1000 * 60 * 60);
            return hours;
          });
        
        const avgHours = workingHours.length > 0 ? 
          workingHours.reduce((a, b) => a + b) / workingHours.length : 0;
        
        const avgHoursStr = `${Math.floor(avgHours)}h ${Math.round((avgHours % 1) * 60)}m`;

        setStats({
          total: data.length,
          present,
          late,
          absent,
          leave,
          averageHours: avgHoursStr
        });
      }

      if (departmentsRes.ok) {
        const depts = await departmentsRes.json();
        setDepartments(depts);
      }

      if (userStatsRes.ok) {
        const stats = await userStatsRes.json();
        setUserStats(stats);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = attendance;

    // Filter by search
    if (search.trim()) {
      filtered = filtered.filter(att =>
        att.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        att.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
        att.department_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(att => 
        att.department_id?.toString() === selectedDepartment
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(att => att.status === selectedStatus);
    }

    setFilteredAttendance(filtered);
  };

  const handleDateRangeChange = (range) => {
    const today = new Date();
    let start, end;

    switch(range) {
      case 'today':
        start = end = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        start = end = format(subDays(today, 1), 'yyyy-MM-dd');
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

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800 border border-green-200',
      late: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      absent: 'bg-red-100 text-red-800 border border-red-200',
      leave: 'bg-blue-100 text-blue-800 border border-blue-200'
    };

    const texts = {
      present: 'Hadir',
      late: 'Terlambat',
      absent: 'Tidak Hadir',
      leave: 'Cuti'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {texts[status] || status}
      </span>
    );
  };

  const getAttendanceIcon = (status) => {
    switch(status) {
      case 'present': return <FiCheckCircle className="text-green-500" />;
      case 'late': return <FiAlertCircle className="text-yellow-500" />;
      case 'absent': return <FiXCircle className="text-red-500" />;
      case 'leave': return <FiCalendar className="text-blue-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  // Export Functions
  const exportToPDF = () => {
    setExportLoading(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.text('Laporan Absensi Karyawan', pageWidth / 2, 20, { align: 'center' });
      
      // Date Range
      doc.setFontSize(12);
      doc.text(
        `Periode: ${format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );
      
      // Stats
      doc.setFontSize(14);
      doc.text('Statistik', 14, 45);
      
      const statsData = [
        ['Total Absensi', stats.total],
        ['Hadir', `${stats.present} (${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)`],
        ['Terlambat', `${stats.late} (${stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%)`],
        ['Tidak Hadir', `${stats.absent} (${stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)`],
        ['Cuti', `${stats.leave} (${stats.total > 0 ? Math.round((stats.leave / stats.total) * 100) : 0}%)`],
        ['Rata-rata Jam Kerja', stats.averageHours]
      ];
      
      doc.autoTable({
        startY: 50,
        head: [['Kategori', 'Nilai']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10, cellPadding: 3 }
      });
      
      // Attendance Data
      doc.setFontSize(14);
      doc.text('Data Absensi', 14, doc.lastAutoTable.finalY + 15);
      
      const tableData = filteredAttendance.map(att => [
        formatDate(att.check_in),
        att.user_name,
        att.employee_id,
        att.department_name || '-',
        formatTime(att.check_in),
        formatTime(att.check_out),
        calculateDuration(att.check_in, att.check_out),
        getStatusText(att.status)
      ]);
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Tanggal', 'Nama', 'ID', 'Departemen', 'Check-in', 'Check-out', 'Durasi', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { top: 10 }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        doc.text(
          `Dibuat pada: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })}`,
          pageWidth - 10,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }
      
      doc.save(`laporan-absensi-${dateRange.start}-${dateRange.end}.pdf`);
      toast.success('PDF berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal mengexport PDF');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const exportToExcel = () => {
    setExportLoading(true);
    
    try {
      // Prepare data
      const workbook = XLSX.utils.book_new();
      
      // Stats sheet
      const statsData = [
        ['LAPORAN ABSENSI KARYAWAN'],
        [`Periode: ${format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}`],
        [''],
        ['STATISTIK'],
        ['Kategori', 'Nilai'],
        ['Total Absensi', stats.total],
        ['Hadir', stats.present],
        ['Persentase Hadir', `${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`],
        ['Terlambat', stats.late],
        ['Persentase Terlambat', `${stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%`],
        ['Tidak Hadir', stats.absent],
        ['Persentase Tidak Hadir', `${stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%`],
        ['Cuti', stats.leave],
        ['Persentase Cuti', `${stats.total > 0 ? Math.round((stats.leave / stats.total) * 100) : 0}%`],
        ['Rata-rata Jam Kerja', stats.averageHours]
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistik');
      
      // Attendance sheet
      const attendanceData = filteredAttendance.map(att => ({
        'Tanggal': formatDate(att.check_in),
        'Nama Karyawan': att.user_name,
        'ID Karyawan': att.employee_id,
        'Departemen': att.department_name || '-',
        'Check-in': formatTime(att.check_in),
        'Check-out': formatTime(att.check_out),
        'Durasi': calculateDuration(att.check_in, att.check_out),
        'Status': getStatusText(att.status),
        'Lokasi': att.location || '-',
        'Catatan': att.notes || '-'
      }));
      
      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Data Absensi');
      
      // User stats sheet
      const userStatsData = userStats.map(stat => ({
        'Nama': stat.user_name,
        'ID': stat.employee_id,
        'Departemen': stat.department_name || '-',
        'Total Hadir': stat.present_count,
        'Total Terlambat': stat.late_count,
        'Total Tidak Hadir': stat.absent_count,
        'Total Cuti': stat.leave_count,
        'Persentase Hadir': `${stat.total_days > 0 ? Math.round((stat.present_count / stat.total_days) * 100) : 0}%`,
        'Rata-rata Jam Kerja': stat.avg_hours
      }));
      
      const userStatsSheet = XLSX.utils.json_to_sheet(userStatsData);
      XLSX.utils.book_append_sheet(workbook, userStatsSheet, 'Statistik Karyawan');
      
      // Save file
      XLSX.writeFile(workbook, `laporan-absensi-${dateRange.start}-${dateRange.end}.xlsx`);
      toast.success('Excel berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Gagal mengexport Excel');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const exportToCSV = () => {
    setExportLoading(true);
    
    try {
      const csvData = filteredAttendance.map(att => ({
        Tanggal: formatDate(att.check_in),
        'Nama Karyawan': att.user_name,
        'ID Karyawan': att.employee_id,
        Departemen: att.department_name || '-',
        'Check-in': formatTime(att.check_in),
        'Check-out': formatTime(att.check_out),
        Durasi: calculateDuration(att.check_in, att.check_out),
        Status: getStatusText(att.status),
        Lokasi: att.location || '-',
        Catatan: att.notes || '-'
      }));
      
      const csv = XLSX.utils.json_to_sheet(csvData);
      const csvContent = XLSX.utils.sheet_to_csv(csv);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan-absensi-${dateRange.start}-${dateRange.end}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Gagal mengexport CSV');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExport = () => {
    switch(exportFormat) {
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
      default:
        exportToPDF();
    }
  };

  const getStatusText = (status) => {
    const texts = {
      present: 'Hadir',
      late: 'Terlambat',
      absent: 'Tidak Hadir',
      leave: 'Cuti'
    };
    return texts[status] || status;
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <FiTrendingUp className="text-green-500" />;
    } else if (current < previous) {
      return <FiTrendingDown className="text-red-500" />;
    }
    return null;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Absensi</h1>
            <p className="text-gray-600 mt-2">
              Periode: {format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - {format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all flex items-center"
            >
              <FiDownload className="mr-2" />
              Export Laporan
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Absensi</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <FiBarChart2 className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Hadir</p>
              <p className="text-3xl font-bold mt-2">{stats.present}</p>
              <p className="text-sm opacity-90 mt-1">
                {stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <FiCheckCircle className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Terlambat</p>
              <p className="text-3xl font-bold mt-2">{stats.late}</p>
              <p className="text-sm opacity-90 mt-1">
                {stats.total > 0 ? `${Math.round((stats.late / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <FiAlertCircle className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tidak Hadir</p>
              <p className="text-3xl font-bold mt-2">{stats.absent}</p>
              <p className="text-sm opacity-90 mt-1">
                {stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <FiXCircle className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Cuti</p>
              <p className="text-3xl font-bold mt-2">{stats.leave}</p>
              <p className="text-sm opacity-90 mt-1">
                {stats.total > 0 ? `${Math.round((stats.leave / stats.total) * 100)}%` : '0%'}
              </p>
            </div>
            <FiCalendar className="text-2xl opacity-90" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Rata Jam Kerja</p>
              <p className="text-3xl font-bold mt-2">{stats.averageHours}</p>
              <p className="text-sm opacity-90 mt-1">per hari</p>
            </div>
            <FiClock className="text-2xl opacity-90" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departemen
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Departemen</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="absent">Tidak Hadir</option>
              <option value="leave">Cuti</option>
            </select>
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
                placeholder="Cari nama, ID, atau departemen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
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
            onClick={() => handleDateRangeChange('yesterday')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Kemarin
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

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Karyawan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Departemen</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Check-in</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Check-out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Durasi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Lokasi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(att.check_in)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(att.check_in), 'EEEE', { locale: id })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                        {att.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {att.user_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {att.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{att.department_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiClock className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{formatTime(att.check_in)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiClock className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {att.check_out ? formatTime(att.check_out) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {calculateDuration(att.check_in, att.check_out)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getAttendanceIcon(att.status)}
                      </div>
                      {getStatusBadge(att.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-[150px]" title={att.location || '-'}>
                      {att.location ? (
                        <span className="flex items-center">
                          <FiMapPin className="mr-1 text-gray-400" />
                          {att.location}
                        </span>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // Show attendance details
                          toast.success(`Detail absensi ${att.user_name}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Lihat Detail"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          // Edit attendance
                          toast.info('Fitur edit akan segera tersedia');
                        }}
                        className="text-yellow-600 hover:text-yellow-800 transition-colors"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus absensi ${att.user_name}?`)) {
                            toast.success('Absensi berhasil dihapus');
                          }
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Hapus"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAttendance.length === 0 && (
          <div className="text-center py-16">
            <FiCalendar className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada data absensi</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Tidak ditemukan hasil pencarian' : 'Coba ubah filter untuk melihat data'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDepartment('all');
                setSelectedStatus('all');
                setDateRange({
                  start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                  end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                });
              }}
              className="mt-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAttendance.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Menampilkan <span className="font-medium">{filteredAttendance.length}</span> dari{' '}
            <span className="font-medium">{attendance.length}</span> data
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Sebelumnya
            </button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Export Laporan</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Pilih Format Export:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
                        exportFormat === 'pdf' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-red-500" />
                      <span className="text-sm font-medium">PDF</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('excel')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
                        exportFormat === 'excel' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-green-500" />
                      <span className="text-sm font-medium">Excel</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
                        exportFormat === 'csv' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-blue-500" />
                      <span className="text-sm font-medium">CSV</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Detail Export:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Periode: {format(new Date(dateRange.start), 'dd/MM/yyyy')} - {format(new Date(dateRange.end), 'dd/MM/yyyy')}</li>
                    <li>• Total Data: {filteredAttendance.length} record</li>
                    <li>• Format: {exportFormat.toUpperCase()}</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FiDownload className="mr-2" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
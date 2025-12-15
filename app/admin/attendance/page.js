'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiCalendar, 
  FiDownload, 
  FiFilter, 
  FiSearch,
  FiBarChart2,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFileText,
  FiAlertCircle,
  FiMapPin
} from 'react-icons/fi';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [dateRange]);

  useEffect(() => {
    filterAttendance();
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
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
      
      // Fetch attendance data
      const attendanceRes = await fetch(
        `/api/attendance?start=${dateRange.start}&end=${dateRange.end}`
      );
      
      // Fetch departments
      const departmentsRes = await fetch('/api/departments');

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        console.log('Attendance data received:', data);
        
        setAttendance(data);
        setFilteredAttendance(data);
        
        // Calculate stats from the data
        calculateStats(data);
      } else {
        console.error('Failed to fetch attendance:', attendanceRes.status);
        toast.error('Gagal memuat data absensi');
      }

      if (departmentsRes.ok) {
        const depts = await departmentsRes.json();
        setDepartments(depts);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const present = data.filter(a => a.status === 'present').length;
    const late = data.filter(a => a.status === 'late').length;
    const absent = data.filter(a => a.status === 'absent').length;
    const leave = data.filter(a => a.status === 'leave').length;
    
    // Calculate average working hours
    const workingHours = data
      .filter(a => a.check_in && a.check_out)
      .map(a => {
        try {
          const checkIn = new Date(a.check_in);
          const checkOut = new Date(a.check_out);
          const hours = (checkOut - checkIn) / (1000 * 60 * 60);
          return hours;
        } catch (error) {
          console.error('Error calculating hours:', error);
          return 0;
        }
      })
      .filter(hours => !isNaN(hours) && hours > 0);
    
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
  };

  const filterAttendance = () => {
    let filtered = attendance;

    // Filter by search
    if (search.trim()) {
      filtered = filtered.filter(att =>
        (att.user_name?.toLowerCase().includes(search.toLowerCase())) ||
        (att.employee_id?.toString().toLowerCase().includes(search.toLowerCase())) ||
        (att.department?.toLowerCase().includes(search.toLowerCase())) ||
        (att.location?.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(att => 
        att.department?.toString() === selectedDepartment
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
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: id });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '-';
    }
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    
    try {
      const diffMs = new Date(checkOut) - new Date(checkIn);
      if (diffMs < 0) return '-';
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '-';
    }
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

  const getStatusText = (status) => {
    const texts = {
      present: 'Hadir',
      late: 'Terlambat',
      absent: 'Tidak Hadir',
      leave: 'Cuti'
    };
    return texts[status] || status;
  };

  const truncateLocation = (location, maxLength = 30) => {
    if (!location || location === '-') return '-';
    if (location.length <= maxLength) return location;
    return location.substring(0, maxLength) + '...';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export Functions - PDF dengan cara manual (tanpa autotable)
  const exportToPDF = async () => {
    setExportLoading(true);
    
    try {
      // Dynamically import jsPDF dan autotable
      const { jsPDF } = await import('jspdf');
      const autoTableImport = await import('jspdf-autotable');
      
      // Initialize jsPDF
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add autoTable to jsPDF instance
      const autoTable = autoTableImport.default || autoTableImport;
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN ABSENSI KARYAWAN', pageWidth / 2, 15, { align: 'center' });
      
      // Company Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistem Absensi Karyawan', pageWidth / 2, 22, { align: 'center' });
      
      // Date Range
      doc.setFontSize(11);
      doc.text(
        `Periode: ${format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );
      
      // Export timestamp
      doc.setFontSize(9);
      doc.text(
        `Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })}`,
        pageWidth - 10,
        37,
        { align: 'right' }
      );
      
      // Stats Box
      const statsBoxY = 45;
      doc.setDrawColor(200);
      doc.setFillColor(245, 247, 250);
      doc.rect(10, statsBoxY, pageWidth - 20, 20, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN STATISTIK', 15, statsBoxY + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const statsText = [
        `Total: ${stats.total} data`,
        `Hadir: ${stats.present} (${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)`,
        `Terlambat: ${stats.late} (${stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%)`,
        `Tidak Hadir: ${stats.absent} (${stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)`,
        `Cuti: ${stats.leave} (${stats.total > 0 ? Math.round((stats.leave / stats.total) * 100) : 0}%)`,
        `Rata-rata Jam Kerja: ${stats.averageHours}`
      ];
      
      statsText.forEach((text, index) => {
        const xPos = 15 + (index % 3) * 85;
        const yPos = statsBoxY + 15 + Math.floor(index / 3) * 5;
        doc.text(text, xPos, yPos);
      });
      
      // Attendance Data
      const tableStartY = statsBoxY + 30;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DATA ABSENSI DETAIL', 15, tableStartY - 5);
      
      // Prepare table data
      const tableData = filteredAttendance.map((att, index) => [
        (index + 1).toString(),
        formatDate(att.check_in),
        att.user_name || '-',
        att.employee_id || '-',
        att.department || '-',
        formatTime(att.check_in),
        formatTime(att.check_out),
        calculateDuration(att.check_in, att.check_out),
        getStatusText(att.status),
        att.location || '-',
        att.notes || '-'
      ]);
      
      // Use autoTable
      autoTable(doc, {
        startY: tableStartY,
        head: [['No', 'Tanggal', 'Nama', 'ID', 'Departemen', 'Check-in', 'Check-out', 'Durasi', 'Status', 'Lokasi', 'Catatan']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 10 },  // No
          1: { cellWidth: 22 },  // Tanggal
          2: { cellWidth: 30 },  // Nama
          3: { cellWidth: 18 },  // ID
          4: { cellWidth: 22 },  // Departemen
          5: { cellWidth: 18 },  // Check-in
          6: { cellWidth: 18 },  // Check-out
          7: { cellWidth: 18 },  // Durasi
          8: { cellWidth: 18 },  // Status
          9: { cellWidth: 35 },  // Lokasi
          10: { cellWidth: 30 }  // Catatan
        },
        margin: { left: 10, right: 10 },
        pageBreak: 'auto',
        didDrawPage: function (data) {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 10
          );
        }
      });
      
      // Save file
      const fileName = `Laporan_Absensi_${format(new Date(dateRange.start), 'yyyyMMdd')}_${format(new Date(dateRange.end), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal mengexport PDF: ' + error.message);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const exportToExcel = () => {
    setExportLoading(true);
    
    try {
      // Prepare data for Excel
      const workbook = XLSX.utils.book_new();
      
      // 1. Stats Sheet
      const statsData = [
        ['LAPORAN ABSENSI KARYAWAN'],
        [''],
        ['Perusahaan', 'Sistem Absensi Karyawan'],
        ['Periode', `${format(new Date(dateRange.start), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(dateRange.end), 'dd MMMM yyyy', { locale: id })}`],
        ['Tanggal Export', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })],
        [''],
        ['RINGKASAN STATISTIK'],
        ['Total Absensi', stats.total],
        ['Hadir', `${stats.present} (${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)`],
        ['Terlambat', `${stats.late} (${stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%)`],
        ['Tidak Hadir', `${stats.absent} (${stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)`],
        ['Cuti', `${stats.leave} (${stats.total > 0 ? Math.round((stats.leave / stats.total) * 100) : 0}%)`],
        ['Rata-rata Jam Kerja', stats.averageHours],
        [''],
        ['Jumlah Data', filteredAttendance.length]
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      
      // Style the stats sheet
      const statsRange = XLSX.utils.decode_range(statsSheet['!ref']);
      for (let R = 0; R <= statsRange.e.r; ++R) {
        const cell_address = { c: 0, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!statsSheet[cell_ref]) continue;
        
        // Style title row
        if (R === 0) {
          statsSheet[cell_ref].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
          };
        }
        
        // Style section headers
        if (R === 6) {
          statsSheet[cell_ref].s = {
            font: { bold: true, sz: 14 },
            fill: { fgColor: { rgb: "E6F2FF" } }
          };
        }
      }
      
      // Merge cells for title
      statsSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
      ];
      
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistik');
      
      // 2. Attendance Data Sheet
      const attendanceData = filteredAttendance.map((att, index) => ({
        'No': index + 1,
        'Tanggal': formatDate(att.check_in),
        'Nama Karyawan': att.user_name || '-',
        'ID Karyawan': att.employee_id || '-',
        'Departemen': att.department || '-',
        'Check-in': formatTime(att.check_in),
        'Check-out': formatTime(att.check_out),
        'Durasi': calculateDuration(att.check_in, att.check_out),
        'Status': getStatusText(att.status),
        'Lokasi': att.location || '-',
        'Catatan': att.notes || '-'
      }));
      
      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
      
      // Add header styling
      const headerRange = XLSX.utils.decode_range(attendanceSheet['!ref']);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cell_address = { c: C, r: 0 };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        attendanceSheet[cell_ref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: 'center' }
        };
      }
      
      // Set column widths
      attendanceSheet['!cols'] = [
        { wch: 5 },   // No
        { wch: 12 },  // Tanggal
        { wch: 25 },  // Nama
        { wch: 15 },  // ID
        { wch: 20 },  // Departemen
        { wch: 10 },  // Check-in
        { wch: 10 },  // Check-out
        { wch: 10 },  // Durasi
        { wch: 12 },  // Status
        { wch: 35 },  // Lokasi
        { wch: 30 }   // Catatan
      ];
      
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Data Absensi');
      
      // 3. Summary by Department Sheet
      const departmentSummary = {};
      filteredAttendance.forEach(att => {
        const dept = att.department || 'Tidak Diketahui';
        if (!departmentSummary[dept]) {
          departmentSummary[dept] = {
            present: 0,
            late: 0,
            absent: 0,
            leave: 0,
            total: 0
          };
        }
        departmentSummary[dept][att.status] += 1;
        departmentSummary[dept].total += 1;
      });
      
      const departmentData = Object.entries(departmentSummary).map(([dept, stats]) => ({
        'Departemen': dept,
        'Hadir': stats.present,
        'Terlambat': stats.late,
        'Tidak Hadir': stats.absent,
        'Cuti': stats.leave,
        'Total': stats.total,
        'Persentase Hadir': `${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`
      }));
      
      const departmentSheet = XLSX.utils.json_to_sheet(departmentData);
      
      // Style department sheet header
      const deptHeaderRange = XLSX.utils.decode_range(departmentSheet['!ref']);
      for (let C = deptHeaderRange.s.c; C <= deptHeaderRange.e.c; ++C) {
        const cell_address = { c: C, r: 0 };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        departmentSheet[cell_ref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "10B981" } },
          alignment: { horizontal: 'center' }
        };
      }
      
      departmentSheet['!cols'] = [
        { wch: 25 },  // Departemen
        { wch: 10 },  // Hadir
        { wch: 12 },  // Terlambat
        { wch: 15 },  // Tidak Hadir
        { wch: 10 },  // Cuti
        { wch: 10 },  // Total
        { wch: 15 }   // Persentase
      ];
      
      XLSX.utils.book_append_sheet(workbook, departmentSheet, 'Rekap Departemen');
      
      // Save file
      const fileName = `Laporan_Absensi_${format(new Date(dateRange.start), 'yyyyMMdd')}_${format(new Date(dateRange.end), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Excel berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Gagal mengexport Excel: ' + error.message);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const exportToCSV = () => {
    setExportLoading(true);
    
    try {
      const csvData = filteredAttendance.map((att, index) => ({
        'No': index + 1,
        'Tanggal': formatDate(att.check_in),
        'Nama Karyawan': att.user_name || '-',
        'ID Karyawan': att.employee_id || '-',
        'Departemen': att.department || '-',
        'Check-in': formatTime(att.check_in),
        'Check-out': formatTime(att.check_out),
        'Durasi': calculateDuration(att.check_in, att.check_out),
        'Status': getStatusText(att.status),
        'Lokasi': att.location || '-',
        'Catatan': att.notes || '-'
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(csvData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');
      
      // Generate CSV
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet, {
        FS: ';', // Use semicolon as delimiter for better Excel compatibility
        RS: '\n',
        strip: false,
        blankrows: false
      });
      
      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvContent = BOM + csvOutput;
      
      // Create and download file
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Absensi_${format(new Date(dateRange.start), 'yyyyMMdd')}_${format(new Date(dateRange.end), 'yyyyMMdd')}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success('CSV berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Gagal mengexport CSV: ' + error.message);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExport = () => {
    if (filteredAttendance.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

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
              disabled={filteredAttendance.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                <option key={dept.id} value={dept.name}>
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
                placeholder="Cari nama, ID, departemen, atau lokasi..."
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Departemen
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Durasi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Lokasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(att.check_in)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {att.check_in ? format(new Date(att.check_in), 'EEEE', { locale: id }) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium text-xs">
                        {att.user_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {att.user_name || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {att.employee_id || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{att.department || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiClock className="text-gray-400 mr-2" size={14} />
                      <span className="text-sm text-gray-900">{formatTime(att.check_in)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiClock className="text-gray-400 mr-2" size={14} />
                      <span className="text-sm text-gray-900">
                        {att.check_out ? formatTime(att.check_out) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {calculateDuration(att.check_in, att.check_out)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getAttendanceIcon(att.status)}
                      </div>
                      {getStatusBadge(att.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start">
                      <FiMapPin className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" size={14} />
                      <div className="text-sm text-gray-900 break-words max-w-[200px]">
                        {att.location ? (
                          <span 
                            className="cursor-help" 
                            title={att.location.length > 50 ? att.location : ''}
                          >
                            {truncateLocation(att.location, 50)}
                          </span>
                        ) : '-'}
                      </div>
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
      {filteredAttendance.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAttendance.length)} dari{' '}
            <span className="font-medium">{filteredAttendance.length}</span> data
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
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
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-red-500" />
                      <span className="text-sm font-medium">PDF</span>
                      <span className="text-xs text-gray-500 mt-1">(Laporan Lengkap)</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('excel')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
                        exportFormat === 'excel' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-green-500" />
                      <span className="text-sm font-medium">Excel</span>
                      <span className="text-xs text-gray-500 mt-1">(Multi Sheet)</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
                        exportFormat === 'csv' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FiFileText className="text-2xl mb-2 text-blue-500" />
                      <span className="text-sm font-medium">CSV</span>
                      <span className="text-xs text-gray-500 mt-1">(Data Mentah)</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Detail Export:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Periode: {format(new Date(dateRange.start), 'dd/MM/yyyy')} - {format(new Date(dateRange.end), 'dd/MM/yyyy')}</li>
                    <li>• Total Data: {filteredAttendance.length} record</li>
                    <li>• Format: {exportFormat.toUpperCase()}</li>
                    <li>• Include: Data Absensi + Lokasi</li>
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
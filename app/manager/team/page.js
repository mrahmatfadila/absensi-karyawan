'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash2, 
  FiEye,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiMail,
  FiPhone,
  FiMapPin,
  FiRefreshCw,
  FiDownload,
  FiStar,
  FiSettings,
  FiTarget,
  FiBell,
  FiShield,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ManagerTeamPage() {
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredLeaveRequests, setFilteredLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchLeave, setSearchLeave] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('members');
  const [currentPage, setCurrentPage] = useState(1);
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [teamSettings, setTeamSettings] = useState({
    teamName: 'Tim Pengembangan',
    attendanceTarget: 90,
    productivityTarget: 85,
    permissions: {
      viewTeamData: true,
      requestLeave: true,
      viewSalary: false
    }
  });
  const [debugInfo, setDebugInfo] = useState({});
  const [itemsPerPage] = useState(10);
  const [showMobileActions, setShowMobileActions] = useState(null);
  const [showMobileLeaveActions, setShowMobileLeaveActions] = useState(null);
  const [showMobilePerformanceActions, setShowMobilePerformanceActions] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['members', 'performance', 'leave', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    filterMembers();
  }, [search, teamMembers, selectedDepartment, selectedStatus]);

  useEffect(() => {
    filterLeaveRequests();
  }, [searchLeave, leaveRequests, selectedLeaveStatus]);

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

  const fetchData = async () => {
  try {
    setLoading(true);
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    const teamRes = await fetch('/api/manager/team', {
      headers: {
        'user': JSON.stringify(userData)
      }
    });
    
    const leaveRes = await fetch('/api/manager/leave-requests', {
      headers: {
        'user': JSON.stringify(userData)
      }
    });
    
    const deptRes = await fetch('/api/departments');

    if (teamRes.ok) {
      const teamData = await teamRes.json();
      setTeamMembers(teamData);
      setFilteredMembers(teamData);
    } else {
      const error = await teamRes.json();
      console.error('Team fetch failed:', error);
    }

    if (leaveRes.ok) {
      const leaveData = await leaveRes.json();
      setLeaveRequests(leaveData);
      setFilteredLeaveRequests(leaveData);
    } else {
      const error = await leaveRes.json();
      console.error('Leave fetch failed:', error);
    }

    if (deptRes.ok) {
      const deptData = await deptRes.json();
      setDepartments(deptData);
    }

  } catch (error) {
    console.error('Error fetching team data:', error);
    toast.error('Gagal memuat data tim');
  } finally {
    setLoading(false);
  }
};

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
      const res = await fetch('/api/manager/team-performance');
      if (res.ok) {
        const data = await res.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Gagal memuat data kinerja');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const filterMembers = () => {
  let filtered = teamMembers;

  if (search.trim()) {
    filtered = filtered.filter(member =>
      member.name?.toLowerCase().includes(search.toLowerCase()) ||
      member.employee_id?.toString().toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.position?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (selectedDepartment !== 'all') {
    filtered = filtered.filter(member => 
      member.position?.toString() === selectedDepartment
    );
  }

  if (selectedStatus !== 'all') {
    if (selectedStatus === 'manager') {
      filtered = filtered.filter(member => 
        member.role?.toLowerCase().includes('manager')
      );
    } else if (selectedStatus === 'employee') {
      filtered = filtered.filter(member => 
        !member.role?.toLowerCase().includes('manager')
      );
    }
  }

  setFilteredMembers(filtered);
};

  const filterLeaveRequests = () => {
    let filtered = leaveRequests;

    if (searchLeave.trim()) {
      filtered = filtered.filter(leave =>
        leave.user_name?.toLowerCase().includes(searchLeave.toLowerCase()) ||
        leave.employee_id?.toString().toLowerCase().includes(searchLeave.toLowerCase()) ||
        leave.leave_type?.toLowerCase().includes(searchLeave.toLowerCase())
      );
    }

    if (selectedLeaveStatus !== 'all') {
      filtered = filtered.filter(leave => leave.status === selectedLeaveStatus);
    }

    setFilteredLeaveRequests(filtered);
  };

  const handleApproveLeave = async (leaveId, employeeName) => {
  if (confirm(`Setujui cuti untuk ${employeeName}?`)) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`/api/manager/leave-requests/${leaveId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Cuti untuk ${employeeName} telah disetujui`);
        fetchData();
      } else {
        console.error('Approve error:', data);
        toast.error(data.error || 'Gagal menyetujui cuti');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Koneksi error. Coba lagi.');
    }
  }
  setShowMobileLeaveActions(null);
};

  const handleRejectLeave = async (leaveId, employeeName) => {
  if (confirm(`Tolak cuti untuk ${employeeName}?`)) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`/api/manager/leave-requests/${leaveId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Cuti untuk ${employeeName} telah ditolak`);
        fetchData();
      } else {
        console.error('Reject error:', data);
        toast.error(data.error || 'Gagal menolak cuti');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Koneksi error. Coba lagi.');
    }
  }
  setShowMobileLeaveActions(null);
};

  const handleSaveSettings = () => {
    toast.success('Pengaturan tim berhasil disimpan');
  };

  const handleAddMember = () => {
    toast.success('Fitur tambah anggota akan segera tersedia');
  };

  const handleExportPerformance = () => {
    toast.success('Data kinerja berhasil diexport');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const indexOfLastLeave = leaveCurrentPage * itemsPerPage;
  const indexOfFirstLeave = indexOfLastLeave - itemsPerPage;
  const currentLeaveItems = filteredLeaveRequests.slice(indexOfFirstLeave, indexOfLastLeave);
  const totalLeavePages = Math.ceil(filteredLeaveRequests.length / itemsPerPage);

  const indexOfLastPerformance = currentPage * itemsPerPage;
  const indexOfFirstPerformance = indexOfLastPerformance - itemsPerPage;
  const currentPerformanceItems = performanceData.slice(indexOfFirstPerformance, indexOfLastPerformance);
  const totalPerformancePages = Math.ceil(performanceData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLeavePageChange = (pageNumber) => {
    setLeaveCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getLeaveTypeText = (type) => {
    const types = {
      'annual': 'Cuti Tahunan',
      'tahunan': 'Cuti Tahunan',
      'sick': 'Cuti Sakit',
      'sakit': 'Cuti Sakit',
      'penting': 'Cuti Penting',
      'important': 'Cuti Penting',
      'melahirkan': 'Cuti Melahirkan',
      'maternity': 'Cuti Melahirkan',
      'lainnya': 'Cuti Lainnya',
      'other': 'Cuti Lainnya'
    };
    return types[type.toLowerCase()] || type;
  };

  const getStatusText = (status) => {
    const statuses = {
      'pending': 'Menunggu',
      'approved': 'Disetujui',
      'rejected': 'Ditolak'
    };
    return statuses[status] || status;
  };

  const getPerformanceLevel = (productivity) => {
    if (productivity >= 90) return 'Tinggi';
    if (productivity >= 80) return 'Baik';
    if (productivity >= 70) return 'Cukup';
    return 'Perlu Perbaikan';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tim...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Kelola Tim</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              Kelola anggota tim, pantau kinerja, dan kelola cuti
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={fetchData}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <button
              onClick={() => router.push('/manager')}
              className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs - Mobile scrollable */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {[
              { id: 'members', label: 'Anggota Tim', icon: FiUsers },
              { id: 'performance', label: 'Kinerja', icon: FiBarChart2 },
              { id: 'leave', label: 'Pengajuan Cuti', icon: FiCalendar },
              { id: 'settings', label: 'Pengaturan Tim', icon: FiSettings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'performance') {
                    fetchPerformanceData();
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      
      {/* Tab Anggota Tim */}
      {activeTab === 'members' && (
        <>
          {/* Info Panel */}
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Tim Departemen Anda</h3>
                <p className="text-xs sm:text-sm text-blue-600 mt-1 truncate">
                  Menampilkan {filteredMembers.length} anggota dari departemen {user?.department || 'Anda'}
                </p>
              </div>
              <div className="text-right text-xs sm:text-sm">
                <p className="text-blue-700">
                  Departemen ID: <span className="font-bold">{user?.department_id}</span>
                </p>
                <p className="text-blue-600 truncate">
                  Manager: {user?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="xs:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Cari Anggota
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama, ID, atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Posisi
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="all">Semua Posisi</option>
                  {teamMembers
                    .map(m => m.position)
                    .filter(Boolean)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((position, idx) => (
                      <option key={idx} value={position}>
                        {position}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Peran
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="all">Semua Peran</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Karyawan</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedDepartment('all');
                    setSelectedStatus('all');
                  }}
                  className="w-full px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm sm:text-base"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Team Members - Desktop Table & Mobile Card */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Anggota</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID Karyawan</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Peran</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Posisi</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Departemen</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                            {member.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {member.name}
                              </div>
                              {member.role === 'Manager' && (
                                <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                                  Manager
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
                              {member.email}
                            </div>
                            {member.phone && member.phone !== '-' && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <FiPhone className="mr-1" size={12} />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm font-mono font-medium text-gray-900 bg-gray-50 px-2 sm:px-3 py-1 rounded inline-block">
                          {member.employee_id || '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-900">{member.role || 'Employee'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">
                          {member.position || '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">
                          {member.department || '-'}
                        </div>
                        <div className="text-xs text-gray-500">ID: {member.department_id || user?.department_id}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {formatDate(member.hire_date || member.join_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.hire_date ? format(new Date(member.hire_date), 'yyyy') : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {member.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {member.name}
                            </h3>
                            {member.role === 'Manager' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                                Manager
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">ID: {member.employee_id || '-'}</p>
                          <p className="text-xs text-gray-600 truncate">{member.email}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                              <span className="text-gray-500">Posisi:</span>
                              <p className="font-medium text-gray-900 truncate">{member.position || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Departemen:</span>
                              <p className="font-medium text-gray-900 truncate">{member.department || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Role:</span>
                              <p className="font-medium text-gray-900 truncate">{member.role || 'Employee'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Bergabung:</span>
                              <p className="font-medium text-gray-900">
                                {formatDate(member.hire_date || member.join_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowMobileActions(showMobileActions === member.id ? null : member.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <FiMoreVertical size={20} />
                      </button>
                      
                      {showMobileActions === member.id && (
                        <div className="absolute right-4 mt-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => {
                              router.push(`/manager/users/${member.id}`);
                              setShowMobileActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FiEye className="mr-2" /> Lihat Detail
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                    <FiUsers className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="mt-4 text-base font-medium text-gray-900">
                    {search ? 'Anggota tidak ditemukan' : 'Belum ada anggota tim'}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {search 
                      ? 'Coba dengan kata kunci lain'
                      : 'Semua karyawan dalam departemen Anda akan muncul di sini'}
                  </p>
                </div>
              )}
            </div>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                  <FiUsers className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900">
                  {search ? 'Anggota tidak ditemukan' : 'Belum ada anggota tim'}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {search 
                    ? 'Coba dengan kata kunci lain'
                    : 'Semua karyawan dalam departemen Anda akan muncul di sini'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredMembers.length > 0 && totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredMembers.length)}</span> dari{' '}
                <span className="font-medium">{filteredMembers.length}</span> anggota
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
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
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab Kinerja */}
      {activeTab === 'performance' && (
        <>
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm opacity-90">Rata-rata Kehadiran</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">92%</p>
                </div>
                <FiCheckCircle className="text-xl sm:text-2xl md:text-3xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm opacity-90">Produktivitas Tim</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">85%</p>
                </div>
                <FiTrendingUp className="text-xl sm:text-2xl md:text-3xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm opacity-90">Total Tugas Selesai</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">127</p>
                </div>
                <FiBarChart2 className="text-xl sm:text-2xl md:text-3xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm opacity-90">Rating Rata-rata</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">4.2</p>
                </div>
                <FiStar className="text-xl sm:text-2xl md:text-3xl opacity-80" />
              </div>
            </div>
          </div>

          {/* Performance Filters */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="relative flex-1 xs:flex-none xs:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari anggota..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                <select className="w-full xs:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base">
                  <option value="all">Semua Kinerja</option>
                  <option value="high">Tinggi</option>
                  <option value="medium">Sedang</option>
                  <option value="low">Rendah</option>
                </select>
              </div>
              <button 
                onClick={handleExportPerformance}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                <FiDownload className="mr-2" />
                Export Data Kinerja
              </button>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Anggota</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Kehadiran</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Produktivitas</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Tugas Selesai</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Rating</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status Kinerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceLoading ? (
                    <tr>
                      <td colSpan="6" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">Memuat data kinerja...</p>
                      </td>
                    </tr>
                  ) : performanceData.length > 0 ? (
                    currentPerformanceItems.map((member) => (
                      <tr key={member.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {member.name?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-2 sm:ml-4 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                                {member.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">
                                {member.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                              <div 
                                className="bg-green-500 h-1.5 sm:h-2 rounded-full" 
                                style={{ width: member.attendance_rate }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                              {member.attendance_rate}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                              <div 
                                className="bg-blue-500 h-1.5 sm:h-2 rounded-full" 
                                style={{ width: member.productivity }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                              {member.productivity}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                          {member.tasks_completed}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <FiStar 
                                  key={i} 
                                  className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(member.rating) ? 'fill-current' : ''}`} 
                                />
                              ))}
                            </div>
                            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">
                              {member.rating}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            member.performance_level === 'Tinggi' ? 'bg-green-100 text-green-800' :
                            member.performance_level === 'Baik' ? 'bg-blue-100 text-blue-800' :
                            member.performance_level === 'Cukup' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.performance_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                        <FiBarChart2 className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                        <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">Tidak ada data kinerja</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">Data kinerja tim akan muncul di sini</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {performanceLoading ? (
                <div className="text-center py-8 px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-xs text-gray-600">Memuat data kinerja...</p>
                </div>
              ) : performanceData.length > 0 ? (
                currentPerformanceItems.map((member) => (
                  <div key={member.user_id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                          {member.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{member.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{member.position}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div>
                              <span className="text-gray-500">Kehadiran:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ width: member.attendance_rate }}
                                  ></div>
                                </div>
                                <span className="font-medium whitespace-nowrap">{member.attendance_rate}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Produktivitas:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-500 h-1.5 rounded-full" 
                                    style={{ width: member.productivity }}
                                  ></div>
                                </div>
                                <span className="font-medium whitespace-nowrap">{member.productivity}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Tugas:</span>
                              <p className="font-medium text-gray-900">{member.tasks_completed}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Rating:</span>
                              <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-1">
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar 
                                      key={i} 
                                      className={`w-3 h-3 ${i < Math.floor(member.rating) ? 'fill-current' : ''}`} 
                                    />
                                  ))}
                                </div>
                                <span className="font-medium text-gray-900">{member.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.performance_level === 'Tinggi' ? 'bg-green-100 text-green-800' :
                              member.performance_level === 'Baik' ? 'bg-blue-100 text-blue-800' :
                              member.performance_level === 'Cukup' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {member.performance_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4">
                  <FiBarChart2 className="mx-auto h-10 w-10 text-gray-300" />
                  <h3 className="mt-4 text-base font-medium text-gray-900">Tidak ada data kinerja</h3>
                  <p className="mt-1 text-xs text-gray-500">Data kinerja tim akan muncul di sini</p>
                </div>
              )}
            </div>

            {/* Performance Pagination */}
            {performanceData.length > 0 && totalPerformancePages > 1 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-700">
                    Menampilkan {indexOfFirstPerformance + 1} - {Math.min(indexOfLastPerformance, performanceData.length)} dari{' '}
                    <span className="font-medium">{performanceData.length}</span> data kinerja
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    
                    {Array.from({ length: Math.min(3, totalPerformancePages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPerformancePages}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab Pengajuan Cuti */}
      {activeTab === 'leave' && (
        <>
          {/* Filters for Leave Requests */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1">
                <div className="xs:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Cari Pengajuan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400 text-sm sm:text-base" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama, ID, atau jenis cuti..."
                      value={searchLeave}
                      onChange={(e) => setSearchLeave(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Status
                  </label>
                  <select
                    value={selectedLeaveStatus}
                    onChange={(e) => setSelectedLeaveStatus(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setSearchLeave('');
                      setSelectedLeaveStatus('all');
                    }}
                    className="w-full px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm sm:text-base"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  onClick={handleExportPerformance}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all text-sm sm:text-base w-full lg:w-auto"
                >
                  <FiDownload className="mr-2" />
                  Export Laporan
                </button>
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Karyawan</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jenis Cuti</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Periode</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Durasi</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Alasan</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentLeaveItems.map((leave) => {
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);
                    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {leave.user_name?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-2 sm:ml-4 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                                {leave.user_name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">
                                {leave.employee_id || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">
                            {getLeaveTypeText(leave.leave_type)}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{duration} hari</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900 max-w-[120px] sm:max-w-xs truncate" title={leave.reason}>
                            {leave.reason || '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getStatusText(leave.status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          {leave.status === 'pending' ? (
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleApproveLeave(leave.id, leave.user_name)}
                                className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id, leave.user_name)}
                                className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-500">Sudah diproses</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {currentLeaveItems.map((leave) => {
                const startDate = new Date(leave.start_date);
                const endDate = new Date(leave.end_date);
                const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div key={leave.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                          {leave.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {leave.user_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {getStatusText(leave.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">ID: {leave.employee_id || '-'}</p>
                          <p className="text-xs text-gray-600">{getLeaveTypeText(leave.leave_type)}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div>
                              <span className="text-gray-500">Periode:</span>
                              <p className="font-medium text-gray-900">
                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Durasi:</span>
                              <p className="font-medium text-gray-900">{duration} hari</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Alasan:</span>
                              <p className="font-medium text-gray-900 truncate" title={leave.reason}>
                                {leave.reason || '-'}
                              </p>
                            </div>
                          </div>
                          
                          {leave.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleApproveLeave(leave.id, leave.user_name)}
                                className="flex-1 px-3 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors text-center"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id, leave.user_name)}
                                className="flex-1 px-3 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors text-center"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowMobileLeaveActions(showMobileLeaveActions === leave.id ? null : leave.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <FiMoreVertical size={20} />
                      </button>
                      
                      {showMobileLeaveActions === leave.id && (
                        <div className="absolute right-4 mt-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => {
                              handleApproveLeave(leave.id, leave.user_name);
                              setShowMobileLeaveActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-green-700 hover:bg-green-50 flex items-center"
                          >
                            <FiCheckCircle className="mr-2" /> Setujui
                          </button>
                          <button
                            onClick={() => {
                              handleRejectLeave(leave.id, leave.user_name);
                              setShowMobileLeaveActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-red-700 hover:bg-red-50 flex items-center"
                          >
                            <FiXCircle className="mr-2" /> Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredLeaveRequests.length === 0 && (
                <div className="text-center py-8 px-4">
                  <FiCalendar className="mx-auto h-10 w-10 text-gray-300" />
                  <h3 className="mt-4 text-base font-medium text-gray-900">Tidak ada pengajuan cuti</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {searchLeave ? 'Tidak ditemukan hasil pencarian' : 'Tidak ada pengajuan cuti yang menunggu persetujuan'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination for Leave Requests */}
          {filteredLeaveRequests.length > 0 && totalLeavePages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Menampilkan {indexOfFirstLeave + 1} - {Math.min(indexOfLastLeave, filteredLeaveRequests.length)} dari{' '}
                <span className="font-medium">{filteredLeaveRequests.length}</span> pengajuan
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button 
                  onClick={() => handleLeavePageChange(leaveCurrentPage - 1)}
                  disabled={leaveCurrentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                {Array.from({ length: Math.min(3, totalLeavePages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handleLeavePageChange(pageNumber)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                        leaveCurrentPage === pageNumber
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handleLeavePageChange(leaveCurrentPage + 1)}
                  disabled={leaveCurrentPage === totalLeavePages}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab Pengaturan Tim */}
      {activeTab === 'settings' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Team Settings */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Team Information */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-6 flex items-center">
                  <FiSettings className="mr-2 text-primary-600" />
                  Informasi Tim
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Nama Tim
                      </label>
                      <input
                        type="text"
                        value={teamSettings.teamName}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          teamName: e.target.value
                        })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Departemen
                      </label>
                      <input
                        type="text"
                        value={user?.department || 'IT'}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm sm:text-base"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Tim
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Deskripsikan tim Anda..."
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      defaultValue="Tim pengembangan software perusahaan"
                    />
                  </div>
                </div>
              </div>

              {/* Team Goals */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-6 flex items-center">
                  <FiTarget className="mr-2 text-green-600" />
                  Target Tim
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100 gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-green-800 text-sm sm:text-base">Target Kehadiran</p>
                      <p className="text-xs sm:text-sm text-green-600">Minimal persentase kehadiran bulanan</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={teamSettings.attendanceTarget}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          attendanceTarget: parseInt(e.target.value)
                        })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border border-green-300 rounded text-center text-green-700 text-sm sm:text-base"
                      />
                      <span className="text-green-700 font-medium">%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100 gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-blue-800 text-sm sm:text-base">Target Produktivitas</p>
                      <p className="text-xs sm:text-sm text-blue-600">Minimal persentase produktivitas</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={teamSettings.productivityTarget}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          productivityTarget: parseInt(e.target.value)
                        })}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border border-blue-300 rounded text-center text-blue-700 text-sm sm:text-base"
                      />
                      <span className="text-blue-700 font-medium">%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100 gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-purple-800 text-sm sm:text-base">Target Tugas</p>
                      <p className="text-xs sm:text-sm text-purple-600">Jumlah tugas minimum per anggota per bulan</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        defaultValue="20"
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border border-purple-300 rounded text-center text-purple-700 text-sm sm:text-base"
                      />
                      <span className="text-purple-700 font-medium">tugas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-6 flex items-center">
                  <FiShield className="mr-2 text-purple-600" />
                  Izin Tim
                </h3>
                
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={teamSettings.permissions.viewTeamData}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          permissions: {
                            ...teamSettings.permissions,
                            viewTeamData: e.target.checked
                          }
                        })}
                        className="rounded text-primary-600"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">Anggota dapat melihat data tim</span>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:inline">Rekomendasi: Aktif</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={teamSettings.permissions.requestLeave}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          permissions: {
                            ...teamSettings.permissions,
                            requestLeave: e.target.checked
                          }
                        })}
                        className="rounded text-primary-600"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">Anggota dapat mengajukan cuti</span>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:inline">Rekomendasi: Aktif</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={teamSettings.permissions.viewSalary}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          permissions: {
                            ...teamSettings.permissions,
                            viewSalary: e.target.checked
                          }
                        })}
                        className="rounded text-primary-600"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">Anggota dapat melihat informasi gaji</span>
                    </div>
                    <span className="text-xs text-red-500 hidden sm:inline">Rekomendasi: Nonaktif</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked
                        className="rounded text-primary-600"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">Anggota dapat mengupdate profil sendiri</span>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:inline">Rekomendasi: Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Actions and Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Add Member Card */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 text-white">
                <div className="flex items-center mb-3 sm:mb-4">
                  <FiUserPlus className="text-lg sm:text-xl md:text-2xl mr-2 sm:mr-3" />
                  <h3 className="text-base sm:text-lg font-semibold">Tambah Anggota</h3>
                </div>
                <p className="text-xs sm:text-sm opacity-90 mb-4 sm:mb-6">
                  Tambahkan anggota baru ke dalam tim Anda. Mereka akan mendapatkan akses sesuai dengan izin yang ditetapkan.
                </p>
                <button
                  onClick={handleAddMember}
                  className="w-full bg-white text-primary-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  Tambah Anggota Baru
                </button>
              </div>

              {/* Team Stats */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Statistik Tim</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Total Anggota</span>
                    <span className="font-medium text-sm sm:text-base">{teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Aktif</span>
                    <span className="font-medium text-green-600 text-sm sm:text-base">
                      {teamMembers.filter(m => m.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Rata-rata Kehadiran</span>
                    <span className="font-medium text-sm sm:text-base">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Pengajuan Cuti Menunggu</span>
                    <span className="font-medium text-yellow-600 text-sm sm:text-base">
                      {leaveRequests.filter(l => l.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Settings */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Simpan Perubahan</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                  Setelah mengubah pengaturan, klik tombol di bawah untuk menyimpan semua perubahan.
                </p>
                <button
                  onClick={handleSaveSettings}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all text-sm sm:text-base"
                >
                  Simpan Pengaturan Tim
                </button>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 border border-red-200">
                <h3 className="text-base sm:text-lg font-semibold text-red-700 mb-3 sm:mb-4 flex items-center">
                  <FiBell className="mr-2" />
                  Zona Bahaya
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Tindakan di bawah ini tidak dapat dibatalkan. Hapus tim hanya jika Anda yakin.
                </p>
                <button className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base">
                  Hapus Tim
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
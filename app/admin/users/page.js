'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiUsers, 
  FiUserPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    role_id: '3',
    department_id: '',
    position: '',
    hire_date: ''
  });
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMobileActions, setShowMobileActions] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, users]);

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        // Fallback roles
        setRoles([
          { id: 1, name: 'admin' },
          { id: 2, name: 'manager' },
          { id: 3, name: 'employee' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const filterUsers = () => {
    if (!search.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      user.department?.toLowerCase().includes(search.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3',
      department_id: departments.find(d => d.name === user.department)?.id || '',
      position: user.position || '',
      hire_date: user.hire_date || ''
    });
    setShowModal(true);
    setShowMobileActions(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Pengguna berhasil dihapus');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Gagal menghapus pengguna');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
    setShowMobileActions(null);
  };

  const handleRoleChange = async (userId, newRoleId, userName) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah role ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: parseInt(newRoleId) }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Role pengguna berhasil diubah');
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal mengubah role');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}`
        : '/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingUser ? {
          ...formData,
          role_id: parseInt(formData.role_id)
        } : {
          ...formData,
          role_id: parseInt(formData.role_id)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingUser ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          employee_id: '',
          name: '',
          email: '',
          password: '',
          role_id: '3',
          department_id: '',
          position: '',
          hire_date: ''
        });
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menyimpan pengguna');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleSelectColor = (roleId) => {
    switch (roleId) {
      case '1': return 'border-red-200 bg-red-50 text-red-800';
      case '2': return 'border-blue-200 bg-blue-50 text-blue-800';
      case '3': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      {/* Breadcrumb - Hidden on small mobile */}
      <div className="hidden xs:flex items-center text-sm text-gray-600 mb-3 sm:mb-4">
        <button
          onClick={() => router.push('/admin')}
          className="hover:text-primary-600 text-xs sm:text-sm"
        >
          Admin
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 text-xs sm:text-sm">Pengguna</span>
      </div>

      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              Kelola Pengguna
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              Kelola data karyawan dan pengguna sistem
            </p>
          </div>
          
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                employee_id: '',
                name: '',
                email: '',
                password: '',
                role_id: '3',
                department_id: '',
                position: '',
                hire_date: new Date().toISOString().split('T')[0]
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base whitespace-nowrap mt-2 sm:mt-0 w-full sm:w-auto"
          >
            <FiUserPlus className="mr-2" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, email, atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 min-w-[140px]">
              <option>Semua Departemen</option>
              {departments.map(dept => (
                <option key={dept.id}>{dept.name}</option>
              ))}
            </select>
            
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 min-w-[120px]">
              <option>Semua Role</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Employee</option>
            </select>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="btn-secondary flex items-center justify-center flex-1 sm:flex-none text-sm sm:text-base px-3 py-2">
                <FiFilter className="mr-2" />
                <span className="hidden xs:inline">Filter</span>
              </button>
              
              <button className="btn-secondary flex items-center justify-center flex-1 sm:flex-none text-sm sm:text-base px-3 py-2">
                <FiDownload className="mr-2" />
                <span className="hidden xs:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Karyawan
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dept
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posisi
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bergabung
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {user.employee_id}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-800 font-medium text-xs">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {user.department || '-'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {user.position || '-'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getRoleBadgeColor(user.role)} whitespace-nowrap`}>
                        {user.role}
                      </span>
                      <select
                        value={user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                        className={`px-2 py-1 text-xs border rounded-lg ${getRoleSelectColor(user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3')} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer`}
                      >
                        <option value="1">Admin</option>
                        <option value="2">Manager</option>
                        <option value="3">Employee</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {user.join_date || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1 sm:space-x-2">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="text-primary-600 hover:text-primary-900 p-1"
                        title="Lihat Detail"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Edit"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Hapus"
                      >
                        <FiTrash2 size={16} />
                      </button>
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
            currentItems.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-800 font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">ID: {user.employee_id}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-gray-500">Departemen:</span>
                        <p className="font-medium text-gray-900 truncate">{user.department || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Posisi:</span>
                        <p className="font-medium text-gray-900 truncate">{user.position || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Bergabung:</span>
                        <p className="font-medium text-gray-900">{user.join_date || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <select
                          value={user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          className={`w-full mt-1 px-2 py-1 text-xs border rounded-lg ${getRoleSelectColor(user.role === 'admin' ? '1' : user.role === 'manager' ? '2' : '3')}`}
                        >
                          <option value="1">Admin</option>
                          <option value="2">Manager</option>
                          <option value="3">Employee</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative ml-2">
                    <button
                      onClick={() => setShowMobileActions(showMobileActions === user.id ? null : user.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <FiMoreVertical size={20} />
                    </button>
                    
                    {showMobileActions === user.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => {
                            router.push(`/admin/users/${user.id}`);
                            setShowMobileActions(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FiEye className="mr-2" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 flex items-center"
                        >
                          <FiEdit className="mr-2" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                        >
                          <FiTrash2 className="mr-2" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <FiUsers className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pengguna</h3>
              <p className="mt-1 text-xs text-gray-500">
                {search ? 'Tidak ditemukan hasil pencarian' : 'Mulai dengan menambahkan pengguna baru'}
              </p>
            </div>
          )}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 px-4">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pengguna</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Tidak ditemukan hasil pencarian' : 'Mulai dengan menambahkan pengguna baru'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-600">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} dari {filteredUsers.length} pengguna
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              <FiChevronLeft className="w-4 h-4" />
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
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === pageNumber
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-2 sm:px-4">
          <div className="relative top-2 sm:top-4 md:top-8 lg:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-lg sm:rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    ID Karyawan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                    placeholder="EMP001"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    {editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                  >
                    <option value="">Pilih Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Departemen
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Posisi
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                    placeholder="Staff IT"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    className="input-primary text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm sm:text-base px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm sm:text-base px-4 py-2"
                >
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
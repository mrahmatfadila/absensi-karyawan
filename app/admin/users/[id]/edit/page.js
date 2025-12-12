'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiCalendar, 
  FiSave,
  FiArrowLeft,
  FiHash,
  FiLock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EditUserPage() {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    role_id: '',
    department_id: '',
    position: '',
    hire_date: ''
  });
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchDepartments();
      fetchRoles();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const user = await response.json();
        
        // Convert role name to role_id
        let roleId = '3'; // default employee
        if (user.role === 'admin') roleId = '1';
        else if (user.role === 'manager') roleId = '2';
        
        setFormData({
          employee_id: user.employee_id,
          name: user.name,
          email: user.email,
          role_id: roleId,
          department_id: '', // Will be set after departments load
          position: user.position || '',
          hire_date: user.hire_date || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Gagal memuat data pengguna');
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
        // Fallback
        setRoles([
          { id: 1, name: 'admin' },
          { id: 2, name: 'manager' },
          { id: 3, name: 'employee' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Data pengguna berhasil diperbarui');
        setTimeout(() => {
          router.push(`/admin/users/${userId}`);
        }, 1000);
      } else {
        toast.error(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
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
        <button
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Kembali ke Detail Pengguna
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Edit Pengguna
            </h1>
            <p className="text-gray-600 mt-2">
              Perbarui informasi pengguna
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiHash className="inline mr-2" />
                  ID Karyawan *
                </label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="input-primary"
                  placeholder="EMP001"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-primary"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-primary"
                  placeholder="email@company.com"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="input-primary"
                  required
                >
                  <option value="">Pilih Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiBriefcase className="inline mr-2" />
                  Departemen
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="input-primary"
                >
                  <option value="">Pilih Departemen</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiBriefcase className="inline mr-2" />
                  Posisi/Jabatan
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="input-primary"
                  placeholder="Staff IT"
                />
              </div>

              {/* Hire Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline mr-2" />
                  Tanggal Bergabung
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="input-primary"
                    required
                  >
                    <option value="">Pilih Role</option>
                    <option value="1">Administrator</option>
                    <option value="2">Manager</option>
                    <option value="3">Employee</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Administrator: Akses penuh sistem<br/>
                    Manager: Akses terbatas untuk tim<br/>
                    Employee: Akses dasar untuk absensi
                  </p>
                </div>

              {/* Password (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2" />
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  onChange={handleChange}
                  className="input-primary"
                  placeholder="Kosongkan jika tidak diubah"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Isi hanya jika ingin mengubah password
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/admin/users/${userId}`)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center"
              >
                <FiSave className="mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
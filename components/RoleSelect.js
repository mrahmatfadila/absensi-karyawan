'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RoleSelect({ userId, currentRole, onRoleChange }) {
  const [selectedRole, setSelectedRole] = useState(
    currentRole === 'admin' ? '1' : 
    currentRole === 'manager' ? '2' : '3'
  );
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (newRoleId) => {
    setSelectedRole(newRoleId);
    
    if (onRoleChange) {
      onRoleChange(newRoleId);
    } else {
      // Default behavior
      if (!confirm('Apakah Anda yakin ingin mengubah role pengguna ini?')) {
        setSelectedRole(currentRole === 'admin' ? '1' : currentRole === 'manager' ? '2' : '3');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role_id: parseInt(newRoleId) }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Role berhasil diubah');
        } else {
          toast.error(data.error || 'Gagal mengubah role');
          setSelectedRole(currentRole === 'admin' ? '1' : currentRole === 'manager' ? '2' : '3');
        }
      } catch (error) {
        toast.error('Terjadi kesalahan');
        setSelectedRole(currentRole === 'admin' ? '1' : currentRole === 'manager' ? '2' : '3');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case '1': return 'bg-red-100 text-red-800 border-red-200';
      case '2': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '3': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <select
      value={selectedRole}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={loading}
      className={`px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor(selectedRole)} ${
        loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <option value="1">Admin</option>
      <option value="2">Manager</option>
      <option value="3">Employee</option>
    </select>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiLogOut,
} from 'react-icons/fi';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  const menuItems = [
    { href: '/', label: 'Dashboard', icon: <FiHome /> },
    { href: '/attendance', label: 'Absensi', icon: <FiCalendar /> },
    { href: '/attendance/history', label: 'Riwayat', icon: <FiClock /> },
    { href: '/leave', label: 'Cuti', icon: <FiFileText /> },
    { href: '/reports', label: 'Laporan', icon: <FiBarChart2 /> },
    { href: '/team', label: 'Tim', icon: <FiUsers /> },
    { href: '/settings', label: 'Pengaturan', icon: <FiSettings /> },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-800">Absensi Karyawan PT MAT</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center w-full">
            <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        >
          {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
              JD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">John Doe</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
              JD
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
          <FiLogOut />
          {!collapsed && <span className="ml-3 font-medium">Keluar</span>}
        </button>
      </div>
    </div>
  );
}
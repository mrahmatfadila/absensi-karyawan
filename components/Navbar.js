'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiCalendar, FiUsers, FiBarChart2, FiSettings, FiClock,  FiFileText} from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Di dalam getNavItems function:
    const getNavItems = () => {
      if (!user) return [];
      
      const baseItems = [
        { href: '/', label: 'Dashboard', icon: <FiHome /> },
        { href: '/attendance', label: 'Absensi', icon: <FiCalendar /> },
      ];

      if (user.role === 'admin') {
        baseItems.push(
          { href: '/admin', label: 'Admin Panel', icon: <FiSettings /> },
          { href: '/admin/users', label: 'Kelola Karyawan', icon: <FiUsers /> },
          { href: '/admin/attendance', label: 'Laporan Absensi', icon: <FiBarChart2 /> }
        );
      } else if (user.role === 'manager') {
        baseItems.push(
          { href: '/manager', label: 'Manager Panel', icon: <FiSettings /> },
          { href: '/manager/team', label: 'Tim Saya', icon: <FiUsers /> },
          { href: '/manager/reports', label: 'Laporan', icon: <FiBarChart2 /> }
        );
      } else {
        // Employee
        baseItems.push(
          { href: '/attendance/history', label: 'Riwayat', icon: <FiClock /> },
          { href: '/leave', label: 'Cuti', icon: <FiFileText /> }
        );
      }

      return baseItems;
    };

  const userItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AK</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">Absensi Karyawan</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                  } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="h-9 w-9 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <FiLogOut className="mr-2" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-md hover:from-primary-700 hover:to-primary-800 font-medium transition-all"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {userItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center px-3 py-2">
                    <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md flex items-center"
                  >
                    <FiLogOut className="mr-3" />
                    Keluar
                  </button>
                </div>
              </>
            )}
            {!user && (
              <div className="border-t border-gray-200 pt-4">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                  onClick={() => setIsOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 mt-2"
                  onClick={() => setIsOpen(false)}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
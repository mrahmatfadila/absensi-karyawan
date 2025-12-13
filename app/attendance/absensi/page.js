'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle, LogOut, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AbsensiPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Load user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
  }, [user]);

  const fetchTodayAttendance = async () => {
  try {
    
    
    if (!user || !user.id) {
      console.error('❌ User data not available');
      toast.error('Data user tidak ditemukan');
      setLoading(false);
      return;
    }
    const apiUrl = `/api/attendance/today?user_id=${user.id}`;
    
    const response = await fetch(apiUrl);
    
    // Get response as text first
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      // Try to parse error JSON
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.details || errorMessage;
        console.error('Parsed error:', errorData);
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      toast.error(`Gagal memuat absensi: ${errorMessage}`);
      setTodayAttendance(null);
      return;
    }
    
    // Parse successful response
    if (responseText === 'null' || responseText.trim() === '') {
      setTodayAttendance(null);
      return;
    }
    
    const data = JSON.parse(responseText);
    setTodayAttendance(data);
    
  } catch (error) {
    console.error('💥 Error in fetchTodayAttendance:', error);
    console.error('Error stack:', error.stack);
    
    toast.error(`Network error: ${error.message}`);
    setTodayAttendance(null);
  } finally {
    setLoading(false);
  }
};

  const handleCheckIn = async () => {
    if (!user) {
      toast.error('User tidak ditemukan');
      return;
    }

    setLoadingAction(true);
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          location: location ? `${location.latitude},${location.longitude}` : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Check-in berhasil!');
        setTodayAttendance(data.attendance);
      } else {
        toast.error(data.error || 'Gagal check-in');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      console.error('Error check-in:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !todayAttendance) {
      toast.error('Data tidak lengkap');
      return;
    }

    setLoadingAction(true);
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendance_id: todayAttendance.id,
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Check-out berhasil!');
        setTodayAttendance(data.attendance);
      } else {
        toast.error(data.error || 'Gagal check-out');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
      console.error('Error check-out:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200';
      case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Absensi</h1>
          <p className="text-gray-600">Riwayat absensi Anda</p>
        </div>

        {/* Current Time Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-8 mb-6 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Waktu Saat Ini</h2>
            </div>
            <div className="text-6xl font-bold mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="text-xl opacity-90">
              {formatDate(currentTime)}
            </div>
            {user && (
              <div className="mt-4 text-lg opacity-90">
                Selamat datang, <span className="font-semibold">{user.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Check In Button */}
          <button
            onClick={handleCheckIn}
            disabled={todayAttendance?.check_in || loadingAction}
            className={`p-8 rounded-xl shadow-lg transition-all duration-300 ${
              todayAttendance?.check_in
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-white hover:shadow-2xl hover:-translate-y-1'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                todayAttendance?.check_in
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {todayAttendance?.check_in ? 'Sudah Check-In' : 'Check-In'}
              </h3>
              {todayAttendance?.check_in ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-1">Waktu Check-In</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Date(todayAttendance.check_in).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-center">
                  Klik untuk mencatat kehadiran masuk
                </p>
              )}
            </div>
          </button>

          {/* Check Out Button */}
          <button
            onClick={handleCheckOut}
            disabled={!todayAttendance?.check_in || todayAttendance?.check_out || loadingAction}
            className={`p-8 rounded-xl shadow-lg transition-all duration-300 ${
              !todayAttendance?.check_in || todayAttendance?.check_out
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-white hover:shadow-2xl hover:-translate-y-1'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                !todayAttendance?.check_in || todayAttendance?.check_out
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-br from-orange-500 to-red-600'
              }`}>
                <LogOut className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {todayAttendance?.check_out ? 'Sudah Check-Out' : 'Check-Out'}
              </h3>
              {todayAttendance?.check_out ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-1">Waktu Check-Out</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {new Date(todayAttendance.check_out).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-center">
                  {todayAttendance?.check_in 
                    ? 'Klik untuk mencatat kehadiran pulang'
                    : 'Lakukan check-in terlebih dahulu'}
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Today Status */}
        {todayAttendance && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Hari Ini</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium text-gray-800">
                    {new Date(todayAttendance.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Durasi Kerja</p>
                  <p className="font-medium text-gray-800">
                    {todayAttendance.check_out 
                      ? `${Math.floor((new Date(todayAttendance.check_out) - new Date(todayAttendance.check_in)) / 3600000)} jam`
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(todayAttendance.status)}`}>
                    {getStatusText(todayAttendance.status)}
                  </span>
                </div>
              </div>
            </div>
            {todayAttendance.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Catatan:</p>
                <p className="text-gray-800">{todayAttendance.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Informasi Absensi</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Jam kerja: 08:00 - 17:00 WIB</li>
                <li>• Toleransi keterlambatan: 15 menit</li>
                <li>• Pastikan lokasi GPS aktif saat absen</li>
                <li>• Check-out minimal 8 jam setelah check-in</li>
              </ul>
              {location && (
                <p className="text-xs text-blue-600 mt-3">
                  📍 Lokasi terdeteksi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
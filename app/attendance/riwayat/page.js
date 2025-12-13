"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Filter, Download, Search, Eye, MapPinOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RiwayatPage() {
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [riwayatData, setRiwayatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [statistik, setStatistik] = useState({
    totalHadir: 0,
    totalTerlambat: 0,
    totalCuti: 0,
    totalAbsen: 0
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRiwayat();
    }
  }, [user, filterBulan, filterTahun]);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/attendance/history?user_id=${user.id}&month=${filterBulan}&year=${filterTahun}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setRiwayatData(data.data);
        setStatistik(data.statistics);
      } else {
        toast.error('Gagal memuat riwayat');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchRiwayat();
  };

  const handleExport = () => {
    toast.success('Fitur export akan segera tersedia');
  };

  const showLocation = (location) => {
    if (location) {
      setSelectedLocation(location);
      setShowLocationModal(true);
    } else {
      toast.error('Lokasi tidak tersedia');
    }
  };

  const parseLocation = (location) => {
    if (!location) return null;
    
    try {
      // Coba parse format "latitude,longitude"
      if (location.includes(',')) {
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      // Cek jika location adalah JSON string
      if (location.startsWith('{')) {
        const parsed = JSON.parse(location);
        if (parsed.latitude && parsed.longitude) {
          return { lat: parsed.latitude, lng: parsed.longitude };
        }
        if (parsed.lat && parsed.lng) {
          return { lat: parsed.lat, lng: parsed.lng };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing location:', error);
      return null;
    }
  };

  const getGoogleMapsUrl = (location) => {
    const parsed = parseLocation(location);
    if (parsed) {
      return `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}`;
    }
    return null;
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  const filteredData = riwayatData.filter(item => {
    if (!searchQuery) return true;
    return (
      formatDate(item.check_in).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getStatusText(item.status).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Riwayat Kehadiran</h1>
          <p className="text-gray-600">Lihat riwayat kehadiran dan statistik Anda</p>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hadir</p>
                <p className="text-3xl font-bold text-gray-800">{statistik.totalHadir}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Terlambat</p>
                <p className="text-3xl font-bold text-gray-800">{statistik.totalTerlambat}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cuti</p>
                <p className="text-3xl font-bold text-gray-800">{statistik.totalCuti}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tidak Hadir</p>
                <p className="text-3xl font-bold text-gray-800">{statistik.totalAbsen}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter dan Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Cari
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan tanggal, status, atau lokasi..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Bulan
              </label>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            <button 
              onClick={handleApplyFilter}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Terapkan</span>
            </button>

            <button 
              onClick={handleExport}
              className="w-full md:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabel Riwayat */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Hari</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Jam Masuk</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Jam Pulang</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Durasi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => {
                  const duration = item.check_out 
                    ? Math.floor((new Date(item.check_out) - new Date(item.check_in)) / 3600000)
                    : null;
                  const hasLocation = item.location && item.location.trim() !== '';
                  const mapsUrl = hasLocation ? getGoogleMapsUrl(item.location) : null;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-800">
                            {formatDate(item.check_in)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getDayName(item.check_in)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-800">{formatTime(item.check_in)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-800">{formatTime(item.check_out)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {duration ? `${duration} jam` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasLocation ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => showLocation(item.location)}
                              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              title="Lihat lokasi"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Lihat</span>
                            </button>
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 transition-colors"
                                title="Buka di Google Maps"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <MapPinOff className="w-4 h-4" />
                            <span className="text-sm">Tidak ada</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Belum ada riwayat kehadiran untuk periode ini
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lokasi */}
      {showLocationModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MapPin className="w-6 h-6 text-blue-600 mr-2" />
                  Detail Lokasi
                </h3>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Koordinat GPS:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-sm font-mono break-all">
                    {selectedLocation}
                  </code>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Parsed Coordinates:</p>
                {(() => {
                  const parsed = parseLocation(selectedLocation);
                  if (parsed) {
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Latitude:</span>
                          <span className="font-medium">{parsed.lat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Longitude:</span>
                          <span className="font-medium">{parsed.lng}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-red-600 text-sm">Format lokasi tidak valid</p>
                  );
                })()}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLocation);
                    toast.success('Koordinat disalin ke clipboard');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Salin Koordinat
                </button>
                
                {(() => {
                  const mapsUrl = getGoogleMapsUrl(selectedLocation);
                  if (mapsUrl) {
                    return (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all text-center"
                      >
                        Buka di Maps
                      </a>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
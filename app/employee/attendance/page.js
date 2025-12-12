'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeAttendancePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/attendance');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="ml-3 text-gray-600">Mengarahkan ke halaman absensi...</p>
    </div>
  );
}
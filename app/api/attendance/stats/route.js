// app/api/attendance/stats/route.js
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let sqlQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave
      FROM attendance
      WHERE 1=1
    `;

    const values = [];
    let paramCounter = 1;

    if (userId) {
      sqlQuery += ` AND user_id = $${paramCounter}`;
      values.push(userId);
      paramCounter++;
    }

    if (start) {
      sqlQuery += ` AND DATE(check_in) >= $${paramCounter}`;
      values.push(start);
      paramCounter++;
    }

    if (end) {
      sqlQuery += ` AND DATE(check_in) <= $${paramCounter}`;
      values.push(end);
      paramCounter++;
    }

    const result = await query({
      query: sqlQuery,
      values: values,
    });

    const stats = result[0];
    const total = parseInt(stats.total) || 0;
    const present = parseInt(stats.present) || 0;
    const late = parseInt(stats.late) || 0;
    const absent = parseInt(stats.absent) || 0;
    const leave = parseInt(stats.leave) || 0;

    // Calculate attendance rate (present + late) / total
    const attendanceRate = total > 0 
      ? Math.round(((present + late) / total) * 100) 
      : 0;

    return Response.json({
      total,
      present,
      late,
      absent,
      leave,
      attendanceRate: `${attendanceRate}%`
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return Response.json(
      { 
        error: 'Gagal mengambil statistik absensi',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
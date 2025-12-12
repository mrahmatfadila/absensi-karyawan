import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    console.log('Fetching stats for user ID:', userId);

    if (!userId) {
      return Response.json({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        attendanceRate: '0%'
      });
    }

    // Query sederhana untuk testing
    const [stats] = await query({
      query: `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM attendance 
        WHERE user_id = ?
      `,
      values: [userId],
    });

    console.log('Stats result:', stats);

    const total = parseInt(stats.total) || 0;
    const present = parseInt(stats.present) || 0;
    const late = parseInt(stats.late) || 0;
    const absent = parseInt(stats.absent) || 0;
    
    const attendanceRate = total > 0 
      ? `${Math.round((present / total) * 100)}%` 
      : '0%';

    return Response.json({
      total,
      present,
      late,
      absent,
      attendanceRate
    });
  } catch (error) {
    console.error('Get stats error:', error);
    // Return default stats jika error
    return Response.json({
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      attendanceRate: '0%'
    });
  }
}
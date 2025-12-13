import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // 1. Total employees (role_id = 3)
    const employeesQuery = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role_id = 3`
    );
    const totalEmployees = parseInt(employeesQuery.rows[0].count);

    // 2. Today's attendance stats
    const today = new Date().toISOString().split('T')[0];
    const attendanceQuery = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_today,
        COUNT(*) FILTER (WHERE status = 'late') as late_today,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_today,
        COUNT(*) as total_today
      FROM attendance 
      WHERE DATE(check_in) = $1
    `, [today]);
    
    const presentToday = parseInt(attendanceQuery.rows[0]?.present_today || 0);
    const lateToday = parseInt(attendanceQuery.rows[0]?.late_today || 0);
    const absentToday = parseInt(attendanceQuery.rows[0]?.absent_today || 0);

    // 3. Pending leaves
    const leaveQuery = await pool.query(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`
    );
    const pendingLeaves = parseInt(leaveQuery.rows[0]?.count || 0);

    // 4. Departments count
    const deptQuery = await pool.query(`SELECT COUNT(*) as count FROM departments`);
    const departmentsCount = parseInt(deptQuery.rows[0]?.count || 0);

    // 5. Average check-in time (hanya untuk yang hadir hari ini)
    const avgCheckInQuery = await pool.query(`
      SELECT 
        TO_CHAR(AVG(EXTRACT(EPOCH FROM check_in)::int), 'FM00') || ':' || 
        TO_CHAR(MOD(AVG(EXTRACT(EPOCH FROM check_in)::int), 3600) / 60, 'FM00') as avg_time
      FROM attendance 
      WHERE DATE(check_in) = $1 
      AND status IN ('present', 'late')
    `, [today]);
    
    const avgCheckIn = avgCheckInQuery.rows[0]?.avg_time || '08:00';

    // 6. Attendance rate
    const attendanceRate = totalEmployees > 0 ? 
      `${Math.round((presentToday / totalEmployees) * 100)}%` : '0%';

    await pool.end();

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeave: pendingLeaves,
        departments: departmentsCount,
        avgCheckIn,
        attendanceRate
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const today = new Date().toISOString().split('T')[0];
    
    // Get recent attendance activities
    const activityQuery = await pool.query(`
      SELECT 
        a.id,
        a.user_id,
        a.check_in as time,
        a.status,
        'attendance' as type,
        u.name as user_name,
        u.employee_id,
        d.name as department
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE DATE(a.check_in) = $1
      ORDER BY a.check_in DESC
      LIMIT 8
    `, [today]);

    const activities = activityQuery.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      employee_id: row.employee_id,
      department: row.department,
      time: row.time,
      status: row.status,
      type: 'attendance'
    }));

    await pool.end();

    return NextResponse.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recent activity'
    }, { status: 500 });
  }
}
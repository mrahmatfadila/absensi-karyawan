import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    
    // 1. Check users table
    const usersResult = await pool.query(`
      SELECT 
        id, 
        employee_id, 
        name, 
        email, 
        role_id,
        department_id
      FROM users 
      ORDER BY id
    `);
    
    // 2. Check attendance table
    const attendanceResult = await pool.query(`
      SELECT 
        id,
        user_id,
        check_in,
        check_out,
        status,
        location
      FROM attendance 
      ORDER BY check_in DESC
      LIMIT 10
    `);
    
    // 3. Check departments table
    const departmentsResult = await pool.query(`
      SELECT id, name, description FROM departments ORDER BY id
    `);
    
    // 4. Check leave_requests table
    const leaveResult = await pool.query(`
      SELECT 
        id,
        user_id,
        leave_type,
        start_date,
        end_date,
        reason,
        status
      FROM leave_requests 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 5. Check enum types
    let enumTypes = [];
    try {
      const enumResult = await pool.query(`
        SELECT typname FROM pg_type WHERE typtype = 'e'
      `);
      enumTypes = enumResult.rows.map(row => row.typname);
    } catch (e) {
      // ignore enum check errors
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      counts: {
        users: usersResult.rowCount,
        attendance: attendanceResult.rowCount,
        departments: departmentsResult.rowCount,
        leave_requests: leaveResult.rowCount
      },
      data: {
        users: usersResult.rows,
        attendance: attendanceResult.rows,
        departments: departmentsResult.rows,
        leave_requests: leaveResult.rows
      },
      enumTypes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking data:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
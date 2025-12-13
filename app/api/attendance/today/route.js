import { NextResponse } from 'next/server';

export async function GET(request) {
  
  
  try {
    const { Pool } = await import('pg');
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database configuration missing'
      }, { status: 500 });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    
    if (!user_id) {
      await pool.end();
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 });
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum)) {
      await pool.end();
      return NextResponse.json({ error: 'User ID harus angka' }, { status: 400 });
    }

    // Today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // Query yang aman - hanya kolom yang pasti ada
    const query = `
      SELECT 
        id,
        user_id,
        check_in,
        check_out,
        status,
        created_at,
        updated_at
      FROM attendance 
      WHERE user_id = $1 
      AND check_in >= $2 
      AND check_in <= $3
      ORDER BY check_in DESC
      LIMIT 1
    `;
    
    
    const result = await pool.query(query, [userIdNum, todayStart, todayEnd]);
    await pool.end();
    
    
    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error in today API:', error.message);
    
    // Handle specific errors
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database schema mismatch',
        details: 'Some columns are missing in the attendance table',
        solution: 'Run the migration script to add missing columns'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Database error',
      details: error.message 
    }, { status: 500 });
  }
}
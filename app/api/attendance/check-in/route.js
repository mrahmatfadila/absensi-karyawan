import { NextResponse } from 'next/server';

export async function POST(request) {
  
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

    const body = await request.json();
    const { user_id, location } = body;
    
    

    if (!user_id) {
      await pool.end();
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 });
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum)) {
      await pool.end();
      return NextResponse.json({ error: 'User ID harus angka' }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Check if already checked in today
    const checkQuery = `
      SELECT id FROM attendance 
      WHERE user_id = $1 
      AND check_in >= $2 
      AND check_in < $3
    `;
    
    const checkResult = await pool.query(checkQuery, [userIdNum, todayStart, todayEnd]);
    

    if (checkResult.rows.length > 0) {
      await pool.end();
      return NextResponse.json({ 
        error: 'Anda sudah check-in hari ini',
        existingId: checkResult.rows[0].id 
      }, { status: 400 });
    }

    // Determine status based on check-in time
    const checkInTime = now.getHours() * 60 + now.getMinutes();
    const lateThreshold = 8 * 60 + 15; // 08:15
    let status = 'present';
    
    if (checkInTime > lateThreshold) {
      status = 'late';
    } else {
    }

    // Insert attendance record - versi aman
    const insertQuery = `
      INSERT INTO attendance (
        user_id, 
        check_in, 
        status, 
        created_at, 
        updated_at
        ${location ? ', location' : ''}
      )
      VALUES ($1, $2, $3, NOW(), NOW()
        ${location ? ', $4' : ''}
      )
      RETURNING *
    `;
    
    const params = location 
      ? [userIdNum, now, status, location]
      : [userIdNum, now, status];
    
    
    
    const result = await pool.query(insertQuery, params);
    await pool.end();
    
    

    return NextResponse.json({
      success: true,
      message: 'Check-in berhasil',
      attendance: result.rows[0]
    });

  } catch (error) {
    console.error('Error in check-in API:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database schema error',
        details: 'The location column might not exist',
        solution: 'Run: ALTER TABLE attendance ADD COLUMN location TEXT;'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server',
      details: error.message
    }, { status: 500 });
  }
}
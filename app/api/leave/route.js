import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET leave requests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 });
    }

    const query = `
      SELECT 
        lr.*,
        u.name as approver_name
      FROM leave_requests lr
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.user_id = $1
      ORDER BY lr.created_at DESC
    `;
    
    const result = await pool.query(query, [user_id]);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST new leave request
export async function POST(request) {
  try {
    const { user_id, leave_type, start_date, end_date, reason } = await request.json();

    if (!user_id || !leave_type || !start_date || !end_date || !reason) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    // Check for date overlap
    const overlapQuery = `
      SELECT id FROM leave_requests 
      WHERE user_id = $1 
      AND status != 'rejected'
      AND (
        ($2 BETWEEN start_date AND end_date) OR
        ($3 BETWEEN start_date AND end_date) OR
        (start_date BETWEEN $2 AND $3) OR
        (end_date BETWEEN $2 AND $3)
      )
    `;
    
    const overlapResult = await pool.query(overlapQuery, [user_id, start_date, end_date]);

    if (overlapResult.rows.length > 0) {
      return NextResponse.json({ error: 'Tanggal cuti bertabrakan dengan pengajuan sebelumnya' }, { status: 400 });
    }

    // Insert leave request
    const query = `
      INSERT INTO leave_requests (
        user_id, 
        leave_type, 
        start_date, 
        end_date, 
        reason, 
        status,
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, leave_type, start_date, end_date, reason]);

    return NextResponse.json({
      success: true,
      message: 'Pengajuan cuti berhasil',
      leave_request: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { attendance_id, user_id } = await request.json();

    if (!attendance_id || !user_id) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check if attendance exists and belongs to user
    const checkQuery = `
      SELECT id, check_out FROM attendance 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [attendance_id, user_id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Data absensi tidak ditemukan' }, { status: 404 });
    }

    if (checkResult.rows[0].check_out) {
      return NextResponse.json({ error: 'Anda sudah check-out hari ini' }, { status: 400 });
    }

    // Update check-out time
    const now = new Date();
    const query = `
      UPDATE attendance 
      SET check_out = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [now, attendance_id]);

    return NextResponse.json({
      success: true,
      message: 'Check-out berhasil',
      attendance: result.rows[0]
    });

  } catch (error) {
    console.error('Error check-out:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
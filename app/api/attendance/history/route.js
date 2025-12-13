import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance history
    const query = `
      SELECT 
        id,
        user_id,
        check_in,
        check_out,
        status,
        notes,
        created_at,
        updated_at,
        location
      FROM attendance 
      WHERE user_id = $1 
      AND DATE(check_in) >= $2 
      AND DATE(check_in) <= $3
      ORDER BY check_in DESC
    `;
    
    const result = await pool.query(query, [user_id, startDate, endDate]);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_count,
        COUNT(*) FILTER (WHERE status = 'late') as late_count,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_count
      FROM attendance 
      WHERE user_id = $1 
      AND EXTRACT(MONTH FROM check_in) = $2 
      AND EXTRACT(YEAR FROM check_in) = $3
    `;
    
    const statsResult = await pool.query(statsQuery, [user_id, month, year]);

    return NextResponse.json({
      data: result.rows,
      statistics: {
        totalHadir: parseInt(statsResult.rows[0]?.present_count || 0),
        totalTerlambat: parseInt(statsResult.rows[0]?.late_count || 0),
        totalAbsen: parseInt(statsResult.rows[0]?.absent_count || 0),
        totalCuti: 0 // You'll need to query from leave_requests table
      }
    });

  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
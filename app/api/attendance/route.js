import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Query dasar
    let queryStr = `
      SELECT a.*, u.name as user_name, u.employee_id
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const values = [];

    if (userId) {
      queryStr += ' AND a.user_id = ?';
      values.push(userId);
    }

    if (start && end) {
      queryStr += ' AND DATE(a.check_in) BETWEEN ? AND ?';
      values.push(start, end);
    }

    queryStr += ' ORDER BY a.check_in DESC LIMIT 50';

    console.log('Executing query:', queryStr);
    console.log('With values:', values);

    const results = await query({
      query: queryStr,
      values,
    });

    console.log('Query results:', results.length, 'records');

    // Jika tidak ada data, return array kosong
    return Response.json(results || []);
    
  } catch (error) {
    console.error('Database error:', error);
    
    // Return empty array jika error
    return Response.json([]);
  }
}

export async function POST(request) {
  try {
    const { type, notes } = await request.json();
    
    // Untuk testing, langsung return success
    return Response.json({
      success: true,
      message: `Check-${type} berhasil`
    });
    
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({
      success: false,
      error: 'Terjadi kesalahan'
    });
  }
}
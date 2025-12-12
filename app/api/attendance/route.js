// app/api/attendance/route.js
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = searchParams.get('limit');

    // Build query with JOIN to get user information
    let sqlQuery = `
      SELECT 
        a.id,
        a.user_id,
        a.check_in,
        a.check_out,
        a.status,
        a.notes,
        a.created_at,
        u.name as user_name,
        u.employee_id,
        u.email,
        d.name as department
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCounter = 1;

    // Filter by user_id if provided
    if (userId) {
      sqlQuery += ` AND a.user_id = $${paramCounter}`;
      values.push(userId);
      paramCounter++;
    }

    // Filter by date range if provided
    if (start) {
      sqlQuery += ` AND DATE(a.check_in) >= $${paramCounter}`;
      values.push(start);
      paramCounter++;
    }

    if (end) {
      sqlQuery += ` AND DATE(a.check_in) <= $${paramCounter}`;
      values.push(end);
      paramCounter++;
    }

    // Order by most recent first
    sqlQuery += ` ORDER BY a.check_in DESC`;

    // Add limit if provided
    if (limit) {
      sqlQuery += ` LIMIT $${paramCounter}`;
      values.push(parseInt(limit));
    }

    const attendance = await query({
      query: sqlQuery,
      values: values,
    });

    return Response.json(attendance, { status: 200 });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return Response.json(
      { 
        error: 'Gagal mengambil data absensi',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new attendance record
export async function POST(request) {
  try {
    const { user_id, check_in, check_out, status, notes } = await request.json();

    if (!user_id) {
      return Response.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const result = await query({
      query: `
        INSERT INTO attendance (user_id, check_in, check_out, status, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      values: [
        user_id,
        check_in || new Date(),
        check_out || null,
        status || 'present',
        notes || null
      ]
    });

    return Response.json({
      message: 'Absensi berhasil dicatat',
      success: true,
      data: result[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating attendance:', error);
    return Response.json(
      { error: 'Gagal mencatat absensi' },
      { status: 500 }
    );
  }
}

// PUT - Update attendance record
export async function PUT(request) {
  try {
    const { id, check_out, status, notes } = await request.json();

    if (!id) {
      return Response.json(
        { error: 'Attendance ID diperlukan' },
        { status: 400 }
      );
    }

    let updateFields = [];
    let values = [];
    let paramCounter = 1;

    if (check_out !== undefined) {
      updateFields.push(`check_out = $${paramCounter++}`);
      values.push(check_out);
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramCounter++}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCounter++}`);
      values.push(notes);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return Response.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query({
      query: `
        UPDATE attendance
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `,
      values: values
    });

    if (result.length === 0) {
      return Response.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Absensi berhasil diperbarui',
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return Response.json(
      { error: 'Gagal memperbarui absensi' },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance record
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'Attendance ID diperlukan' },
        { status: 400 }
      );
    }

    await query({
      query: 'DELETE FROM attendance WHERE id = $1',
      values: [id]
    });

    return Response.json({
      message: 'Absensi berhasil dihapus',
      success: true
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    return Response.json(
      { error: 'Gagal menghapus absensi' },
      { status: 500 }
    );
  }
}
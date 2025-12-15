// app/api/manager/leave-requests/[id]/reject/route.js
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userData = JSON.parse(request.headers.get('user') || '{}');
    const managerId = userData.id;
    
    if (!managerId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify leave request belongs to manager's department
    const verifyQuery = await query({
      query: `
        SELECT lr.id, u.department_id 
        FROM leave_requests lr
        INNER JOIN users u ON lr.user_id = u.id
        WHERE lr.id = $1
      `,
      values: [id]
    });

    if (verifyQuery.length === 0) {
      return Response.json({ error: 'Pengajuan cuti tidak ditemukan' }, { status: 404 });
    }

    const managerDept = await query({
      query: `SELECT department_id FROM users WHERE id = $1`,
      values: [managerId]
    });

    if (verifyQuery[0].department_id !== managerDept[0].department_id) {
      return Response.json({ error: 'Anda tidak memiliki izin untuk menolak cuti ini' }, { status: 403 });
    }

    // Update leave request status to rejected
    await query({
      query: `
        UPDATE leave_requests 
        SET 
          status = 'rejected',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id
      `,
      values: [managerId, id]
    });

    return Response.json({ 
      success: true, 
      message: 'Pengajuan cuti berhasil ditolak' 
    });

  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return Response.json(
      { error: 'Gagal menolak pengajuan cuti' },
      { status: 500 }
    );
  }
}
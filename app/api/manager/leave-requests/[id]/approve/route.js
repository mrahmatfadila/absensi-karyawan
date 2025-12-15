// app/api/manager/leave-requests/[id]/approve/route.js
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Get user data from request BODY (not headers)
    const body = await request.json();
    const userData = body.userData || JSON.parse(request.headers.get('user') || '{}');
    
    const managerId = userData.id;
    const managerDepartmentId = userData.department_id;
    
    if (!managerId || !managerDepartmentId) {
      console.error('[APPROVE] Missing user data:', { managerId, managerDepartmentId });
      return Response.json({ error: 'Unauthorized - User data missing' }, { status: 401 });
    }

    console.log(`[APPROVE] Manager ${managerId} (dept ${managerDepartmentId}) approving leave ${id}`);

    // First check if leave request exists
    const leaveCheck = await query({
      query: `SELECT id FROM leave_requests WHERE id = $1`,
      values: [id]
    });

    if (leaveCheck.length === 0) {
      return Response.json({ error: 'Pengajuan cuti tidak ditemukan' }, { status: 404 });
    }

    // Verify the leave request belongs to manager's department
    const verifyQuery = await query({
      query: `
        SELECT 
          lr.id,
          lr.user_id,
          u.department_id,
          u.name as user_name,
          d.name as department_name
        FROM leave_requests lr
        INNER JOIN users u ON lr.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE lr.id = $1 AND u.department_id = $2
      `,
      values: [id, managerDepartmentId]
    });

    if (verifyQuery.length === 0) {
      // Check which department it actually belongs to
      const deptCheck = await query({
        query: `
          SELECT u.department_id, d.name 
          FROM leave_requests lr
          INNER JOIN users u ON lr.user_id = u.id
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE lr.id = $1
        `,
        values: [id]
      });
      
      if (deptCheck.length > 0) {
        console.error(`[APPROVE] Department mismatch: Manager ${managerDepartmentId}, Leave ${deptCheck[0].department_id}`);
      }
      
      return Response.json({ 
        error: 'Anda tidak memiliki izin untuk menyetujui cuti ini. Departemen tidak sesuai.' 
      }, { status: 403 });
    }

    const userName = verifyQuery[0].user_name;

    // Update leave request
    const updateResult = await query({
      query: `
        UPDATE leave_requests 
        SET 
          status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, approved_by, approved_at
      `,
      values: [managerId, id]
    });

    console.log(`[APPROVE] Success: Leave ${id} approved for ${userName}`);

    return Response.json({ 
      success: true, 
      message: `Cuti untuk ${userName} berhasil disetujui`,
      data: updateResult[0]
    });

  } catch (error) {
    console.error('[APPROVE] Error:', error);
    return Response.json(
      { error: 'Gagal menyetujui pengajuan cuti', details: error.message },
      { status: 500 }
    );
  }
}
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const userData = JSON.parse(request.headers.get('user') || '{}');
    const managerId = userData.id;
    const managerDepartmentId = userData.department_id;

    if (!managerId || !managerDepartmentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[LEAVE API] Manager: ${managerId}, Dept: ${managerDepartmentId}`);

    // Get leave requests from users in manager's department
    const leaveQuery = await query({
      query: `
        SELECT 
          lr.id,
          lr.user_id,
          lr.leave_type,
          lr.start_date,
          lr.end_date,
          lr.reason,
          lr.status,
          lr.approved_by,
          lr.approved_at,
          lr.created_at,
          lr.updated_at,
          u.name as user_name,
          u.employee_id,
          u.department_id,
          u.position,
          d.name as department_name,
          m.name as approved_by_name
        FROM leave_requests lr
        INNER JOIN users u ON lr.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN users m ON lr.approved_by = m.id
        WHERE u.department_id = $1
        AND u.id != $2  -- Exclude manager's own leave requests
        ORDER BY 
          CASE lr.status 
            WHEN 'pending' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'rejected' THEN 3
          END,
          lr.created_at DESC
      `,
      values: [managerDepartmentId, managerId]
    });

    console.log(`[LEAVE API] Found ${leaveQuery.length} leave requests`);

    return Response.json(leaveQuery);

  } catch (error) {
    console.error('[LEAVE API] Error:', error);
    
    // Fallback untuk testing
    const managerDepartmentId = JSON.parse(request.headers.get('user') || '{}').department_id;
    
    return Response.json([
      {
        id: 1,
        user_id: 101,
        user_name: 'Budi Santoso',
        employee_id: 'EMP101',
        leave_type: 'annual',
        start_date: '2024-01-15',
        end_date: '2024-01-17',
        reason: 'Cuti tahunan',
        status: 'pending',
        department_id: managerDepartmentId || 5,
        department_name: 'IT Department',
        position: 'Senior Developer',
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 2,
        user_id: 102,
        user_name: 'Siti Nurhaliza',
        employee_id: 'EMP102',
        leave_type: 'sick',
        start_date: '2024-01-18',
        end_date: '2024-01-19',
        reason: 'Sakit flu',
        status: 'pending',
        department_id: managerDepartmentId || 5,
        department_name: 'IT Department',
        position: 'UI/UX Designer',
        created_at: '2024-01-12T09:30:00Z'
      }
    ]);
  }
}
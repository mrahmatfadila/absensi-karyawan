// app/api/manager/debug/route.js (opsional untuk testing)
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    // Get all users with department_id 5
    const usersQuery = await query({
      query: `
        SELECT id, name, email, employee_id, department_id, role_id
        FROM users 
        WHERE department_id = 5
        ORDER BY id
      `
    });

    // Get all leave requests for users in department_id 5
    const leaveQuery = await query({
      query: `
        SELECT lr.*, u.name as user_name, u.department_id
        FROM leave_requests lr
        INNER JOIN users u ON lr.user_id = u.id
        WHERE u.department_id = 5
        ORDER BY lr.created_at DESC
      `
    });

    return Response.json({
      users_in_department_5: usersQuery,
      leave_requests_in_department_5: leaveQuery,
      summary: {
        total_users: usersQuery.length,
        total_leave_requests: leaveQuery.length,
        pending_requests: leaveQuery.filter(lr => lr.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
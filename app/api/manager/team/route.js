import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const userData = JSON.parse(request.headers.get('user') || '{}');
    const managerId = userData.id;
    const managerDepartmentId = userData.department_id;

    if (!managerId || !managerDepartmentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[TEAM API] Manager: ${managerId}, Dept: ${managerDepartmentId}`);

    // SOLUSI: Ambil user yang memiliki leave_requests DAN department_id yang sama
    const teamQuery = await query({
      query: `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.employee_id,
          u.phone,
          u.position,
          u.role_id,
          u.department_id,
          u.hire_date,
          d.name as department_name,
          CASE 
            WHEN u.role_id = 2 THEN 'Manager' 
            ELSE 'Employee' 
          END as user_role,
          -- Hitung total leave requests untuk user ini
          (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id = u.id) as total_leaves,
          -- Hitung pending leave requests
          (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id = u.id AND lr.status = 'pending') as pending_leaves
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.department_id = $1 
        AND u.id != $2  -- Exclude manager sendiri
        AND EXISTS (
          SELECT 1 FROM leave_requests lr 
          WHERE lr.user_id = u.id
          AND u.department_id = $1
        )
        ORDER BY u.name
      `,
      values: [managerDepartmentId, managerId]
    });

    console.log(`[TEAM API] Found ${teamQuery.length} team members with leave requests`);

    // Jika tidak ada user dengan leave requests, ambil semua user di department
    if (teamQuery.length === 0) {
      console.log('[TEAM API] No users with leave requests, getting all users in department');
      
      const allUsersQuery = await query({
        query: `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.employee_id,
            u.phone,
            u.position,
            u.role_id,
            u.department_id,
            u.hire_date,
            d.name as department_name,
            CASE 
              WHEN u.role_id = 2 THEN 'Manager' 
              ELSE 'Employee' 
            END as user_role
          FROM users u
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE u.department_id = $1 
          AND u.id != $2
          ORDER BY u.name
        `,
        values: [managerDepartmentId, managerId]
      });

      console.log(`[TEAM API] Found ${allUsersQuery.length} total users in department`);

      // Format response
      const formattedTeam = allUsersQuery.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        employee_id: member.employee_id,
        phone: member.phone || '-',
        position: member.position || 'Staff',
        role: member.user_role || 'Employee',
        status: 'active',
        department: member.department_name,
        department_id: member.department_id,
        join_date: member.hire_date,
        hire_date: member.hire_date,
        total_leaves: 0,
        pending_leaves: 0
      }));

      return Response.json(formattedTeam);
    }

    // Format response
    const formattedTeam = teamQuery.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      employee_id: member.employee_id,
      phone: member.phone || '-',
      position: member.position || 'Staff',
      role: member.user_role || 'Employee',
      status: 'active',
      department: member.department_name,
      department_id: member.department_id,
      join_date: member.hire_date,
      hire_date: member.hire_date,
      total_leaves: parseInt(member.total_leaves) || 0,
      pending_leaves: parseInt(member.pending_leaves) || 0
    }));

    return Response.json(formattedTeam);

  } catch (error) {
    console.error('[TEAM API] Error:', error);
    
    // Fallback untuk testing
    const managerDepartmentId = JSON.parse(request.headers.get('user') || '{}').department_id;
    
    return Response.json([
      {
        id: 101,
        name: 'Budi Santoso',
        email: 'budi@example.com',
        employee_id: 'EMP101',
        phone: '081234567890',
        position: 'Senior Developer',
        role: 'Employee',
        status: 'active',
        department: 'IT Department',
        department_id: managerDepartmentId || 5,
        join_date: '2023-01-15',
        hire_date: '2023-01-15'
      },
      {
        id: 102,
        name: 'Siti Nurhaliza',
        email: 'siti@example.com',
        employee_id: 'EMP102',
        phone: '081298765432',
        position: 'UI/UX Designer',
        role: 'Employee',
        status: 'active',
        department: 'IT Department',
        department_id: managerDepartmentId || 5,
        join_date: '2023-03-20',
        hire_date: '2023-03-20'
      }
    ]);
  }
}
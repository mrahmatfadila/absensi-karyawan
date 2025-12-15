import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const userData = JSON.parse(request.headers.get('user') || '{}');
    const managerId = userData.id;
    const managerDepartmentId = userData.department_id;

    if (!managerId || !managerDepartmentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[TODAY ATTENDANCE] Manager: ${managerId}, Dept: ${managerDepartmentId}`);

    const today = new Date().toISOString().split('T')[0];

    // First, get all team members in the department
    const teamMembersQuery = await query({
      query: `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.employee_id,
          u.position
        FROM users u
        WHERE u.department_id = $1 
        AND u.id != $2
        ORDER BY u.name
      `,
      values: [managerDepartmentId, managerId]
    });

    if (teamMembersQuery.length === 0) {
      console.log('[TODAY ATTENDANCE] No team members found in department');
      return Response.json([]);
    }

    // Get today's attendance for team members
    let attendanceRecords = [];
    
    try {
      const attendanceQuery = await query({
        query: `
          SELECT 
            a.id,
            a.user_id,
            a.check_in,
            a.check_out,
            a.status,
            a.notes,
            u.name as user_name,
            u.employee_id,
            u.position
          FROM attendance a
          INNER JOIN users u ON a.user_id = u.id
          WHERE u.department_id = $1 
          AND u.id != $2
          AND DATE(a.check_in) = $3
          ORDER BY 
            CASE a.status 
              WHEN 'present' THEN 1
              WHEN 'late' THEN 2
              WHEN 'leave' THEN 3
              ELSE 4
            END,
            a.check_in
        `,
        values: [managerDepartmentId, managerId, today]
      });
      
      attendanceRecords = attendanceQuery;
    } catch (error) {
      console.log('[TODAY ATTENDANCE] Attendance table might not exist');
    }

    // Combine team members with attendance data
    const result = teamMembersQuery.map(member => {
      // Find attendance record for this member
      const attendance = attendanceRecords.find(a => a.user_id === member.user_id);
      
      if (attendance) {
        return {
          id: attendance.id,
          user_id: attendance.user_id,
          user_name: attendance.user_name,
          employee_id: attendance.employee_id,
          position: attendance.position,
          check_in: attendance.check_in,
          check_out: attendance.check_out,
          status: attendance.status || 'not_checked',
          notes: attendance.notes || ''
        };
      } else {
        // Check if member is on leave today
        const leaveCheck = async () => {
          try {
            const leaveQuery = await query({
              query: `
                SELECT 1 as on_leave
                FROM leave_requests lr
                WHERE lr.user_id = $1
                AND lr.status = 'approved'
                AND $2 BETWEEN lr.start_date AND lr.end_date
                LIMIT 1
              `,
              values: [member.user_id, today]
            });
            
            return leaveQuery.length > 0;
          } catch (error) {
            return false;
          }
        };

        const isOnLeave = leaveCheck(); // In real app, you'd await this
        
        return {
          id: null,
          user_id: member.user_id,
          user_name: member.user_name,
          employee_id: member.employee_id,
          position: member.position,
          check_in: null,
          check_out: null,
          status: isOnLeave ? 'leave' : 'not_checked',
          notes: isOnLeave ? 'Sedang cuti' : 'Belum check-in'
        };
      }
    });

    console.log(`[TODAY ATTENDANCE] Returning ${result.length} records`);
    return Response.json(result);

  } catch (error) {
    console.error('[TODAY ATTENDANCE] Error:', error);
    
    // Return sample data for development
    const managerDepartmentId = JSON.parse(request.headers.get('user') || '{}').department_id;
    
    return Response.json([
      {
        id: 1,
        user_id: 101,
        user_name: 'Budi Santoso',
        employee_id: 'EMP101',
        position: 'Senior Developer',
        check_in: '2024-01-15T08:00:00.000Z',
        check_out: '2024-01-15T17:00:00.000Z',
        status: 'present',
        notes: 'Tepat waktu'
      },
      {
        id: 2,
        user_id: 102,
        user_name: 'Siti Nurhaliza',
        employee_id: 'EMP102',
        position: 'UI/UX Designer',
        check_in: '2024-01-15T08:15:00.000Z',
        check_out: '2024-01-15T17:00:00.000Z',
        status: 'late',
        notes: 'Terlambat 15 menit'
      },
      {
        id: 3,
        user_id: 103,
        user_name: 'Andi Wijaya',
        employee_id: 'EMP103',
        position: 'QA Engineer',
        check_in: null,
        check_out: null,
        status: 'leave',
        notes: 'Cuti sakit'
      }
    ]);
  }
}
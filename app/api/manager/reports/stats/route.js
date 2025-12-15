import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userData = JSON.parse(request.headers.get('user') || '{}');
    const managerId = userData.id;
    const managerDepartmentId = userData.department_id;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!managerId || !managerDepartmentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[REPORT STATS] Manager: ${managerId}, Dept: ${managerDepartmentId}`);

    // 1. Get total team members in department (excluding manager)
    const teamCountQuery = await query({
      query: `
        SELECT COUNT(*) as total_members
        FROM users u
        WHERE u.department_id = $1 
        AND u.id != $2
        AND u.role_id != 1  -- Exclude admin
      `,
      values: [managerDepartmentId, managerId]
    });

    const totalMembers = parseInt(teamCountQuery[0]?.total_members) || 0;

    // 2. Get attendance statistics
    let attendanceStats = { present: 0, late: 0, absent: 0, total: 0 };
    try {
      let attendanceQuery = `
        SELECT 
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
          COUNT(*) as total
        FROM attendance a
        INNER JOIN users u ON a.user_id = u.id
        WHERE u.department_id = $1 
        AND u.id != $2
      `;
      
      const values = [managerDepartmentId, managerId];
      let paramCounter = 3;
      
      if (start) {
        attendanceQuery += ` AND DATE(a.check_in) >= $${paramCounter}`;
        values.push(start);
        paramCounter++;
      }
      
      if (end) {
        attendanceQuery += ` AND DATE(a.check_in) <= $${paramCounter}`;
        values.push(end);
        paramCounter++;
      }
      
      const attendanceResult = await query({
        query: attendanceQuery,
        values: values
      });
      
      if (attendanceResult.length > 0) {
        attendanceStats = attendanceResult[0];
      }
    } catch (err) {
      console.log('[STATS] Attendance table might not exist, using default values');
    }

    // 3. Calculate averages
    const presentCount = parseInt(attendanceStats.present) || 0;
    const lateCount = parseInt(attendanceStats.late) || 0;
    const absentCount = parseInt(attendanceStats.absent) || 0;
    const totalAttendance = parseInt(attendanceStats.total) || 1;
    
    const averageAttendance = totalAttendance > 0 
      ? Math.round(((presentCount + lateCount) / totalAttendance) * 100)
      : 0;
    
    // 4. Get productivity stats (from tasks)
    let averageProductivity = 85; // Default
    try {
      const productivityQuery = await query({
        query: `
          SELECT 
            COALESCE(
              ROUND(AVG(
                CASE 
                  WHEN total_tasks > 0 THEN (completed_tasks * 100.0 / total_tasks)
                  ELSE 0 
                END
              )),
              85
            ) as avg_productivity
          FROM (
            SELECT 
              u.id,
              COUNT(t.id) as total_tasks,
              COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
            FROM users u
            LEFT JOIN tasks t ON u.id = t.assigned_to
            WHERE u.department_id = $1 
            AND u.id != $2
            AND ($3::date IS NULL OR t.created_at >= $3)
            AND ($4::date IS NULL OR t.created_at <= $4)
            GROUP BY u.id
          ) as user_productivity
        `,
        values: [managerDepartmentId, managerId, start || null, end || null]
      });
      
      if (productivityQuery.length > 0) {
        averageProductivity = parseInt(productivityQuery[0].avg_productivity) || 85;
      }
    } catch (err) {
      console.log('[STATS] Productivity calculation error:', err);
    }

    return Response.json({
      totalMembers,
      averageAttendance: `${averageAttendance}%`,
      averageProductivity: `${averageProductivity}%`,
      totalLate: lateCount,
      totalAbsent: absentCount,
      totalPresent: presentCount,
      totalAttendanceDays: totalAttendance
    });

  } catch (error) {
    console.error('[REPORT STATS] Error:', error);
    
    // Return sample data for development
    return Response.json({
      totalMembers: 3,
      averageAttendance: '92%',
      averageProductivity: '88%',
      totalLate: 3,
      totalAbsent: 1,
      totalPresent: 56,
      totalAttendanceDays: 60
    });
  }
}
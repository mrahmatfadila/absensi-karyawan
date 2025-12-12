import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Tambahkan await
    
    console.log('Fetching user ID:', id);
    
    // Query untuk mengambil data user
    const users = await query({
      query: `
        SELECT 
          u.id, 
          u.employee_id, 
          u.name, 
          u.email, 
          u.position, 
          u.hire_date, 
          d.name as department, 
          r.name as role,
          DATE_FORMAT(u.created_at, '%d %b %Y') as join_date
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `,
      values: [id],
    });

    console.log('Query result:', users);

    if (users.length === 0) {
      console.log('User not found with ID:', id);
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    return Response.json(
      { error: 'Failed to fetch user: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, position, department_id, role_id, hire_date, password } = body;
    
    console.log('Updating user ID:', id, 'with data:', body);

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (role_id !== undefined) {
      updates.push('role_id = ?');
      values.push(role_id);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    
    if (department_id !== undefined) {
      updates.push('department_id = ?');
      values.push(department_id || null);
    }
    
    if (role_id !== undefined) {
      updates.push('role_id = ?');
      values.push(role_id);
    }
    
    if (hire_date !== undefined) {
      updates.push('hire_date = ?');
      values.push(hire_date);
    }
    
    if (password) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return Response.json(
        { error: 'No data to update' },
        { status: 400 }
      );
    }

    values.push(id);

    await query({
      query: `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values,
    });

    return Response.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return Response.json(
      { error: 'Failed to update user: ' + error.message },
      { status: 500 }
    );
  }
}
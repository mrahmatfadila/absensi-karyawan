import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Ambil semua users
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update query untuk include role_id:
      const users = await query({
        query: `
          SELECT u.id, u.employee_id, u.name, u.email, u.position, 
                u.hire_date, u.role_id, d.name as department, r.name as role,
                DATE_FORMAT(u.created_at, '%d %b %Y') as join_date
          FROM users u
          LEFT JOIN departments d ON u.department_id = d.id
          JOIN roles r ON u.role_id = r.id
          ORDER BY u.created_at DESC
        `,
      });

    return Response.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: Tambah user baru
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { employee_id, name, email, password, role_id, department_id, position, hire_date } = await request.json();

    const result = await query({
      query: `
        INSERT INTO users 
        (employee_id, name, email, password, role_id, department_id, position, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [employee_id, name, email, password, role_id, department_id, position, hire_date],
    });

    return Response.json({
      id: result.insertId,
      message: 'User created successfully',
      success: true,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return Response.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT: Update user
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, name, email, role_id, department_id, position } = await request.json();

    await query({
      query: `
        UPDATE users 
        SET name = ?, email = ?, role_id = ?, department_id = ?, position = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [name, email, role_id, department_id, position, id],
    });

    return Response.json({
      message: 'User updated successfully',
      success: true,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return Response.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus user
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await query({
      query: 'DELETE FROM users WHERE id = ?',
      values: [id],
    });

    return Response.json({
      message: 'User deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
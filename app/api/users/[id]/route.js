// app/api/users/[id]/route.js
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// GET - Fetch single user
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const users = await query({
      query: `
        SELECT 
          u.id,
          u.employee_id,
          u.name,
          u.email,
          u.position,
          u.hire_date,
          u.created_at,
          u.role_id,
          r.name as role,
          d.name as department,
          d.id as department_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = $1
      `,
      values: [id],
    });

    if (users.length === 0) {
      return Response.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return Response.json(users[0]);

  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json(
      { error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { 
      employee_id, 
      name, 
      email, 
      password,
      role_id, 
      department_id, 
      position, 
      hire_date 
    } = body;

    // Build dynamic update query
    let updateFields = [];
    let values = [];
    let paramCounter = 1;

    if (employee_id !== undefined) {
      updateFields.push(`employee_id = $${paramCounter++}`);
      values.push(employee_id);
    }
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter++}`);
      values.push(name);
    }
    
    if (email !== undefined) {
      updateFields.push(`email = $${paramCounter++}`);
      values.push(email);
    }
    
    if (password) {
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password = $${paramCounter++}`);
      values.push(hashedPassword);
    }
    
    if (role_id !== undefined) {
      updateFields.push(`role_id = $${paramCounter++}`);
      values.push(role_id);
    }
    
    if (department_id !== undefined) {
      updateFields.push(`department_id = $${paramCounter++}`);
      values.push(department_id || null);
    }
    
    if (position !== undefined) {
      updateFields.push(`position = $${paramCounter++}`);
      values.push(position || null);
    }
    
    if (hire_date !== undefined) {
      updateFields.push(`hire_date = $${paramCounter++}`);
      values.push(hire_date || null);
    }

    // Always update updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) { // Only updated_at
      return Response.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    // Add id as last parameter
    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await query({
      query: updateQuery,
      values: values,
    });

    if (result.length === 0) {
      return Response.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Data pengguna berhasil diperbarui',
      success: true,
      user: result[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === '23505') {
      return Response.json(
        { error: 'Email atau ID Karyawan sudah digunakan' },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: 'Gagal memperbarui data pengguna' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await query({
      query: 'DELETE FROM users WHERE id = $1',
      values: [id],
    });

    return Response.json({
      message: 'Pengguna berhasil dihapus',
      success: true
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json(
      { error: 'Gagal menghapus pengguna' },
      { status: 500 }
    );
  }
}
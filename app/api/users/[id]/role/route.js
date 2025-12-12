// app/api/users/[id]/role/route.js
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { role_id } = await request.json();

    // Validasi input
    if (!role_id) {
      return Response.json(
        { error: 'Role ID diperlukan' },
        { status: 400 }
      );
    }

    // Validasi role_id harus 1, 2, atau 3
    const validRoleIds = [1, 2, 3];
    if (!validRoleIds.includes(parseInt(role_id))) {
      return Response.json(
        { error: 'Role ID tidak valid. Harus 1 (admin), 2 (manager), atau 3 (employee)' },
        { status: 400 }
      );
    }

    // Update role user
    const result = await query({
      query: `
        UPDATE users 
        SET role_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, employee_id, name, email, role_id
      `,
      values: [parseInt(role_id), id],
    });

    if (result.length === 0) {
      return Response.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedUser = result[0];

    // Get role name
    const roleNames = {
      1: 'admin',
      2: 'manager',
      3: 'employee'
    };

    return Response.json({
      message: 'Role berhasil diubah',
      success: true,
      user: {
        ...updatedUser,
        role: roleNames[updatedUser.role_id]
      }
    });

  } catch (error) {
    console.error('Error updating role:', error);
    
    // Handle foreign key constraint error
    if (error.code === '23503') {
      return Response.json(
        { error: 'Role ID tidak valid dalam database' },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Gagal mengubah role',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
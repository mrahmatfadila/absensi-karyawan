import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const adminUser = adminCheck.user;
    const { id } = await params;
    const { role_id } = await request.json();

    console.log(`Admin ${adminUser.id} changing role for user ${id} to ${role_id}`);

    // Validasi role_id
    if (![1, 2, 3].includes(role_id)) {
      return Response.json(
        { error: 'Invalid role ID. Must be 1 (admin), 2 (manager), or 3 (employee).' },
        { status: 400 }
      );
    }

    // Cek jika user mencoba mengubah role dirinya sendiri
    if (parseInt(id) === adminUser.id) {
      return Response.json(
        { error: 'You cannot change your own role.' },
        { status: 400 }
      );
    }

    // Update role
    await query({
      query: 'UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?',
      values: [role_id, id],
    });

    return Response.json({
      success: true,
      message: 'User role updated successfully',
      new_role_id: role_id
    });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json(
      { error: 'Failed to update user role: ' + error.message },
      { status: 500 }
    );
  }
}
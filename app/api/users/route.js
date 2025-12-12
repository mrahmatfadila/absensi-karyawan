// app/api/users/route.js
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// GET - Fetch all users
export async function GET() {
  try {
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
          r.name as role,
          r.id as role_id,
          d.name as department
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.created_at DESC
      `,
      values: [],
    });

    return Response.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json(
      { error: 'Gagal mengambil data pengguna', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new user (from admin panel)
export async function POST(request) {
  try {
    const { 
      employee_id, 
      name, 
      email, 
      password, 
      role_id, 
      department_id, 
      position, 
      hire_date 
    } = await request.json();

    // Validasi input
    if (!employee_id || !name || !email || !password) {
      return Response.json(
        { error: 'Employee ID, nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingEmail = await query({
      query: 'SELECT id FROM users WHERE email = $1',
      values: [email],
    });

    if (existingEmail.length > 0) {
      return Response.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Cek apakah employee_id sudah ada
    const existingEmployee = await query({
      query: 'SELECT id FROM users WHERE employee_id = $1',
      values: [employee_id],
    });

    if (existingEmployee.length > 0) {
      return Response.json(
        { error: 'ID Karyawan sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await query({
      query: `
        INSERT INTO users 
        (employee_id, name, email, password, role_id, department_id, position, hire_date) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `,
      values: [
        employee_id,
        name,
        email,
        hashedPassword,
        role_id || 3, // Default employee
        department_id || null,
        position || null,
        hire_date || new Date().toISOString().split('T')[0]
      ]
    });

    const newUser = result[0];

    return Response.json({
      id: newUser.id,
      employee_id: newUser.employee_id,
      name: newUser.name,
      email: newUser.email,
      message: 'Pengguna berhasil ditambahkan',
      success: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle PostgreSQL errors
    if (error.code === '23505') {
      return Response.json(
        { error: 'Email atau ID Karyawan sudah terdaftar' },
        { status: 400 }
      );
    }
    
    if (error.code === '23503') {
      return Response.json(
        { error: 'Department ID atau Role ID tidak valid' },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Terjadi kesalahan server',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

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
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { employee_id, name, email, password, department_id, position } = await request.json();

    // Validasi input
    if (!employee_id || !name || !email || !password) {
      return Response.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await query({
      query: 'SELECT id FROM users WHERE email = $1',
      values: [email],
    });

    if (existingUser.length > 0) {
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

    // Default role: employee (role_id = 3)
    const result = await query({
      query: `INSERT INTO users (employee_id, name, email, password, role_id, department_id, position, hire_date) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      values: [employee_id, name, email, hashedPassword, role_id, department_id, position, hire_date]
    });

    return Response.json({
      id: result.insertId,
      message: 'Registrasi berhasil',
      success: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
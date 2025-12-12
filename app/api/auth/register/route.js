// app/api/auth/register/route.js
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

    // Karena role_id sudah punya DEFAULT 3 di database, kita bisa skip atau set manual
    // hire_date juga bisa pakai tanggal sekarang
    const result = await query({
      query: `INSERT INTO users (employee_id, name, email, password, department_id, position, hire_date) 
              VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *`,
      values: [
        employee_id, 
        name, 
        email, 
        hashedPassword, 
        department_id || null, // Akan jadi NULL jika kosong
        position || null       // Akan jadi NULL jika kosong
      ]
    });

    // PostgreSQL mengembalikan array, ambil item pertama
    const newUser = result[0];

    return Response.json({
      id: newUser.id,
      employee_id: newUser.employee_id,
      name: newUser.name,
      email: newUser.email,
      message: 'Registrasi berhasil',
      success: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle error spesifik PostgreSQL
    if (error.code === '23505') { // Unique violation
      return Response.json(
        { error: 'Email atau ID Karyawan sudah terdaftar' },
        { status: 400 }
      );
    }
    
    if (error.code === '23503') { // Foreign key violation
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
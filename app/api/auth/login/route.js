import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Cari user berdasarkan email
    const users = await query({
      query: `
        SELECT u.*, r.name as role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ?
      `,
      values: [email],
    });

    if (users.length === 0) {
      return Response.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verifikasi password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Buat token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role_name,
    });

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
    });

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    return Response.json({
      success: true,
      user: {
        ...userWithoutPassword,
        role: user.role_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
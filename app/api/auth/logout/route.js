import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete('token');
    
    return Response.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
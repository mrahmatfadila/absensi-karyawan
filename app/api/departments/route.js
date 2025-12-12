import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Ambil semua departments
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const departments = await query({
      query: 'SELECT * FROM departments ORDER BY name',
    });

    return Response.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    return Response.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST: Tambah department baru
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    const result = await query({
      query: 'INSERT INTO departments (name, description) VALUES ($1, $2)',
      values: [name, description],
    });

    return Response.json({
      id: result.insertId,
      message: 'Department created successfully',
      success: true,
    });
  } catch (error) {
    console.error('Create department error:', error);
    return Response.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
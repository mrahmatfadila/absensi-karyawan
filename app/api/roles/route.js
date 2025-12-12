import { query } from '@/lib/db';

export async function GET() {
  try {
    const roles = await query({
      query: 'SELECT * FROM roles ORDER BY id',
    });

    return Response.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    return Response.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
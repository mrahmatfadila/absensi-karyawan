// app/api/roles/route.js
import { query } from '@/lib/db';

export async function GET() {
  try {
    const roles = await query({
      query: 'SELECT * FROM roles ORDER BY id',
      values: [],
    });

    return Response.json(roles, { status: 200 });
  } catch (error) {
    console.error('Error fetching roles:', error);
    
    // Return default roles if database query fails
    return Response.json([
      { id: 1, name: 'admin' },
      { id: 2, name: 'manager' },
      { id: 3, name: 'employee' }
    ], { status: 200 });
  }
}
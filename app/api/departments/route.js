// app/api/departments/route.js
import { query } from '@/lib/db';

export async function GET() {
  try {
    const departments = await query({
      query: 'SELECT id, name FROM departments ORDER BY name ASC',
      values: [],
    });

    return Response.json(departments, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    
    return Response.json(
      { 
        error: 'Failed to fetch departments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
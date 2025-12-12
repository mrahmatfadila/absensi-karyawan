import pool from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Test query sederhana
    const result1 = await pool.query('SELECT 1 + 1 AS result');
    
    // Test koneksi ke table users
    const result2 = await pool.query('SELECT COUNT(*) as count FROM users LIMIT 1');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      testQuery: result1.rows,
      tableCheck: result2.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      errorDetails: error.stack
    }, { status: 500 });
  }
}
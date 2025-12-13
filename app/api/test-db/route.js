import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // Cek environment variables
    console.log('ENV CHECK:');
    console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('- DATABASE_URL preview:', process.env.DATABASE_URL ? 
      `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET');
    
    // Coba koneksi ke PostgreSQL
    const { Pool } = await import('pg');
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not set in environment',
        env: process.env
      }, { status: 500 });
    }

    // Parse connection string untuk debugging
    let connectionInfo;
    try {
      const url = new URL(process.env.DATABASE_URL);
      connectionInfo = {
        host: url.hostname,
        port: url.port,
        database: url.pathname.substring(1),
        user: url.username,
        hasPassword: !!url.password,
        ssl: url.searchParams.get('sslmode') === 'require'
      };
    } catch (e) {
      connectionInfo = { error: 'Invalid DATABASE_URL format' };
    }

    console.log('Connection info:', connectionInfo);

    // Buat pool dengan SSL config untuk NeonDB
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });

    // Test query sederhana
    const result = await pool.query('SELECT NOW() as time, version() as version');
    
    // Test jika ada tabel yang diperlukan
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Check attendance table
    let attendanceColumns = [];
    try {
      const colsQuery = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'attendance'
      `);
      attendanceColumns = colsQuery.rows;
    } catch (e) {
      console.log('Attendance table might not exist:', e.message);
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      connection: {
        time: result.rows[0].time,
        version: result.rows[0].version,
        connectionInfo
      },
      tables: tablesQuery.rows.map(row => row.table_name),
      attendanceColumns,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        node_version: process.version
      }
    });

  } catch (error) {
    console.error('=== DATABASE CONNECTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check specific errors
    let errorType = 'unknown';
    let solution = 'Check your database connection';
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      errorType = 'DNS_ERROR';
      solution = 'Hostname tidak ditemukan. Cek DATABASE_URL';
    } else if (error.message.includes('self signed certificate')) {
      errorType = 'SSL_ERROR';
      solution = 'Gunakan ssl: { rejectUnauthorized: false }';
    } else if (error.message.includes('password authentication failed')) {
      errorType = 'AUTH_ERROR';
      solution = 'Username/password salah';
    } else if (error.message.includes('connection refused')) {
      errorType = 'CONNECTION_REFUSED';
      solution = 'Database tidak berjalan atau port salah';
    } else if (error.message.includes('does not exist')) {
      errorType = 'DATABASE_NOT_FOUND';
      solution = 'Database tidak ada. Buat database terlebih dahulu';
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      errorType,
      solution,
      envCheck: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? 
          `${process.env.DATABASE_URL.substring(0, 20)}...` : null
      }
    }, { status: 500 });
  }
}
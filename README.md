# Sistem Absensi Karyawan

Sistem absensi karyawan modern yang dibangun dengan Next.js 14, MySQL, dan Tailwind CSS.

## Fitur Utama

- ✅ **3 Role Pengguna**: Admin, Manager, Employee
- ✅ **CRUD Lengkap**: Manajemen Pengguna, Absensi, Departemen
- ✅ **Autentikasi**: Login, Register, Logout dengan JWT
- ✅ **Dashboard Interaktif**: Chart.js untuk visualisasi data
- ✅ **Responsive Design**: Mobile-friendly dengan Tailwind CSS
- ✅ **Real-time Features**: Check-in/Check-out langsung

## Teknologi

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL (XAMPP)
- **Authentication**: JWT, bcryptjs
- **Charts**: Chart.js, react-chartjs-2
- **Icons**: React Icons
- **Notifications**: React Hot Toast

## Instalasi

### 1. Prasyarat
- Node.js 18+ dan npm
- XAMPP (untuk MySQL)
- Visual Studio Code

### 2. Setup Database
1. Jalankan XAMPP Control Panel
2. Start Apache dan MySQL
3. Buka phpMyAdmin (http://localhost/phpmyadmin)
4. Import file `setup-database.sql`

### 3. Setup Aplikasi
```bash
# Clone atau buat project
npx create-next-app@latest absensi-karyawan

# Masuk ke folder project
cd absensi-karyawan

# Install dependencies
npm install mysql2 bcryptjs jsonwebtoken cookie react-hot-toast date-fns react-icons chart.js react-chartjs-2

# Buat file .env.local
cp .env.example .env.local

# Edit .env.local dengan konfigurasi database Anda
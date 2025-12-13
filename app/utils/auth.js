// app/utils/auth.js
export function getUserRole() {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    return user.role || user.role_name;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  return !!(token && userData);
}

export function redirectByRole(router) {
  const role = getUserRole();
  
  if (role === 'admin') {
    router.push('/');
  } else if (role === 'employee' || role === 'manager') {
    router.push('/attendance/absensi');
  }
}
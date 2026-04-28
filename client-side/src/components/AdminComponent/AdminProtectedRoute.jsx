import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const adminAccessToken = localStorage.getItem('adminAccessToken');
  const adminUserStr = localStorage.getItem('adminUser');
  
  if (!adminAccessToken || !adminUserStr) {
    console.log('No admin credentials found, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const adminUser = JSON.parse(adminUserStr);
    const userRole = adminUser.role;

    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      console.log('User is not admin/staff, redirecting to admin login');
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      return <Navigate to="/admin/login" replace />;
    }

    console.log('Admin access granted. Role:', userRole);
    return <Outlet />;

  } catch (error) {
    console.error('Error parsing admin user data:', error);
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminProtectedRoute;

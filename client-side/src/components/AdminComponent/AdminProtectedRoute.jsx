import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Guard cho các route admin.
 * - Chưa có token / chưa login → redirect sang /admin/login
 * - Token có nhưng role không phải ADMIN/STAFF → clear localStorage + redirect
 * - Hợp lệ → render route con
 */
const AdminProtectedRoute = () => {
  const location = useLocation();
  const adminAccessToken = localStorage.getItem('adminAccessToken');
  const adminUserStr = localStorage.getItem('adminUser');

  if (!adminAccessToken || !adminUserStr) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  try {
    const adminUser = JSON.parse(adminUserStr);
    const role = adminUser?.role;

    if (role !== 'ADMIN' && role !== 'STAFF' && role !== 'MODERATOR') {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
  } catch (err) {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminProtectedRoute;

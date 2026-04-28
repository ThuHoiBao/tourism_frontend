import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout/AdminLayout';
import DashboardPage from './Pages/DashboardPage/DashboardPage';
import ToursPage from './Pages/ToursPage/ToursPage';
import UsersPage from './Pages/UsersPage/UsersPage';
import BookingsPage from './Pages/BookingsPage/BookingsPage';
import NotificationsPage from './Pages/NotificationsPage/NotificationsPage';
import CouponManagement from './Pages/CounponsPage/CouponManagement';
import LocationManager from './Pages/LocationsPage/LocationManager';
import BranchPolicyManagement from './Pages/BranchPolicyPage/BranchPolicyManagement';
import DepartureList from './Pages/DepartureManagement/DepartureList';
import AdminLogin from './Pages/Login/AdminLogin';
import AdminProfile from './AdminProfile.jsx/AdminProfile';
import AdminProtectedRoute from './AdminProtectedRoute';

const AdminComponent = () => {
    return (
        <Routes>
            <Route path="/login" element={<AdminLogin />} />

            <Route element={<AdminProtectedRoute />}>
                <Route path="/" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<AdminProfile />} /> 
                    <Route path="tours" element={<ToursPage />} />
                    <Route path="departures" element={<DepartureList />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="coupons" element={<CouponManagement />} />
                    <Route path="locations" element={<LocationManager />} />
                    <Route path="branches-policies" element={<BranchPolicyManagement />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
};

export default AdminComponent;
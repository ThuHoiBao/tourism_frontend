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
import DeadEventsPage from './Pages/DeadEventsPage/DeadEventsPage';
import AdminForumDashboard from './Pages/ForumManagement/AdminForumDashboard';
import AdminPostManagement from './Pages/ForumManagement/AdminPostManagement';
import AdminCommentManagement from './Pages/ForumManagement/AdminCommentManagement';
import AdminCategoryManagement from './Pages/ForumManagement/AdminCategoryManagement';
import AdminTagManagement from './Pages/ForumManagement/AdminTagManagement';
import AdminTrash from './Pages/ForumManagement/AdminTrash';
import AdminAuditLog from './Pages/ForumManagement/AdminAuditLog';
import AdminBannedUsers from './Pages/ForumManagement/AdminBannedUsers';
import AdminReports from './Pages/ForumManagement/AdminReports';

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
                    <Route path="dead-events" element={<DeadEventsPage />} />

                    <Route path="forum" element={<AdminForumDashboard />} />
                    <Route path="forum/posts" element={<AdminPostManagement />} />
                    <Route path="forum/comments" element={<AdminCommentManagement />} />
                    <Route path="forum/categories" element={<AdminCategoryManagement />} />
                    <Route path="forum/tags" element={<AdminTagManagement />} />
                    <Route path="forum/trash" element={<AdminTrash />} />
                    <Route path="forum/audit-log" element={<AdminAuditLog />} />
                    <Route path="forum/banned-users" element={<AdminBannedUsers />} />
                    <Route path="forum/reports" element={<AdminReports />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
};

export default AdminComponent;
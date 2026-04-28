import React from 'react';
import AdminHeader from './AdminHeader/AdminHeader';
import AdminSidebar from './AdminSidebar/AdminSidebar';
import AdminFooter from './AdminFooter/AdminFooter';
import styles from './AdminLayout.module.scss';
import { Outlet } from 'react-router-dom'; // Dùng Outlet để render các trang con

const AdminLayout = () => {
    return (
        <div className={styles.adminLayout}>
            
            <AdminHeader />
            <AdminSidebar />

            <main className={styles.mainContent}>
                {/* Outlet render nội dung của các route con (Dashboard, Products,...) */}
                <Outlet /> 
            </main>

            <AdminFooter />
        </div>
    );
};

export default AdminLayout;
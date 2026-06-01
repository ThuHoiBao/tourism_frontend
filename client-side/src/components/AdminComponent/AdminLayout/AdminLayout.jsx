import React from 'react';
import AdminHeader from './AdminHeader/AdminHeader';
import AdminSidebar from './AdminSidebar/AdminSidebar';
import AdminFooter from './AdminFooter/AdminFooter';
import styles from './AdminLayout.module.scss';
import { Outlet } from 'react-router-dom';
import { ConsultationAlertsProvider } from '../../../context/ConsultationAlertsContext';

const AdminLayout = () => {
    return (
        <ConsultationAlertsProvider>
            <div className={styles.adminLayout}>
                <AdminHeader />
                <AdminSidebar />

                <main className={styles.mainContent}>
                    <Outlet />
                </main>

                <AdminFooter />
            </div>
        </ConsultationAlertsProvider>
    );
};

export default AdminLayout;
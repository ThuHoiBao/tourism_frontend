import React from 'react';
import styles from './AdminFooter.module.scss';

const AdminFooter = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className={styles.adminFooter}>
            <div className={styles.footerContent}>
                <span className={styles.copyright}>&copy; {currentYear} Future Travel. All rights reserved.</span>
                <span className={styles.company}>Admin Dashboard by Future Travel.</span>
            </div>
        </footer>
    );
};

export default AdminFooter;
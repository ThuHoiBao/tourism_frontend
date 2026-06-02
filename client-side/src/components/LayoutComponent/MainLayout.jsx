import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../HeaderComponent/Header';
import Footer from '../FooterComponent/Footer';
import ContactWidget from '../ContactWidget/ContactWidget';

const MainLayout = () => {
    return (
        <div className="main-layout-wrapper">
            <Header />

            <main className="main-content">
                <Outlet />
            </main>

            <Footer />

            {/* Floating contact widget — góc dưới trái mọi trang user */}
            <ContactWidget />
        </div>
    );
};

export default MainLayout;
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../HeaderComponent/Header'; 
import Footer from '../FooterComponent/Footer'; 
const MainLayout = () => {
    return (
        <div className="main-layout-wrapper">
            <Header /> 
            
            <main className="main-content">
                <Outlet /> 
            </main>
            
            <Footer />
        </div>
    );
};

export default MainLayout;
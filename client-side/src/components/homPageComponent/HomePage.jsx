// src/HomePage.jsx
import React from 'react';
import Header from '../HeaderComponent/Header'; 
import Banner from './BannerComponent/Banner'; 
import styles from './HomePage.module.scss'; 
import Footer from '../FooterComponent/Footer';
import ExploreProducts from './ExploreProductsComponent/ExploreProducts';
import SpecialTours from './SpecialToursComponent/SpecialTours';
import FavoriteDestinations from './FavoriteDestinationsComponent/FavoriteDestinations';
import TrustAndStatsComponent from './TrustAndStatsComponent/TrustAndStatsComponent';
import ChatbotWidget from '../ChatbotWidget/ChatbotWidget';
const HomePage = () => {
  return (
    <div className={styles.homePageWrapper}> 
      {/* HEADER: Vị trí tuyệt đối, nằm trên Banner */}
      {/* <Header />  */}

      {/* BANNER: Vị trí tương đối, chiếm không gian chính */}
      <Banner /> 

      {/* Phần nội dung trang chủ phía dưới banner */}
      <main className={styles.mainContent}>
       <ExploreProducts/>
       <SpecialTours/>
       <FavoriteDestinations/>
       <TrustAndStatsComponent/>
      </main>
       <ChatbotWidget />
      {/* <Footer/> */}
    </div>
  );
};

export default HomePage;
// src/components/homPageComponent/ExploreProductsComponent/ExploreProductItem/ExploreProductItem.jsx (ĐÃ CHỈNH SỬA)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ExploreProducts.module.scss'; 

const ExploreProductItem = ({ tour }) => {
    console.log('ExploreProductItem tour prop:', tour);
    const navigate = useNavigate()
    const handleDepartureClick = (e) => {
        e.stopPropagation(); 
        navigate(`/tour/${tour.tourCode}`);
    };
    const backgroundImage = tour.image 
        ? tour.image
        : '/images/default-tour.jpg'; 

    return (
        <div 
            className={styles.productCard} 
            onClick={(e) => handleDepartureClick(e)} 
        >
            <div 
                className={styles.imageWrapper}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                {/* Overlay và tên tour */}
                <div className={styles.cardOverlay}>
                    <p className={styles.cardTitle}>{tour.tourName}</p>
                </div>
            </div>
        </div>
    );
};

export default ExploreProductItem;
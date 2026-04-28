// src/components/ToursPageComponent/TourComponent/TourComponent.jsx
import React from 'react';
import TourItemComponent from './TourItemComponent/TourItemComponent';
import styles from './TourComponent.module.scss'; // Tạo file này

const TourComponent = ({ tours ,currentUserId}) => {
    if (!tours || tours.length === 0) {
        return <p>Không tìm thấy tour nào phù hợp.</p>;
    }

    return (
        <div className={styles.toursListContainer}>
            {tours.map(tour => (
                // tour là plain object đã được xử lý trong searchToursApi
                <TourItemComponent key={tour.tourID} tour={tour} currentUserId={currentUserId}/>
            ))}
        </div>
    );
};

export default TourComponent;
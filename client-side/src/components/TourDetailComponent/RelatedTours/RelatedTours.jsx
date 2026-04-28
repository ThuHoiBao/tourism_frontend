import React, { useState, useEffect } from 'react';
import styles from './RelatedTours.module.scss';
import axios from '../../../utils/axiosCustomize'; 
import { FaHeart, FaMapMarkerAlt, FaBarcode, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Nhận props currentTourCode từ cha
const RelatedTours = ({ currentTourCode }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentTourCode) return;

    const fetchRelatedTours = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/tours/related/${currentTourCode}`);
        setTours(response.data || response); 
      } catch (error) {
        console.error("Lỗi lấy tour liên quan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedTours();
  }, [currentTourCode]); 

  const handleViewDetail = (code) => {
    navigate(`/tour/${code}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return null; 
  if (!tours || tours.length === 0) return null;

  return (
    <div className={styles.relatedContainer}>
      <h2 className={styles.heading}>CÁC CHƯƠNG TRÌNH KHÁC</h2>
      
      <div className={styles.cardGrid}>
        {tours.map((item) => (
          <div key={item.tourId} className={styles.card} onClick={() => handleViewDetail(item.tourCode)}>
            <div className={styles.imageWrapper}>
              <img src={item.image} alt={item.tourName} />
              <span className={styles.heartIcon}>
                <FaHeart />
              </span>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{item.tourName}</h3>
              
              <div className={styles.infoRow}>
                <FaMapMarkerAlt className={styles.icon} />
                <span>Khởi hành: <span className={styles.highlight}>{item.startLocation}</span></span>
              </div>
              
              <div className={styles.infoRow}>
                <FaBarcode className={styles.icon} />
                <span>Mã chương trình: {item.tourCode} ({item.duration})</span>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.priceInfo}>
                  <span className={styles.label}>Giá từ</span>
                  <span className={styles.price}>{formatCurrency(item.price)}</span>
                  {item.originalPrice > item.price && (
                      <span style={{fontSize: '12px', textDecoration: 'line-through', color: '#999'}}>
                          {formatCurrency(item.originalPrice)}
                      </span>
                  )}
                </div>
                
                <button 
                    className={styles.btnDetail} 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleViewDetail(item.tourCode);
                    }}
                >
                  Xem chi tiết <FaArrowRight className={styles.arrowIcon}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedTours;
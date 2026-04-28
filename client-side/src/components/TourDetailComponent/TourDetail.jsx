import React, { useState, useEffect, useRef} from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './TourDetail.module.scss';
import Header from '../HeaderComponent/Header';
import Footer from '../FooterComponent/Footer';
import ImageModal from './ImageModal/ImageModal';
import TourCalendar from './TourCalendar/TourCalendar';
import TourInformation from './TourInformation/TourInformation';
import TourPolicy from './TourPolicy/TourPolicy';
import TourItinerary from './TourItinerary/TourItinerary';
import TourReviews from './TourReview/TourReviews';
import RelatedTours from './RelatedTours/RelatedTours';
import axios from '../../utils/axiosCustomize'; 
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaBarcode, FaPhoneAlt, FaPlay } from 'react-icons/fa';
import { BsPeopleFill } from "react-icons/bs";
import { set } from 'date-fns';

  const TourDetail = () => {
  const { tourCode } = useParams(); 
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const departureIdFromUrl = searchParams.get('departureId');
  
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startImageIndex, setStartImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    
  // State mới để quản lý main display
  const [mainMediaType, setMainMediaType] = useState('video'); // 'video' hoặc 'image'
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const calendarRef = useRef(null);
  const scrollToCalendar = () => {
    if (calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const fetchTourData = async () => {
     try {
      setLoading(true);
      const response = await axios.get(`/tours/${tourCode}`);
      const data = response.data || response;
      setTourData(data); 
      
      // Set main display: nếu có video thì hiện video, không thì hiện ảnh đầu tiên
      if (data?.videoUrl) {
        setMainMediaType('video');
      } else {
        setMainMediaType('image');
        setMainImageIndex(0);
      }
      
       if (data?.departures && data.departures.length > 0) {
          if (departureIdFromUrl) {
            const foundDeparture = data.departures.find(
              dep => dep.departureId === parseInt(departureIdFromUrl)
            );
            
            if (foundDeparture) {
              setSelectedDeparture(foundDeparture);
              console.log('Selected departure from URL:', foundDeparture);
            } else {
              setSelectedDeparture(data.departures[0]);
              console.warn('Departure ID not found, using first departure');
            }
          } else {
            setSelectedDeparture(data.departures[0]);
          }
        } else {
          setSelectedDeparture(null);
        }
    }  catch (error) {
        console.error('Error fetching tour data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tourCode) {
      fetchTourData();
    }
  }, [tourCode]);

  const handleDepartureSelect = (departure) => {
    setSelectedDeparture(departure);
  };

  const getPriceData = () => {
    if (!selectedDeparture) return {
      originalPrice: tourData?.originalPrice || 0,
      salePrice: tourData?.salePrice || 0,
      finalPrice: tourData?.finalPrice || 0,
      departureCoupon: null,
      departureCouponDiscount: 0,
      globalCoupon: null,
      globalCouponDiscount: 0,
      totalDiscount: tourData?.couponDiscount || 0
    };

    const adultPricing = selectedDeparture.pricings?.find(p => p.passengerType === 'ADULT');
    
    if (!adultPricing) return {
      originalPrice: 0,
      salePrice: 0,
      finalPrice: 0,
      departureCoupon: null,
      departureCouponDiscount: 0,
      globalCoupon: null,
      globalCouponDiscount: 0,
      totalDiscount: 0
    };

    return {
      originalPrice: adultPricing.originalPrice || 0,
      salePrice: adultPricing.salePrice || 0,
      finalPrice: adultPricing.finalPrice || 0,
      departureCoupon: selectedDeparture.departureCouponCode,
      departureCouponDiscount: selectedDeparture.departureCouponDiscount || 0,
      globalCoupon: selectedDeparture.globalCouponCode,
      globalCouponDiscount: selectedDeparture.globalCouponDiscount || 0,
      totalDiscount: selectedDeparture.totalDiscountAmount || 0
    };
  };

  const handleBookNow = () => {
    const currentDeparture = selectedDeparture || tourData?.departures?.[0];
    
    if (!currentDeparture) {
      alert('Vui lòng chọn ngày khởi hành!');
      scrollToCalendar();
      return;
    }

    console.log('Booking with:', {
      tourCode: tourData.tourCode,
      departureId: currentDeparture.departureId
    });

    navigate(`/order-booking?tourCode=${tourData.tourCode}&departureId=${currentDeparture.departureId}`);
  };

  const openGallery = (index) => {
    setStartImageIndex(index);
    setIsModalOpen(true);
  };  

  // Xử lý khi click vào thumbnail image
  const handleThumbnailClick = (index) => {
    setMainMediaType('image');
    setMainImageIndex(index);
  };

  // Xử lý khi click vào thumbnail video
  const handleVideoThumbnailClick = () => {
    setMainMediaType('video');
  };

  // Xử lý khi click vào main display
  const handleMainClick = () => {
    if (mainMediaType === 'image') {
      openGallery(mainImageIndex);
    }
    // Nếu là video thì không làm gì (để người dùng play/pause)
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h3>⏳ Đang tải thông tin tour...</h3>
        </div>
    );
  }

  if (!tourData) {
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h3> Không tìm thấy tour này!</h3>
        </div>
    );
  }
  const priceData = getPriceData();

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <div className={styles.breadcrumb}>
          Du lịch / {tourData.startLocation} / {tourData.endLocation} / <span>{tourData.tourCode}</span>
        </div>

        <h1 className={styles.tourTitle}>{tourData.tourName}</h1>

        <div className={styles.detailLayout}>
          
          {/* ================= CỘT TRÁI (Ảnh + Lịch + Chi tiết) ================= */}
          <div className={styles.leftColumn}>
            
            {/* 1. Gallery Ảnh + Video */}
            <div className={styles.gallerySection}>
              {/* Thumbnails */}
              <div className={styles.thumbnails}>
                {/* Thumbnail video - hiển thị đầu tiên nếu có */}
                {tourData.videoUrl && (
                  <div 
                    className={`${styles.thumbItem} ${styles.videoThumb} ${mainMediaType === 'video' ? styles.active : ''}`}
                    onClick={handleVideoThumbnailClick}
                  >
                    <video 
                      src={tourData.videoUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className={styles.playOverlay}>
                      <FaPlay />
                    </div>
                  </div>
                )}
                
                {/* Thumbnails ảnh - hiển thị 3 ảnh đầu (hoặc 2 nếu có video) */}
                {tourData.images && tourData.images.slice(0, tourData.videoUrl ? 2 : 3).map((img, index) => (
                  <div 
                    key={index} 
                    className={`${styles.thumbItem} ${mainMediaType === 'image' && mainImageIndex === index ? styles.active : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <img src={img} alt={`thumb-${index}`} />
                  </div>
                ))}
                
                {/* Nút xem thêm */}
                {tourData.images && tourData.images.length > (tourData.videoUrl ? 2 : 3) && (
                  <div className={styles.thumbMore} onClick={() => openGallery(tourData.videoUrl ? 2 : 3)}>
                    <span>+{tourData.images.length - (tourData.videoUrl ? 2 : 3)}</span>
                  </div>
                )}
              </div>

              {/* Main Display */}
              <div className={styles.mainImage} onClick={handleMainClick}>
                {mainMediaType === 'video' && tourData.videoUrl ? (
                  <video 
                    src={tourData.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      cursor: 'default'
                    }}
                  />
                ) : (
                  <img 
                    src={tourData.images?.[mainImageIndex]} 
                    alt="Main Tour"
                    style={{ cursor: 'pointer' }}
                  />
                )}
              </div>
            </div>

            <div ref={calendarRef}>
               <TourCalendar 
                departures={tourData.departures}
                onDepartureSelect={handleDepartureSelect}
                selectedDepartureId={selectedDeparture?.departureId}
              />
            </div>
            <TourInformation tour={tourData} />
            <TourItinerary itinerary={tourData.itinerary} />
            <TourPolicy policy={tourData.policy} branchContact={tourData.branchContact} />
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.bookingSidebar}>
              
              {/* Giá */}
             <div className={styles.priceBox}>
                <span className={styles.label}>Giá từ:</span>
                {priceData.totalDiscount  && priceData.totalDiscount  > 0 && (
                    <span className={styles.originalPrice}>
                        {formatCurrency(priceData.salePrice)}
                    </span>
                )}
            </div>
              
              <div className={styles.finalPrice}>
                {formatCurrency(priceData.finalPrice).replace('₫', '')} 
                <span className={styles.currency}>₫</span> 
                <span className={styles.unit}>/ Khách</span>
              </div>

              {priceData.departureCoupon && priceData.departureCouponDiscount > 0 && (
                <div style={{ 
                  backgroundColor: '#fff7e6', 
                  border: '1px solid #ffa940', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  marginBottom: '10px', 
                  fontSize: '13px', 
                  color: '#d46b08',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>🎫</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      Ưu đãi đặc biệt ngày {selectedDeparture?.departureDate}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Code: <b>{priceData.departureCoupon}</b></span>
                      <span style={{ color: '#d46b08', fontWeight: 'bold' }}>
                        -{formatCurrency(priceData.departureCouponDiscount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {priceData.globalCoupon && priceData.globalCouponDiscount > 0 && (
                <div style={{ 
                  backgroundColor: '#e6f7ff', 
                  border: '1px solid #91d5ff', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  marginBottom: '10px', 
                  fontSize: '13px', 
                  color: '#0050b3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      Ưu đãi khi đặt tour
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Code: <b>{priceData.globalCoupon}</b></span>
                      <span style={{ color: '#0050b3', fontWeight: 'bold' }}>
                        -{formatCurrency(priceData.globalCouponDiscount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {priceData.totalDiscount > 0 && (
                <div style={{ 
                  backgroundColor: '#f6ffed', 
                  border: '2px solid #52c41a', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  marginBottom: '15px', 
                  fontSize: '14px', 
                  color: '#135200',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  💰 Tổng tiết kiệm: {formatCurrency(priceData.totalDiscount)}
                  <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '4px', color: '#389e0d' }}>
                    Giá đã bao gồm tất cả ưu đãi
                  </div>
                </div>
            )}
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <FaBarcode className={styles.icon} />
                  <span className={styles.infoLabel}>Mã tour:</span>
                  <span className={styles.infoValueLink}>{tourData.tourCode}</span>
                </div>
                <div className={styles.infoRow}>
                  <FaMapMarkerAlt className={styles.icon} />
                  <span className={styles.infoLabel}>Khởi hành:</span>
                  <span className={styles.infoValue}>{tourData.startLocation}</span>
                </div>
                <div className={styles.infoRow}>
                  <FaCalendarAlt className={styles.icon} />
                  <span className={styles.infoLabel}>Ngày đi:</span>
                  <span className={styles.infoValue}>
                      {selectedDeparture?.departureDate || 'Liên hệ'}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <FaClock className={styles.icon} />
                  <span className={styles.infoLabel}>Thời gian:</span>
                  <span className={styles.infoValue}>{tourData.duration}</span>
                </div>

                <div className={styles.infoRow}>
                  <BsPeopleFill className={styles.icon} />
                  <span className={styles.infoLabel}>Số chỗ:</span>
                  <span className={styles.infoValueHighlight}>
                      {selectedDeparture?.availableSlots || 0} chỗ
                  </span>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.btnOtherDate} onClick={scrollToCalendar}>Ngày khác</button>
                 <button 
                    className={styles.btnBookNow}
                    onClick={handleBookNow}
                    disabled={!selectedDeparture}
                >Đặt ngay</button>
              </div>

              <button className={styles.btnConsult}>
                <FaPhoneAlt /> Liên hệ tư vấn
              </button>
            </div>
          </div>

        </div> 
        <TourReviews tourCode={tourData.tourCode} />
        <RelatedTours currentTourCode={tourData.tourCode} />
      

        {/* Modal Ảnh */}
        <ImageModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            images={tourData.images || []}
            startIndex={startImageIndex}
        />
      </main>
    </div>
  );
};

export default TourDetail;
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './TourBooking.module.scss';
import axios from '../../utils/axiosCustomize';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import {
    FaUser, FaBarcode, FaPlane, FaTag, FaTimes, FaCheckCircle, FaSpinner, FaCoins, FaBus
} from 'react-icons/fa';
import DateInput from './DateInput/DateInput';
import PointRedemption from './PointRedemption/PointRedemption';

const convertDateFormat = (dateString) => {
  if (!dateString) return null;
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
};

const TourBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pointDiscount, setPointDiscount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  
  const { user } = useAuth(); 
  const tourCode = searchParams.get('tourCode');
  const departureId = searchParams.get('departureId');

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState(null);

  const [passengerData, setPassengerData] = useState({
    adult: [{ name: '', gender: 'Nam', birthDate: '', singleRoom: false }],
    child: [],
    toddler: [],
    infant: []
  });

  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });

  const [customerNote, setCustomerNote] = useState('');

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedDepartureCoupon, setAppliedDepartureCoupon] = useState(null);
  const [appliedGlobalCoupon, setAppliedGlobalCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!tourCode || !departureId) {
        setError('Thiếu thông tin tour hoặc ngày khởi hành');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/bookings/order`, {
          params: { tourCode, departureId }
        });
       
        const data = response.data || response;
        setBookingData(data);
       
        if (data.departureCoupon) {
          setAppliedDepartureCoupon({
            code: data.departureCoupon.code,
            discount: data.departureCoupon.discountAmount,
            desc: data.departureCoupon.description,
            type: 'fixed',
            minOrderValue: data.departureCoupon.minOrderValue,
            category: 'departure'
          });
          console.log('✅ Auto applied departure coupon:', data.departureCoupon.code);
        }
       
        setError(null);
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Không thể tải thông tin đặt tour. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [tourCode, departureId]);

  useEffect(() => {
    if (!bookingData || !bookingData.globalCoupons || appliedGlobalCoupon) return;
    
    const subTotal = calculateSubTotal();
    
    const eligibleCoupons = bookingData.globalCoupons.filter(coupon => {
      return !coupon.minOrderValue || subTotal >= coupon.minOrderValue;
    });

    if (eligibleCoupons.length > 0) {
      const bestCoupon = eligibleCoupons.sort((a, b) => b.discountAmount - a.discountAmount)[0];
      
      setAppliedGlobalCoupon({
        code: bestCoupon.code,
        discount: bestCoupon.discountAmount,
        desc: bestCoupon.description,
        type: 'fixed',
        minOrderValue: bestCoupon.minOrderValue,
        category: 'global'
      });
      
      console.log('✅ Auto selected best global coupon:', bestCoupon.code);
    }
  }, [bookingData, passengerData, appliedGlobalCoupon]);

  const maxSlots = bookingData?.availableSlots || 0;
  const currentPaxCount = 
    passengerData.adult.length + 
    passengerData.child.length + 
    passengerData.toddler.length;
  const remainingSlots = maxSlots - currentPaxCount;

  const updatePassengerCount = (type, increment) => {
    setPassengerData(prev => {
      const currentList = prev[type];
      
      if (increment > 0) {
        const maxSlots = bookingData?.availableSlots || 99;
        const currentSeats = prev.adult.length + prev.child.length + prev.toddler.length;
        const isOccupyingSeat = type !== 'infant'; 

        if (isOccupyingSeat && currentSeats >= maxSlots) {
          toast.error(`Chuyến đi chỉ còn lại ${maxSlots} chỗ nhận!`);
          return prev;
        }

        if (type === 'infant') {
          const adultCount = prev.adult.length;
          const currentInfantCount = prev.infant.length;
          
          if (currentInfantCount >= adultCount) {
            toast.warning("Mỗi người lớn chỉ được đi kèm 1 em bé (dưới 2 tuổi)!");
            return prev; 
          }
        }
      }

      if (increment < 0) {
        if (type === 'adult') {
          const newAdultCount = prev.adult.length - 1;
          const infantCount = prev.infant.length;

          if (newAdultCount < infantCount) {
            toast.warning("Không thể giảm người lớn vì đang có quá nhiều em bé đi kèm!");
            return {
              ...prev,
              adult: prev.adult.slice(0, -1),
              infant: prev.infant.slice(0, -1) 
            };
          }
        }

        if (currentList.length === 0) return prev;
        if (type === 'adult' && currentList.length === 1) return prev;
        return { ...prev, [type]: currentList.slice(0, -1) };
      } else {
        const newPassenger = { name: '', gender: 'Nam', birthDate: '' };
        if (type === 'adult') newPassenger.singleRoom = false;
        return { ...prev, [type]: [...currentList, newPassenger] };
      }
    });
    
    setAppliedGlobalCoupon(null);
  };

  const handleInputChange = (type, index, field, value) => {
    setPassengerData(prev => {
      const newList = [...prev[type]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [type]: newList };
    });
    
    if (field === 'singleRoom') {
      setAppliedGlobalCoupon(null);
    }
  };

  const calculateSubTotal = () => {
    if (!bookingData) return 0;
   
    let total = 0;
    total += passengerData.adult.length * (bookingData.adultPrice || 0);
    total += passengerData.child.length * (bookingData.childPrice || 0);
    total += passengerData.toddler.length * (bookingData.toddlerPrice || 0);
    total += passengerData.infant.length * (bookingData.infantPrice || 0);
   
    const singleRoomCount = passengerData.adult.filter(p => p.singleRoom).length;
    total += singleRoomCount * (bookingData.singleRoomSurcharge || 0);
   
    return total;
  };

  const calculateTotalDiscount = (subTotal) => {
    let total = 0;
    
    if (appliedDepartureCoupon && (!appliedDepartureCoupon.minOrderValue || subTotal >= appliedDepartureCoupon.minOrderValue)) {
      total += appliedDepartureCoupon.discount;
    }
    
    if (appliedGlobalCoupon && (!appliedGlobalCoupon.minOrderValue || subTotal >= appliedGlobalCoupon.minOrderValue)) {
      total += appliedGlobalCoupon.discount;
    }

    total += pointDiscount;
    
    return total;
  };

  const calculateMaxRedeemable = () => {
    const subTotal = calculateSubTotal();
    let currentDiscount = 0;
    if (appliedDepartureCoupon) currentDiscount += appliedDepartureCoupon.discount;
    if (appliedGlobalCoupon) currentDiscount += appliedGlobalCoupon.discount;
    
    return Math.max(0, subTotal - currentDiscount);
  };

  const subTotal = calculateSubTotal();
  const totalDiscount = calculateTotalDiscount(subTotal);
  const finalTotal = Math.max(0, subTotal - totalDiscount);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleApplyGlobalCoupon = (coupon) => {
    if (coupon.minOrderValue && subTotal < coupon.minOrderValue) {
      toast.warning(`Đơn hàng cần tối thiểu ${formatCurrency(coupon.minOrderValue)} để áp dụng mã này!`);
      return;
    }
   
    setAppliedGlobalCoupon(coupon);
    setShowCouponModal(false);
  };

  const handleManualCouponSubmit = () => {
    if (!bookingData) return;
   
    const inputCode = couponInput.toUpperCase();
   
    const found = bookingData.globalCoupons?.find(c => c.code === inputCode);
    if (found) {
      handleApplyGlobalCoupon({
        code: found.code,
        discount: found.discountAmount,
        desc: found.description,
        type: 'fixed',
        minOrderValue: found.minOrderValue,
        category: 'global'
      });
      setCouponInput('');
    } else {
      toast.warning("Mã giảm giá không tồn tại hoặc đã hết hạn!");
    }
  };

  const handleSubmitBooking = async () => {
    const totalSeatsNeeded = passengerData.adult.length + 
                             passengerData.child.length + 
                             passengerData.toddler.length;
    
    const availableSlots = bookingData?.availableSlots || 0;
    
    if (totalSeatsNeeded > availableSlots) {
      toast.warning(`Không đủ chỗ trống!\n\nBạn đang đặt cho ${totalSeatsNeeded} người nhưng chỉ còn ${availableSlots} chỗ.\nVui lòng giảm số lượng hành khách hoặc chọn ngày khởi hành khác.`);
      return;
    }

    if (totalSeatsNeeded === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 hành khách!');
      return;
    }

    if (!contactInfo.fullName.trim()) {
      toast.warning('Vui lòng nhập họ tên liên lạc!');
      return;
    }
    if (!contactInfo.phone.trim()) {
      toast.warning('Vui lòng nhập số điện thoại!');
      return;
    }
    if (!contactInfo.email.trim()) {
      toast.warning('Vui lòng nhập email!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      toast.warning('Email không hợp lệ!');
      return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(contactInfo.phone)) {
      toast.warning('Số điện thoại phải có 10-11 chữ số!');
      return;
    }

    const allPassengers = [
      ...passengerData.adult,
      ...passengerData.child,
      ...passengerData.toddler,
      ...passengerData.infant
    ];

    for (let i = 0; i < allPassengers.length; i++) {
      const passenger = allPassengers[i];
      if (!passenger.name.trim()) {
        toast.warning(`Vui lòng nhập đầy đủ họ tên cho hành khách thứ ${i + 1}!`);
        return;
      }
      if (!passenger.birthDate) {
        toast.warning(`Vui lòng nhập ngày sinh cho hành khách thứ ${i + 1}!`);
        return;
      }
    }

    if (passengerData.infant.length > passengerData.adult.length) {
      toast.warning(`Số lượng em bé (${passengerData.infant.length}) không được vượt quá số người lớn (${passengerData.adult.length})!\n\nMỗi người lớn chỉ được đi kèm 1 em bé.`);
      return;
    }

    const passengers = [];

    passengerData.adult.forEach(p => {
      passengers.push({
        fullName: p.name,
        gender: p.gender,
        dateOfBirth: convertDateFormat(p.birthDate),
        type: 'ADULT',
        singleRoom: p.singleRoom
      });
    });

    passengerData.child.forEach(p => {
      passengers.push({
        fullName: p.name,
        gender: p.gender,
        dateOfBirth: convertDateFormat(p.birthDate),
        type: 'CHILD',
        singleRoom: false
      });
    });

    passengerData.toddler.forEach(p => {
      passengers.push({
        fullName: p.name,
        gender: p.gender,
        dateOfBirth: convertDateFormat(p.birthDate),
        type: 'TODDLER',
        singleRoom: false
      });
    });

    passengerData.infant.forEach(p => {
      passengers.push({
        fullName: p.name,
        gender: p.gender,
        dateOfBirth: convertDateFormat(p.birthDate),
        type: 'INFANT',
        singleRoom: false
      });
    });

    const couponCodes = [];
    if (appliedDepartureCoupon) {
      couponCodes.push(appliedDepartureCoupon.code);
    }
    if (appliedGlobalCoupon) {
      couponCodes.push(appliedGlobalCoupon.code);
    }

    const requestData = {
      departureId: parseInt(departureId),
      contactFullName: contactInfo.fullName,
      contactPhone: contactInfo.phone,
      contactEmail: contactInfo.email,
      contactAddress: contactInfo.address || '',
      customerNote: customerNote || '',
      passengers: passengers,
      couponCode: couponCodes.length > 0 ? couponCodes : null,
      pointsUsed: pointsUsed || null
    };

    console.log('Sending booking request:', requestData);

  try {
  setSubmitting(true);
  
  const response = await axios.post('/bookings/create', requestData);
  const bookingCode = response.data?.bookingCode || response.data?.code || response.data?.id;
  
  console.log(' Booking created:', { bookingCode, data: response.data });
  
  if (!bookingCode) {
    console.error(' No booking code in response:', response.data);
    toast.error('Đặt tour thành công nhưng không nhận được mã booking.\nVui lòng kiểm tra email hoặc liên hệ CSKH: 1900-xxxx');
    return;
  }

  toast.success(` Đặt tour thành công!\n\nMã đặt tour: ${bookingCode}\n\nVui lòng thanh toán trong vòng 24 giờ.`);

  navigate(`/payment-booking?bookingCode=${bookingCode}`, {
    state: { bookingData: response.data }
  });
  
} catch (err) {
  console.error(' Error creating booking:', err);
  
  let errorMessage = 'Đặt tour thất bại. Vui lòng thử lại!';
  
  if (err.response?.data) {
    const errorData = err.response.data;
    
    if (errorData.message && errorData.message.includes('not enough seats')) {
      errorMessage = ` Rất tiếc, không còn đủ chỗ trống!\n\nChuyến đi này đã được người khác đặt trước.\nVui lòng chọn ngày khởi hành khác hoặc giảm số lượng hành khách.`;
    } else if (errorData.message && errorData.message.includes('Coupon')) {
      errorMessage = ` Mã giảm giá không hợp lệ!\n\n${errorData.message}`;
    } else if (errorData.message && errorData.message.includes('points')) {
      errorMessage = ` Lỗi điểm thưởng!\n\n${errorData.message}`;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    }
  }
  
  toast.error(errorMessage);
  
  if (errorMessage.includes('not enough seats') || errorMessage.includes('không còn đủ chỗ')) {
    window.location.reload();
  }
  
} finally {
  setSubmitting(false);
}
  };

  const renderPassengerInputs = (type, label, priceLabel, price) => {
    const list = passengerData[type];
    if (list.length === 0) return null;

    return (
      <div className={styles.passengerGroup}>
        <div className={styles.groupHeader}>
          <FaUser /> <span>{label}</span>
          <span className={styles.note}>({priceLabel} - {formatCurrency(price)})</span>
        </div>
        {list.map((item, index) => (
          <div key={index} className={styles.singlePassengerForm}>
            <div className={styles.passengerIndexLabel}>{label} {index + 1}</div>
            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.nameInput}`}>
                <label>Họ tên <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="Nhập họ tên"
                  value={item.name}
                  onChange={(e) => handleInputChange(type, index, 'name', e.target.value)}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.smallInput}`}>
                <label>Giới tính <span className={styles.required}>*</span></label>
                <select
                  value={item.gender}
                  onChange={(e) => handleInputChange(type, index, 'gender', e.target.value)}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.smallInput}`}>
                <label>Ngày sinh <span className={styles.required}>*</span></label>
                <DateInput
                  value={item.birthDate}
                  type={type}
                  onChange={(newDate) => handleInputChange(type, index, 'birthDate', newDate)}
                />
              </div>
              {type === 'adult' && (
                <div className={styles.singleRoomOption}>
                  <label>Phòng đơn</label>
                  <div className={styles.switchWrapper}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={item.singleRoom}
                        onChange={(e) => handleInputChange(type, index, 'singleRoom', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span className={styles.surchargePrice}>
                      {formatCurrency(bookingData?.singleRoomSurcharge || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <FaSpinner style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
          <h3>Đang tải thông tin đặt tour...</h3>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className={styles.pageContainer}>
        <div style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <h3 style={{ color: '#ff4d4f' }}>⚠️ {error || 'Không thể tải thông tin đặt tour'}</h3>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { outboundFlight, inboundFlight } = bookingData;
  const availableGlobalCoupons = bookingData.globalCoupons || [];

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
       
        <div className={styles.stepperContainer}>
          <h1 className={styles.pageTitle}>ĐẶT TOUR</h1>
          <div className={styles.stepper}>
            <div className={`${styles.step} ${styles.active}`}>
              <div className={styles.icon}>1</div>
              <span>NHẬP THÔNG TIN</span>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.icon}>2</div>
              <span>THANH TOÁN</span>
            </div>
            <div className={styles.line}></div>
            <div className={styles.step}>
              <div className={styles.icon}>3</div>
              <span>HOÀN TẤT</span>
            </div>
          </div>
        </div>

        <div className={styles.bookingLayout}>
         
          <div className={styles.leftColumn}>
            <section className={styles.section}>
              <h2 className={styles.sectionHeader}>THÔNG TIN LIÊN LẠC</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Họ tên <span className={styles.required}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="Nhập họ tên"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Điện thoại <span className={styles.required}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="Nhập số điện thoại"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email <span className={styles.required}>*</span></label>
                  <input 
                    type="email" 
                    placeholder="nguyenvana@gmail.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Địa chỉ</label>
                  <input 
                    type="text" 
                    placeholder="Nhập địa chỉ"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeader}>HÀNH KHÁCH</h2>
              <div className={styles.passengerGrid}>
                <CounterControl
                  label="Người lớn"
                  desc="Từ 12 trở lên"
                  count={passengerData.adult.length}
                  onMinus={() => updatePassengerCount('adult', -1)}
                  disablePlus={remainingSlots <= 0}
                  onPlus={() => updatePassengerCount('adult', 1)}
                />
                {bookingData.toddlerPrice && (
                  <CounterControl
                    label="Trẻ nhỏ"
                    desc="Từ 2 - 4 tuổi"
                    count={passengerData.toddler.length}
                    onMinus={() => updatePassengerCount('toddler', -1)}
                    disablePlus={remainingSlots <= 0}
                    onPlus={() => updatePassengerCount('toddler', 1)}
                  />
                )}
                {bookingData.childPrice && (
                  <CounterControl
                    label="Trẻ em"
                    desc="Từ 5 - 11 tuổi"
                    count={passengerData.child.length}
                    onMinus={() => updatePassengerCount('child', -1)}
                    disablePlus={remainingSlots <= 0}
                    onPlus={() => updatePassengerCount('child', 1)}
                  />
                )}
                {bookingData.infantPrice && (
                  <CounterControl
                    label="Em bé"
                    desc="Dưới 2 tuổi"
                    count={passengerData.infant.length}
                    onMinus={() => updatePassengerCount('infant', -1)}
                    disablePlus={passengerData.infant.length >= passengerData.adult.length}
                    onPlus={() => updatePassengerCount('infant', 1)}
                  />
                )}
              </div>

              {remainingSlots > 0 && remainingSlots <= 30 && (
                <div style={{color: '#e31b23', fontWeight: 'bold', marginTop: '10px', fontSize: '14px'}}>
                  🔥 Chỉ còn {remainingSlots} chỗ cuối cùng!
                </div>
              )}
      
              {remainingSlots <= 0 && (
                <div style={{color: '#e31b23', fontWeight: 'bold', marginTop: '10px'}}>
                  ❌ Đã hết chỗ trống. Vui lòng liên hệ nhân viên.
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeader}>THÔNG TIN HÀNH KHÁCH</h2>
              {renderPassengerInputs('adult', 'Người lớn', 'Từ 12 trở lên', bookingData.adultPrice)}
              {bookingData.childPrice && renderPassengerInputs('child', 'Trẻ em', 'Từ 5 - 11 tuổi', bookingData.childPrice)}
              {bookingData.toddlerPrice && renderPassengerInputs('toddler', 'Trẻ nhỏ', 'Từ 2 - 4 tuổi', bookingData.toddlerPrice)}
              {bookingData.infantPrice && renderPassengerInputs('infant', 'Em bé', 'Dưới 2 tuổi', bookingData.infantPrice)}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeader}>GHI CHÚ</h2>
              <div className={styles.noteArea}>
                <textarea 
              placeholder="Nhập ghi chú..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            ></textarea>
          </div>
        </section>
      </div>

      <div className={styles.rightColumn}>
       
        <div className={styles.summaryCard}>
          <div className={styles.tourSummary}>
            <img src={bookingData.image} alt="tour" className={styles.tourImg} />
            <div className={styles.tourText}>
              <h4>{bookingData.tourName}</h4>
              <p className={styles.tourCode}><FaBarcode /> {bookingData.tourCode}</p>
            </div>
          </div>

          {(outboundFlight || inboundFlight) && (
            <div className={styles.flightInfoContainer}>
              <div className={styles.sectionTitle}>
                {outboundFlight.vehicleType === 'PLANE' ? (
                    <FaPlane className={styles.icon} />
                  ) : (
                    <FaBus className={styles.icon} />
                )}
                THÔNG TIN VỀ CHUYẾN ĐI
                </div>
              <div className={styles.flightSection}>
               
                {/* Outbound */}
                {outboundFlight && (
                  <div className={styles.flightColumn}>
                    <div className={styles.topRow}>
                      <span className={styles.label}>
                        Ngày đi - {new Date(outboundFlight.departTime).toLocaleDateString('vi-VN')}
                      </span>
                      <div className={styles.flightCode}>{outboundFlight.transportCode}</div>
                    </div>
                    <div className={styles.timeRow}>
                      <span className={styles.time}>
                        {new Date(outboundFlight.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                      <span className={styles.time}>
                        {new Date(outboundFlight.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div className={styles.timelineBar}>
                      <div className={styles.dotLeft}></div>
                      <div className={styles.line}></div>
                      <div className={styles.dotRight}></div>
                     {outboundFlight.vehicleType === 'PLANE' ? (
                         <FaPlane className={styles.planeIcon} />
                      ) : (
                         <FaBus className={styles.planeIcon} />
                      )}
                    </div>
                    <div className={styles.routeInfo}>
                      <span className={styles.airportCode} title={outboundFlight.startPointName}>
                        {outboundFlight.startPoint}
                      </span>
                      <span className={styles.airportCode} title={outboundFlight.endPointName}>
                        {outboundFlight.endPoint}
                      </span>
                    </div>
                       <p className={styles.flightInfo}>{outboundFlight.vehicleName}</p>
                  </div>
                )}

                {outboundFlight && inboundFlight && <div className={styles.dividerDashed}></div>}

                {/* Inbound */}
                {inboundFlight && (
                  <div className={styles.flightColumn}>
                    <div className={styles.topRow}>
                      <span className={styles.label}>
                        Ngày về - {new Date(inboundFlight.departTime).toLocaleDateString('vi-VN')}
                      </span>
                      <div className={styles.flightCode}>{inboundFlight.transportCode}</div>
                    </div>
                    <div className={styles.timeRow}>
                      <span className={styles.time}>
                        {new Date(inboundFlight.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                      <span className={styles.time}>
                        {new Date(inboundFlight.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div className={styles.timelineBar}>
                      <div className={styles.dotLeft}></div>
                      <div className={styles.line}></div>
                      <div className={styles.dotRight}></div>
                        {inboundFlight.vehicleType === 'PLANE' ? (
                         <FaPlane className={styles.planeIcon} style={{transform: 'rotate(180deg)' ,top: '-5px'}} />
                      ) : (
                         <FaBus className={styles.planeIcon} style={{transform: 'rotate(180deg)', top: '-5px'}} />
                      )}
                    </div>
                    <div className={styles.routeInfo}>
                      <span className={styles.airportCode} title={inboundFlight.startPointName}>
                        {inboundFlight.startPoint}
                      </span>
                      <span className={styles.airportCode} title={inboundFlight.endPointName}>
                        {inboundFlight.endPoint}
                      </span>
                    </div>
                       <p className={styles.flightInfo}>{inboundFlight.vehicleName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: MÃ GIẢM GIÁ */}
        <div className={styles.couponCard}>
          <div className={styles.sectionTitle}><FaTag /> MÃ GIẢM GIÁ</div>
          
          {/* Departure Coupon */}
          {appliedDepartureCoupon && (
            <div className={styles.appliedCoupon} style={{ 
              marginBottom: '10px', 
              backgroundColor: '#fff7e6', 
              border: '2px solid #faad14' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={styles.couponCode}>{appliedDepartureCoupon.code}</span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: '600'
                }}>
                  🎫 Đặc biệt
                </span>
              </div>
              <div className={styles.couponDesc}>{appliedDepartureCoupon.desc}</div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  Giảm {formatCurrency(appliedDepartureCoupon.discount)}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  ✓ Tự động áp dụng
                </span>
              </div>
            </div>
          )}

          {/* Global Coupon */}
          {appliedGlobalCoupon && (
            <div className={styles.appliedCoupon}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={styles.couponCode}>{appliedGlobalCoupon.code}</span>
                <FaCheckCircle style={{ color: '#52c41a', fontSize: '14px' }} />
              </div>
              <div className={styles.couponDesc}>{appliedGlobalCoupon.desc}</div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  Giảm {formatCurrency(appliedGlobalCoupon.discount)}
                </span>
              </div>
            </div>
          )}
          
          <button 
            className={styles.btnAddCoupon} 
            onClick={() => setShowCouponModal(true)}
            style={{ marginTop: '10px' }}
          >
            <FaTag /> {appliedGlobalCoupon ? 'Chọn mã khác' : 'Chọn mã giảm giá'}
          </button>
        </div>

        {/* CARD: ĐIỂM THƯỞNG */}
        <PointRedemption 
          userPoints={user.coinBalance || 0} 
          maxRedeemableAmount={calculateMaxRedeemable()}
          onRedeem={(amount, points) => {
            setPointDiscount(amount);
            setPointsUsed(points);
          }}
        />

        {/* CARD 3: TỔNG TIỀN */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>TỔNG QUAN GIÁ TOUR</h3>
         
          <div className={styles.pricingSummary}>
            {passengerData.adult.length > 0 && (
              <div className={styles.priceRow}>
                <span>Người lớn ({passengerData.adult.length})</span>
                <span>{formatCurrency(passengerData.adult.length * bookingData.adultPrice)}</span>
              </div>
            )}
            {passengerData.child.length > 0 && bookingData.childPrice && (
              <div className={styles.priceRow}>
                <span>Trẻ em ({passengerData.child.length})</span>
                <span>{formatCurrency(passengerData.child.length * bookingData.childPrice)}</span>
              </div>
            )}
            {passengerData.toddler.length > 0 && bookingData.toddlerPrice && (
              <div className={styles.priceRow}>
                <span>Trẻ nhỏ ({passengerData.toddler.length})</span>
                <span>{formatCurrency(passengerData.toddler.length * bookingData.toddlerPrice)}</span>
              </div>
            )}
            {passengerData.infant.length > 0 && bookingData.infantPrice && (
              <div className={styles.priceRow}>
                <span>Em bé ({passengerData.infant.length})</span>
                <span>{formatCurrency(passengerData.infant.length * bookingData.infantPrice)}</span>
              </div>
            )}
            {passengerData.adult.filter(p => p.singleRoom).length > 0 && (
              <div className={styles.priceRow}>
                <span>Phụ thu phòng đơn ({passengerData.adult.filter(p => p.singleRoom).length})</span>
                <span>{formatCurrency(passengerData.adult.filter(p => p.singleRoom).length * bookingData.singleRoomSurcharge)}</span>
              </div>
            )}
           
            {appliedDepartureCoupon && (
              <div className={`${styles.priceRow} ${styles.discountRow}`}>
                <span>Mã đặc biệt ({appliedDepartureCoupon.code})</span>
                <span>-{formatCurrency(appliedDepartureCoupon.discount)}</span>
              </div>
            )}
            
            {appliedGlobalCoupon && (
              <div className={`${styles.priceRow} ${styles.discountRow}`}>
                <span>Mã giảm giá ({appliedGlobalCoupon.code})</span>
                <span>-{formatCurrency(appliedGlobalCoupon.discount)}</span>
              </div>
            )}

            {pointDiscount > 0 && (
              <div className={`${styles.priceRow} ${styles.discountRow}`}>
                <span style={{color: '#d48806', fontWeight: 'bold'}}>
                  <FaCoins /> Dùng điểm thưởng
                </span>
                <span style={{color: '#d48806', fontWeight: 'bold'}}>
                  -{formatCurrency(pointDiscount)}
                </span>
              </div>
            )}

            <div className={styles.divider}></div>
           
            <div className={styles.finalTotal}>
              <span>Tổng tiền</span>
              <span className={styles.amount}>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className={styles.termsAgreement}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.text}>
                Tôi đồng ý với <a href="#">Chính sách</a> bảo vệ dữ liệu cá nhân và <a href="#">các điều khoản</a>.
              </span>
            </label>
          </div>

          <div className={styles.summaryFooter}>
            {/* Cảnh báo số chỗ còn ít */}
            {remainingSlots > 0 && remainingSlots <= 5 && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffa940',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '13px',
                color: '#d46b08',
                textAlign: 'center'
              }}>
                ⚠️ Chỉ còn {remainingSlots} chỗ! Vui lòng đặt ngay để không bỏ lỡ
              </div>
            )}

            <button
              className={styles.btnSubmit}
              disabled={!isAgreed || submitting || remainingSlots <= 0}
              onClick={handleSubmitBooking}
              style={{ 
                opacity: (!isAgreed || submitting || remainingSlots <= 0) ? 0.6 : 1, 
                cursor: (!isAgreed || submitting || remainingSlots <= 0) ? 'not-allowed' : 'pointer' 
              }}
            >
              {submitting ? (
                <>
                  <FaSpinner style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                  Đang xử lý...
                </>
              ) : remainingSlots <= 0 ? (
                '❌ Đã hết chỗ'
              ) : (
                'Tiến hành thanh toán'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>

  {/* MODAL CHỌN MÃ GIẢM GIÁ */}
  {showCouponModal && (
    <div className={styles.modalOverlay} onClick={() => setShowCouponModal(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Chọn mã giảm giá</h3>
          <button onClick={() => setShowCouponModal(false)}><FaTimes /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.couponInputGroup}>
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            />
            <button onClick={handleManualCouponSubmit}>Áp dụng</button>
          </div>
          
          {availableGlobalCoupons.length > 0 ? (
            <div className={styles.couponList}>
              {availableGlobalCoupons.map(coupon => {
                const isDisabled = coupon.minOrderValue && subTotal < coupon.minOrderValue;
                const isSelected = appliedGlobalCoupon && appliedGlobalCoupon.code === coupon.code;
               
                return (
                  <div
                    key={coupon.code}
                    className={`${styles.couponItem} ${isDisabled ? styles.disabled : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => !isDisabled && handleApplyGlobalCoupon({
                      code: coupon.code,
                      discount: coupon.discountAmount,
                      desc: coupon.description,
                      type: 'fixed',
                      minOrderValue: coupon.minOrderValue,
                      category: 'global'
                    })}
                    style={{ 
                      opacity: isDisabled ? 0.5 : 1, 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      backgroundColor: isSelected ? '#f6ffed' : 'white',
                      border: isSelected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div className={styles.couponIcon}>🎁</div>
                    <div className={styles.couponInfo}>
                      <div className={styles.code}>
                        {coupon.code}
                        {isSelected && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            backgroundColor: '#52c41a',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}>
                            ✓ Đang chọn
                          </span>
                        )}
                      </div>
                      <div className={styles.desc}>{coupon.description}</div>
                      <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
                        Giảm {formatCurrency(coupon.discountAmount)}
                      </div>
                      {isDisabled && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                          ⚠️ Đơn hàng cần tối thiểu {formatCurrency(coupon.minOrderValue)}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className={styles.selectBtn} style={{ color: '#52c41a' }}>
                        <FaCheckCircle />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Không có mã giảm giá khả dụng
            </div>
          )}
        </div>
      </div>
    </div>
  )}

</div>
);
};
const CounterControl = ({ label, desc, count, onMinus, onPlus, disablePlus }) => (
  <div className={styles.passengerCounter}>
    <div className={styles.info}>
      <span className={styles.type}>{label}</span>
      <span className={styles.desc}>{desc}</span>
    </div>
    <div className={styles.controls}>
      <button onClick={onMinus}>-</button>
      <span className={styles.count}>{count}</span>
      <button 
        onClick={onPlus} 
        disabled={disablePlus} 
        style={{ 
          opacity: disablePlus ? 0.3 : 1, 
          cursor: disablePlus ? 'not-allowed' : 'pointer' 
        }}
      >
        +
      </button>
    </div>
  </div>
);
export default TourBooking;
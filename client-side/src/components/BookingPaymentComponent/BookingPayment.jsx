import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosCustomize';
import styles from './BookingPayment.module.scss';
import {
  FaCheckCircle,
  FaClock,
  FaPlane,
  FaBarcode,
  FaCreditCard,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaTag,
  FaBus
} from 'react-icons/fa';

// Badge mã sân bay — hover hiện tooltip tên đầy đủ (giống TourCalendar).
const AirportBadge = ({ code, name }) => (
  <span
    className={styles.airportCode}
    data-tooltip={name || 'Sân bay'}
    title={name}
  >
    {code}
  </span>
);

const BookingPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = searchParams.get('bookingCode');
  
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showPassengers, setShowPassengers] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PAYOS');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingCode) {
        setError('Không tìm thấy mã booking');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching booking data for code:', bookingCode);
        const response = await axios.get(`/bookings/payment/${bookingCode}`);
        
        const data = response.data || response;
        setBookingData(data);
        console.log('Booking data loaded:', data);
        setError(null);
      } catch (err) {
        console.error('Error fetching booking:', err);
        const errorMsg = err.response?.data?.message || 
                        err.response?.data?.error || 
                        'Không thể tải thông tin booking. Vui lòng thử lại.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingCode]);

  // Countdown timer
  useEffect(() => {
    if (!bookingData?.paymentDeadline) return;

    const updateTimer = () => {
      const deadline = new Date(bookingData.paymentDeadline);
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('Đã hết hạn');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [bookingData]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING_PAYMENT': 'Chờ thanh toán',
      'CONFIRMED': 'Đã xác nhận',
      'PAID': 'Đã thanh toán',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getPassengerTypeText = (type) => {
    const typeMap = {
      'ADULT': 'Người lớn',
      'CHILD': 'Trẻ em',
      'TODDLER': 'Trẻ nhỏ',
      'INFANT': 'Em bé'
    };
    return typeMap[type] || type;
  };

  const handlePayment = () => {
    // Validate booking data
    if (!bookingData) {
      toast.error('Không tìm thấy thông tin booking');
      return;
    }

    if (bookingData.remainingAmount <= 0) {
      toast.info('Booking đã được thanh toán đầy đủ');
      return;
    }

    // Check payment deadline
    if (bookingData.paymentDeadline) {
      const deadline = new Date(bookingData.paymentDeadline);
      const now = new Date();
      if (now >= deadline) {
        toast.error('Thời hạn thanh toán đã hết. Booking của bạn có thể đã bị hủy.');
        return;
      }
    }

    // Mở modal xác nhận thay vì window.confirm
    setShowConfirmModal(true);
  };

  const proceedPayment = async () => {
    try {
      setPaymentProcessing(true);
      let apiEndpoint = '';
      let paymentRequest = {};

      if (paymentMethod === 'VNPAY') {
        apiEndpoint = '/payment/vnpay/create';
        paymentRequest = {
            bookingCode: bookingData.bookingCode,
            amount: bookingData.remainingAmount,
            orderInfo: `Thanh toan booking ${bookingData.bookingCode}`,
            locale: 'vn'
        };
      } else if (paymentMethod === 'PAYOS') {
        apiEndpoint = '/payment/payos/create'; 
        paymentRequest = {
            bookingCode: bookingData.bookingCode,
            amount: bookingData.remainingAmount,
            description: `Thanh toan ${bookingData.bookingCode}`,
            returnUrl: window.location.origin + "/payment-waiting",
            cancelUrl: window.location.origin + "/payment-cancel"
        };
      }

      console.log(`Creating ${paymentMethod} payment request:`, paymentRequest);

      const response = await axios.post(apiEndpoint, paymentRequest);

      console.log('Payment response:', response);
      
      let paymentUrl = null;
      let orderCode = null;

      if (response.data?.checkoutUrl) {
          paymentUrl = response.data.checkoutUrl; 
          orderCode = response.data.transactionId; 
      } else if (response.data?.paymentUrl) {
          paymentUrl = response.data.paymentUrl; 
          orderCode = response.data.transactionId;
      } else if (response.paymentUrl) {
          paymentUrl = response.paymentUrl;
          orderCode = response.data.transactionId; 
      } else if (response.data?.data?.checkoutUrl) {
          paymentUrl = response.data.data.checkoutUrl;
          orderCode = response.data.transactionId; 
      } else if (response.data?.url) {
          paymentUrl = response.data.url;
          orderCode = response.data.transactionId; 
      }

      if (paymentUrl && orderCode) {
        console.log('Redirecting to PayOS:', paymentUrl);
        
        sessionStorage.setItem('pendingPaymentOrderCode', orderCode);
        sessionStorage.setItem('pendingPaymentBookingCode', bookingData.bookingCode);
        
        const paymentWindow = window.open(paymentUrl, '_blank');
        
        setTimeout(() => {
          window.location.href = `/payment-waiting?orderCode=${orderCode}&bookingCode=${bookingData.bookingCode}`;
        }, 1000);
        
      } else {
        throw new Error('Không tìm thấy đường dẫn thanh toán từ phản hồi server');
      }

    }catch (error) {
      console.error('Payment error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      
      let errorMessage = 'Không thể tạo thanh toán. Vui lòng thử lại sau.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message && !error.message.includes('Network Error')) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Đang tải thông tin booking...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <h3>⚠️ {error || 'Không tìm thấy thông tin booking'}</h3>
          <button onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  const isPaymentExpired = bookingData.paymentDeadline && 
    new Date(bookingData.paymentDeadline) <= new Date();

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        {/* Stepper */}
        <div className={styles.stepperContainer}>
          <h1 className={styles.pageTitle}>ĐẶT TOUR</h1>
          <div className={styles.stepper}>
            <div className={`${styles.step} ${styles.completed}`}>
              <div className={styles.icon}><FaCheckCircle /></div>
              <span>NHẬP THÔNG TIN</span>
            </div>
            <div className={`${styles.line} ${styles.completed}`}></div>
            <div className={`${styles.step} ${styles.active}`}>
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

        <div className={styles.paymentLayout}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Booking Details */}
            <section className={styles.section}>
              <h2 className={styles.sectionHeader}>CHI TIẾT BOOKING</h2>
              <div className={styles.bookingDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Mã đặt chỗ:</span>
                  <span className={`${styles.value} ${styles.highlight}`}>
                    {bookingData.bookingCode}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Ngày tạo:</span>
                  <span className={styles.value}>
                    {formatDateTime(bookingData.createdDate)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <span className={`${styles.value} ${styles.statusBadge}`}>
                    {getStatusText(bookingData.status)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Trị giá booking:</span>
                  <span className={`${styles.value} ${styles.price}`}>
                    {formatCurrency(bookingData.originalPrice)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Số tiền đã thanh toán:</span>
                  <span className={styles.value}>
                    {formatCurrency(bookingData.paidAmount)}
                  </span>
                </div>
                <div className={`${styles.detailRow} ${styles.total}`}>
                  <span className={styles.label}>Số tiền còn lại:</span>
                  <span className={`${styles.value} ${styles.priceHighlight}`}>
                    {formatCurrency(bookingData.remainingAmount)}
                  </span>
                </div>
                
                {/* Applied Coupons */}
                {bookingData.appliedCouponCodes && bookingData.appliedCouponCodes.length > 0 && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>
                      <FaTag /> Mã giảm giá đã áp dụng:
                    </span>
                    <span className={styles.value}>
                      {bookingData.appliedCouponCodes.map((code, index) => (
                        <span key={index} className={styles.couponTag}>
                          {code}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                <div className={`${styles.detailRow} ${styles.deadline}`}>
                  <span className={styles.label}>
                    <FaClock /> Thời hạn thanh toán:
                  </span>
                  <span className={styles.value}>
                    {formatDateTime(bookingData.paymentDeadline)}
                    <span className={`${styles.timer} ${isPaymentExpired ? styles.expired : ''}`}>
                      {' '}(Còn lại: {timeRemaining})
                    </span>
                  </span>
                </div>

                {bookingData.status === 'PENDING_PAYMENT' && !isPaymentExpired && (
                  <div className={styles.warningBox}>
                    ⚠️ Vui lòng thanh toán trước thời hạn để giữ chỗ. 
                    Booking sẽ tự động hủy nếu quá hạn thanh toán.
                  </div>
                )}

                {isPaymentExpired && bookingData.status === 'PENDING_PAYMENT' && (
                  <div className={styles.errorBox}>
                    ❌ Thời hạn thanh toán đã hết. Booking này có thể đã bị hủy.
                  </div>
                )}
              </div>
            </section>

            {/* Passenger List */}
            <section className={styles.section}>
              <h2 
                className={styles.collapsibleHeader}
                onClick={() => setShowPassengers(!showPassengers)}
              >
                DANH SÁCH HÀNH KHÁCH ({bookingData.passengers?.length || 0} người)
                {showPassengers ? <FaChevronUp /> : <FaChevronDown />}
              </h2>
              
              {showPassengers && (
                <div className={styles.passengerTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Ngày sinh</th>
                        <th>Giới tính</th>
                        <th>Loại</th>
                        <th>Phòng đơn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.passengers?.map((passenger, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{passenger.fullName}</td>
                          <td>{formatDate(passenger.dateOfBirth)}</td>
                          <td>{passenger.gender}</td>
                          <td>{getPassengerTypeText(passenger.type)}</td>
                          <td>
                            {passenger.singleRoom ? (
                              <span className={styles.yesTag}>Có</span>
                            ) : (
                              <span className={styles.noTag}>Không</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>PHIẾU XÁC NHẬN BOOKING</h3>
              
              {/* Tour Info */}
              <div className={styles.tourSummary}>
                <img 
                  src={bookingData.tourImage} 
                  alt={bookingData.tourName} 
                  className={styles.tourImg}
                />
                <div className={styles.tourInfo}>
                  <h4>{bookingData.tourName}</h4>
                  <div className={styles.tourMeta}>
                    <div className={styles.metaItem}>
                      <FaBarcode /> {bookingData.bookingCode}
                    </div>
                    <div className={styles.metaItem}>
                      <FaBarcode /> {bookingData.tourCode}
                    </div>  
                    <div className={styles.metaItem}>
                      <FaClock /> {bookingData.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Info */}
              {(bookingData.outboundTransport || bookingData.inboundTransport) && (
                <div className={styles.flightInfoContainer}>
                  <h4>
                    {bookingData.outboundTransport.vehicleType === 'PLANE' ? (
                    <FaPlane className={styles.icon} />
                     ) : (
                     <FaBus className={styles.icon} />
                   )}
                     THÔNG TIN VỀ CHUYẾN ĐI
                  </h4>
                  
                  <div className={styles.flightSection}>
                    {/* Outbound */}
                    {bookingData.outboundTransport && (
                      <div className={styles.flightColumn}>
                        <div className={styles.topRow}>
                          <span className={styles.label}>
                            Ngày đi - {formatDate(bookingData.outboundTransport.departTime)}
                          </span>
                          <span className={styles.flightCode}>
                            {bookingData.outboundTransport.transportCode}
                          </span>
                        </div>
                        <div className={styles.timeRow}>
                          <span className={styles.time}>
                            {new Date(bookingData.outboundTransport.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                          <span className={styles.time}>
                            {new Date(bookingData.outboundTransport.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <div className={styles.timelineBar}>
                          <div className={styles.dotLeft}></div>
                          <div className={styles.line}></div>
                          <div className={styles.dotRight}></div>
                          {bookingData.outboundTransport.vehicleType === 'PLANE' ? (
                         <FaPlane className={styles.planeIcon} />
                           ) : (
                             <FaBus className={styles.planeIcon} />
                          )}
                        </div>
                        <div className={styles.routeInfo}>
                          <AirportBadge
                            code={bookingData.outboundTransport.startPoint}
                            name={bookingData.outboundTransport.startPointName}
                          />
                          <AirportBadge
                            code={bookingData.outboundTransport.endPoint}
                            name={bookingData.outboundTransport.endPointName}
                          />
                        </div>
                           <p className={styles.flightInfo}>{bookingData.outboundTransport.vehicleName}</p>
                      </div>
                    )}

                    {bookingData.outboundTransport && bookingData.inboundTransport && (
                      <div className={styles.dividerDashed}></div>
                    )}

                    {/* Inbound */}
                    {bookingData.inboundTransport && (
                      <div className={styles.flightColumn}>
                        <div className={styles.topRow}>
                          <span className={styles.label}>
                            Ngày về - {formatDate(bookingData.inboundTransport.departTime)}
                          </span>
                          <span className={styles.flightCode}>
                            {bookingData.inboundTransport.transportCode}
                          </span>
                        </div>
                        <div className={styles.timeRow}>
                          <span className={styles.time}>
                            {new Date(bookingData.inboundTransport.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                          <span className={styles.time}>
                            {new Date(bookingData.inboundTransport.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <div className={styles.timelineBar}>
                          <div className={styles.dotLeft}></div>
                          <div className={styles.line}></div>
                          <div className={styles.dotRight}></div>
                          {bookingData.inboundTransport.vehicleType === 'PLANE' ? (
                            <FaPlane className={styles.planeIcon} />
                              ) : (
                                <FaBus className={styles.planeIcon} />
                          )}
                        </div>
                        <div className={styles.routeInfo}>
                          <AirportBadge
                            code={bookingData.inboundTransport.startPoint}
                            name={bookingData.inboundTransport.startPointName}
                          />
                          <AirportBadge
                            code={bookingData.inboundTransport.endPoint}
                            name={bookingData.inboundTransport.endPointName}
                          />
                        </div>
                           <p className={styles.flightInfo}>{bookingData.inboundTransport.vehicleName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className={styles.paymentSummary}>
                <div className={styles.summaryRow}>
                  <span>Tổng giá trị:</span>
                  <span>{formatCurrency(bookingData.originalPrice)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Đã thanh toán:</span>
                  <span className={styles.paidAmount}>
                    {formatCurrency(bookingData.paidAmount)}
                  </span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Còn phải trả:</span>
                  <span className={styles.remainingAmount}>
                    {formatCurrency(bookingData.remainingAmount)}
                  </span>
                </div>
              </div>
              {bookingData.status === 'PENDING_PAYMENT' && !isPaymentExpired && (
                <div className={styles.paymentMethodSelection}>
                  <h4>Chọn phương thức thanh toán:</h4>
                  
                  <div 
                    className={`${styles.methodOption} ${paymentMethod === 'VNPAY' ? styles.selected : ''}`}
                    onClick={() => setPaymentMethod('VNPAY')}
                  >
                    <div className={styles.radioCircle}>
                      {paymentMethod === 'VNPAY' && <div className={styles.innerCircle} />}
                    </div>
                    <img 
                      src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" 
                      alt="VNPAY" 
                      className={styles.methodLogo} 
                    />
                    <span>Ví VNPAY / Ngân hàng</span>
                  </div>

                  <div 
                    className={`${styles.methodOption} ${paymentMethod === 'PAYOS' ? styles.selected : ''}`}
                    onClick={() => setPaymentMethod('PAYOS')}
                  >
                    <div className={styles.radioCircle}>
                      {paymentMethod === 'PAYOS' && <div className={styles.innerCircle} />}
                    </div>
                    <img
                      src="https://payos.vn/docs/img/logo.svg"
                      alt="PayOS"
                      className={styles.methodLogo}
                      onError={(e) => {
                        // Fallback nếu logo PayOS chính thức không load được
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect width="120" height="40" rx="6" fill="%230369a1"/><text x="60" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="16" fill="white">PayOS</text></svg>';
                      }}
                    />
                    <span>Quét mã VietQR (PayOS)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Button */}
            {bookingData.status === 'PENDING_PAYMENT' && 
             bookingData.remainingAmount > 0 && 
             !isPaymentExpired && (
              <button 
                className={styles.btnPayment} 
                onClick={handlePayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <>
                    <FaSpinner className={styles.spinner} /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <FaCreditCard /> Thanh toán {formatCurrency(bookingData.remainingAmount)}
                  </>
                )}
              </button>
            )}

            {bookingData.status === 'PAID' && (
              <div className={styles.successMessage}>
                <FaCheckCircle /> Đã thanh toán đầy đủ
              </div>
            )}

            {isPaymentExpired && bookingData.status === 'PENDING_PAYMENT' && (
              <div className={styles.expiredMessage}>
                ❌ Thời hạn thanh toán đã hết
                <button
                  type="button"
                  className={styles.btnPayment}
                  onClick={() => toast.warn('Đơn đã quá hạn thanh toán. Vui lòng tạo booking mới hoặc liên hệ hỗ trợ.')}
                >
                  <FaClock /> Thông báo
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showConfirmModal && bookingData && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <div className={styles.confirmIconBox}>
                <FaCreditCard />
              </div>
              <div>
                <h3>Xác nhận thanh toán</h3>
                <p>Vui lòng kiểm tra thông tin trước khi thanh toán</p>
              </div>
            </div>

            <div className={styles.confirmBody}>
              <div className={styles.confirmRow}>
                <span>Mã booking</span>
                <strong className={styles.confirmCode}>{bookingData.bookingCode}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Phương thức</span>
                <strong>{paymentMethod === 'PAYOS' ? 'PayOS (Quét mã VietQR)' : 'VNPAY / Ngân hàng'}</strong>
              </div>
              <div className={`${styles.confirmRow} ${styles.confirmAmount}`}>
                <span>Số tiền thanh toán</span>
                <strong>{formatCurrency(bookingData.remainingAmount)}</strong>
              </div>
            </div>

            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => setShowConfirmModal(false)}
                disabled={paymentProcessing}
              >
                Hủy
              </button>
              <button
                className={styles.confirmOk}
                onClick={proceedPayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? <><FaSpinner className={styles.spin} /> Đang xử lý...</> : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPayment;
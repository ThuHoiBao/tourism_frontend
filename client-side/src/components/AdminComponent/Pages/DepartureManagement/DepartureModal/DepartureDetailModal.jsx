import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, DollarSign, Plane, User, Tag, FileText, ChevronRight, Edit2 } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './DepartureDetailModal.module.scss';

const DepartureDetailModal = ({ departureId, onClose, onEdit }) => {
  const [loading, setLoading] = useState(true);
  const [departure, setDeparture] = useState(null);

  useEffect(() => {
    if (departureId) {
      fetchDepartureDetail();
    }
  }, [departureId]);

  const fetchDepartureDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/departures/${departureId}`);
      
      if (response.data.success) {
        setDeparture(response.data.data);
      } else {
        toast.error('Không thể tải chi tiết lịch khởi hành');  
        onClose();
      }
    } catch (error) { 
      console.error('Error fetching departure detail:', error);
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết lịch khởi hành');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const calculatePriceStats = (pricings) => {
    if (!pricings || pricings.length === 0) {
      return { lowest: 0, highest: 0, avg: 0 };
    }

    const prices = pricings.map(p => p.salePrice || 0);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { lowest, highest, avg };
  };

  const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || originalPrice === 0) {
      return { amount: 0, percent: 0 };
    }
    
    const amount = originalPrice - (salePrice || 0);
    const percent = ((amount / originalPrice) * 100).toFixed(1);
    
    return { amount, percent };
  };

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.loadingBox}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!departure) return null;

  const priceStats = calculatePriceStats(departure.pricings);
  const bookedSlots = departure.bookedSlots || 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2>Chi Tiết Lịch Khởi Hành</h2>
              <p className={styles.subId}>ID: {departure.departureID}</p>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => {
                  onClose();
                  onEdit(departure);
                }}
                className={styles.btnHeaderEdit}
              >
                <Edit2 size={18} />
                <span>Chỉnh sửa</span>
              </button>
              <button
                onClick={onClose}
                className={styles.btnCloseIcon}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className={styles.statusRow}>
            {departure.status ? (
              <span className={`${styles.badge} ${styles.active}`}>
                ✓ Đang hoạt động
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.inactive}`}>
                ⊘ Tạm dừng
              </span>
            )}
            {departure.couponCode && (
              <span className={`${styles.badge} ${styles.coupon}`}>
                🏷️ {departure.couponCode}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentBody}>
          <div className={styles.gridLayout}>
            {/* Left Column - Main Info */}
            <div className={styles.leftColumn}>
              {/* Tour Info Card */}
              <div className={`${styles.card} ${styles.tourInfo}`}>
                <h3>
                  <MapPin size={20} className={styles.textBlue} />
                  Thông tin Tour
                </h3>
                <div className={styles.cardContent}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Tên tour:</span>
                    <span className={styles.value}>{departure.tourName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Mã tour:</span>
                    <span className={styles.tag}>
                      {departure.tourCode}
                    </span>
                  </div>
                  {departure.tourDuration && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Thời gian:</span>
                      <span className={styles.value}>{departure.tourDuration}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Table */}
              {departure.pricings && departure.pricings.length > 0 && (
                <div className={styles.pricingContainer}>
                  <div className={styles.tableHeader}>
                    <h3>
                      <DollarSign size={20} className={styles.textOrange} />
                      Bảng Giá
                    </h3>
                  </div>
                  <div className={styles.tableWrapper}>
                    <table>
                      <thead>
                        <tr>
                          <th>Loại khách</th>
                          <th>Độ tuổi</th>
                          <th className={styles.alignRight}>Giá gốc</th>
                          <th className={styles.alignRight}>Giá bán</th>
                          <th className={styles.alignRight}>Giảm giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departure.pricings.map((pricing) => {
                          const discount = calculateDiscount(pricing.originalPrice, pricing.salePrice);
                          
                          return (
                            <tr key={pricing.pricingID}>
                              <td>
                                <span className={styles.value}>
                                  {pricing.passengerType}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                  {pricing.ageDescription}
                                </span>
                              </td>
                              <td className={styles.alignRight}>
                                <span className={styles.originalPrice}>
                                  {formatPrice(pricing.originalPrice)}
                                </span>
                              </td>
                              <td className={styles.alignRight}>
                                <span className={styles.salePrice}>
                                  {formatPrice(pricing.salePrice)}
                                </span>
                              </td>
                              <td className={styles.alignRight}>
                                <div className={styles.discountInfo}>
                                  <span className={styles.amount}>
                                    -{formatPrice(discount.amount)}
                                  </span>
                                  <span className={styles.percent}>
                                    ({discount.percent}%)
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Price Summary */}
                  <div className={styles.priceSummary}>
                    <div className={styles.summaryGrid}>
                      <div className={`${styles.summaryItem} ${styles.lowest}`}>
                        <p className={styles.label}>Giá thấp nhất</p>
                        <p className={styles.value}>{formatPrice(priceStats.lowest)}</p>
                      </div>
                      <div className={`${styles.summaryItem} ${styles.highest}`}>
                        <p className={styles.label}>Giá cao nhất</p>
                        <p className={styles.value}>{formatPrice(priceStats.highest)}</p>
                      </div>
                      <div className={`${styles.summaryItem} ${styles.avg}`}>
                        <p className={styles.label}>Giá trung bình</p>
                        <p className={styles.value}>{formatPrice(priceStats.avg)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transport Info */}
              {(departure.outboundTransport || departure.inboundTransport) && (
                <div className={styles.leftColumn}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    <Plane size={20} className={styles.textBlue} />
                    Thông tin Vận chuyển
                  </h3>

                  {departure.outboundTransport && (
                    <div className={`${styles.card} ${styles.outbound}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Plane size={20} className={styles.textGreen} style={{ transform: 'rotate(-45deg)' }} />
                        <h4 style={{ fontWeight: '700', margin: 0 }}>Chiều đi</h4>
                      </div>
                      <div className={styles.transportGrid}>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Loại xe / Tên</p>
                          <p className={styles.subValue}>
                            {departure.outboundTransport.vehicleName || 'N/A'}
                          </p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Mã chuyến</p>
                          <p className={`${styles.code}`} style={{ background: '#d1fae5', color: '#065f46' }}>
                            {departure.outboundTransport.transportCode}
                          </p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Điểm đi</p>
                          <p className={styles.subValue}>{departure.outboundTransport.startPoint}</p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Điểm đến</p>
                          <p className={styles.subValue}>{departure.outboundTransport.endPoint}</p>
                        </div>
                        <div className={styles.timeRow}>
                          <div className={styles.timeBlock}>
                            <p className={styles.subLabel}>Khởi hành</p>
                            <p className={styles.subValue}>
                              {formatDateTime(departure.outboundTransport.departTime)}
                            </p>
                          </div>
                          <ChevronRight style={{ color: '#9ca3af' }} />
                          <div className={styles.timeBlock}>
                            <p className={styles.subLabel}>Đến nơi</p>
                            <p className={styles.subValue}>
                              {formatDateTime(departure.outboundTransport.arrivalTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {departure.inboundTransport && (
                    <div className={`${styles.card} ${styles.inbound}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Plane size={20} className={styles.textBlue} style={{ transform: 'rotate(135deg)' }} />
                        <h4 style={{ fontWeight: '700', margin: 0 }}>Chiều về</h4>
                      </div>
                      <div className={styles.transportGrid}>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Loại xe / Tên</p>
                          <p className={styles.subValue}>
                            {departure.inboundTransport.vehicleName || 'N/A'}
                          </p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Mã chuyến</p>
                          <p className={`${styles.code}`} style={{ background: '#dbeafe', color: '#1e40af' }}>
                            {departure.inboundTransport.transportCode}
                          </p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Điểm đi</p>
                          <p className={styles.subValue}>{departure.inboundTransport.startPoint}</p>
                        </div>
                        <div className={styles.item}>
                          <p className={styles.subLabel}>Điểm đến</p>
                          <p className={styles.subValue}>{departure.inboundTransport.endPoint}</p>
                        </div>
                        <div className={styles.timeRow}>
                          <div className={styles.timeBlock}>
                            <p className={styles.subLabel}>Khởi hành</p>
                            <p className={styles.subValue}>
                              {formatDateTime(departure.inboundTransport.departTime)}
                            </p>
                          </div>
                          <ChevronRight style={{ color: '#9ca3af' }} />
                          <div className={styles.timeBlock}>
                            <p className={styles.subLabel}>Đến nơi</p>
                            <p className={styles.subValue}>
                              {formatDateTime(departure.inboundTransport.arrivalTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Additional Info */}
            <div className={styles.rightColumn}>
              {/* Quick Stats */}
              <div className={`${styles.card} ${styles.bgWhite}`}>
                <h3>Thống kê nhanh</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={`${styles.statItem} ${styles.blue}`}>
                    <div className={styles.left}>
                      <Calendar className={styles.textBlue} size={20} />
                      <span>Ngày khởi hành</span>
                    </div>
                    <span className={styles.val}>{formatDate(departure.departureDate)}</span>
                  </div>

                  <div className={`${styles.statItem} ${styles.green}`}>
                    <div className={styles.left}>
                      <Users className={styles.textGreen} size={20} />
                      <span>Chỗ trống</span>
                    </div>
                    <span className={styles.val}>{departure.availableSlots}</span>
                  </div>

                  <div className={`${styles.statItem} ${styles.orange}`}>
                    <div className={styles.left}>
                      <Users className={styles.textOrange} size={20} />
                      <span>Đã đặt</span>
                    </div>
                    <span className={styles.val}>{bookedSlots}</span>
                  </div>
                </div>
              </div>

              {/* Tour Guide Info */}
              {departure.tourGuideInfo && (
                <div className={`${styles.card} ${styles.bgWhite}`}>
                  <h3>
                    <User size={20} className={styles.textPurple} />
                    Hướng dẫn viên
                  </h3>
                  <div className={`${styles.textAreaBox} ${styles.purple}`}>
                    <pre>{departure.tourGuideInfo}</pre>
                  </div>
                </div>
              )}

              {/* Policy */}
              {departure.policyTemplateName && (
                <div className={`${styles.card} ${styles.bgWhite}`}>
                  <h3>
                    <FileText size={20} className={styles.textIndigo} />
                    Chính sách
                  </h3>
                  <div className={`${styles.textAreaBox} ${styles.indigo}`}>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {departure.policyTemplateName}
                    </p>
                  </div>
                </div>
              )}

              {/* Coupon */}
              {departure.couponCode && (
                <div className={`${styles.card} ${styles.couponCard}`}>
                  <h3>
                    <Tag size={20} className={styles.textOrange} />
                    Mã giảm giá
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: '#9a3412', background: 'white', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                      {departure.couponCode}
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Info */}
              {departure.createdAt && (
                <div className={`${styles.card} ${styles.bgGray} ${styles.auditInfo}`}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Thông tin hệ thống</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className={styles.row}>
                      <span>Ngày tạo:</span>
                      <span className={styles.val}>{formatDateTime(departure.createdAt)}</span>
                    </div>
                    {departure.updatedAt && (
                      <div className={styles.row}>
                        <span>Cập nhật:</span>
                        <span className={styles.val}>{formatDateTime(departure.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.btnClose}
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(departure);
            }}
            className={styles.btnEdit}
          >
            <Edit2 size={20} />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartureDetailModal;
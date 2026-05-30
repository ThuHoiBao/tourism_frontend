import React from 'react';
import styles from './BookingConfirmCard.module.scss';

/**
 * BookingConfirmCard — hiển thị tóm tắt thông tin đặt tour để user xác nhận.
 * Nhận data từ ChatMessageResponse.bookingConfirmData
 */
const BookingConfirmCard = ({ data, onConfirm, onCancel }) => {
  if (!data) return null;

  const fmt = (num) => num ? Number(num).toLocaleString('vi-VN') : '0';
  const vnGender = (gender) => {
    if (!gender) return '';
    const g = String(gender).toUpperCase();
    if (g === 'MALE') return 'Nam';
    if (g === 'FEMALE') return 'Nữ';
    if (g === 'OTHER') return 'Khác';
    return gender;
  };
  const vnPassengerType = (type) => {
    if (!type) return '';
    const t = String(type).toUpperCase();
    if (t === 'ADULT') return 'Người lớn';
    if (t === 'CHILD') return 'Trẻ em';
    if (t === 'TODDLER') return 'Trẻ nhỏ';
    if (t === 'INFANT') return 'Em bé';
    return type;
  };

  const passengerRows = [];
  if (data.adultCount > 0)   passengerRows.push({ label: 'Người lớn', count: data.adultCount,   price: data.adultPrice });
  if (data.childCount > 0)   passengerRows.push({ label: 'Trẻ em',    count: data.childCount,   price: data.childPrice });
  if (data.toddlerCount > 0) passengerRows.push({ label: 'Trẻ nhỏ',   count: data.toddlerCount, price: data.toddlerPrice });
  if (data.infantCount > 0)  passengerRows.push({ label: 'Em bé',     count: data.infantCount,  price: data.infantPrice });

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.icon}>📋</span>
        <span className={styles.title}>XÁC NHẬN ĐẶT TOUR</span>
      </div>

      {/* Tour info */}
      <div className={styles.tourInfo}>
        {data.tourImage && (
          <img src={data.tourImage} alt={data.tourName} className={styles.tourImg} />
        )}
        <div className={styles.tourDetails}>
          <h4 className={styles.tourName}>{data.tourName}</h4>
          <p className={styles.tourMeta}>
            📅 {data.departureDate}
            {data.departureCity && <> | ✈️ {data.departureCity}</>}
            {data.duration && <> | ⏱️ {data.duration}</>}
          </p>
        </div>
      </div>

      {/* Price table */}
      <div className={styles.priceTable}>
        <div className={styles.tableHeader}>
          <span>Loại</span><span>Số lượng</span><span>Đơn giá</span><span>Thành tiền</span>
        </div>
        {passengerRows.map((row, i) => (
          <div className={styles.tableRow} key={i}>
            <span>{row.label}</span>
            <span>× {row.count}</span>
            <span>{fmt(row.price)}đ</span>
            <span className={styles.rowTotal}>{fmt(row.count * row.price)}đ</span>
          </div>
        ))}
        <div className={styles.totalRow}>
          <span>💰 TỔNG DỰ TÍNH</span>
          <span></span>
          <span></span>
          <span className={styles.totalAmount}>~{fmt(data.estimatedTotal)}đ</span>
        </div>
      </div>

      {data.passengers && data.passengers.length > 0 && (
        <div className={styles.passengerInfo}>
          <p className={styles.passengerLabel}>Danh sách hành khách</p>
          {data.passengers.map((passenger, index) => (
            <p key={`${passenger.fullName || 'passenger'}-${index}`}>
              {index + 1}. {passenger.fullName || 'Chưa có tên'}
              {passenger.gender && <> | {vnGender(passenger.gender)}</>}
              {passenger.dateOfBirth && <> | {passenger.dateOfBirth}</>}
              {passenger.type && <> | {vnPassengerType(passenger.type)}</>}
            </p>
          ))}
        </div>
      )}

      {/* Contact info */}
      <div className={styles.contactInfo}>
        <p className={styles.contactLabel}>👤 Người liên hệ</p>
        <p>{data.contactName} | {data.contactPhone}</p>
        <p>📧 {data.contactEmail}</p>
      </div>

      {/* Warning */}
      <div className={styles.warning}>
        ⚠️ Hạn thanh toán: <strong>24 giờ</strong> kể từ khi đặt
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.confirmBtn} onClick={onConfirm}>
          ✅ Xác nhận đặt tour
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          ❌ Hủy
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmCard;

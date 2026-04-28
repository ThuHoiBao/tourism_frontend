import React, { useState } from 'react';
import styles from './TourPolicy.module.scss';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const TourPolicy = ({ policy, branchContact }) => {
  // State lưu trạng thái mở/đóng của từng item (Object key-value)
  // Ví dụ: { 0: true, 2: true } -> Item 0 và 2 đang mở
  const [expandedItems, setExpandedItems] = useState({});
  if (!policy) return null;
  const renderContactInfo = (contact) => {
    if (!contact) return null;
    return `
      <ul style="list-style: none; padding-left: 0;">
        <li style="margin-bottom: 8px;">
            <strong>🏢 Văn phòng:</strong> ${contact.branchName}
        </li>
        <li style="margin-bottom: 8px;">
            <strong>📍 Địa chỉ:</strong> ${contact.address}
        </li>
        <li style="margin-bottom: 8px;">
            <strong>📞 Hotline:</strong> 
            <a href="tel:${contact.phone}" style="color: #007bff; text-decoration: none; font-weight: bold;">
                ${contact.phone}
            </a>
        </li>
        <li>
            <strong>✉️ Email:</strong> 
            <a href="mailto:${contact.email}" style="color: #007bff; text-decoration: none;">
                ${contact.email}
            </a>
        </li>
      </ul>
    `;
  };


  // Cấu hình mapping: Label hiển thị vs Dữ liệu từ API
  // Bạn có thể thêm/bớt tùy theo dữ liệu Backend trả về
  const policyItems = [
    {
      label: 'Giá tour bao gồm',
      content: policy.tourPriceIncludes || 'Đang cập nhật...' 
    },
    {
      label: 'Giá tour không bao gồm',
      content: policy.tourPriceExcludes || 'Đang cập nhật...'
    },
    {
      label: 'Lưu ý giá trẻ em',
      content: policy.childPricingNotes
    },
    {
      label: 'Điều kiện thanh toán',
      content: policy.paymentConditions
    },
    {
      label: 'Điều kiện đăng ký',
      content: policy.registrationConditions
    },
    {
      label: 'Điều kiện hủy tour (Ngày thường)',
      content: policy.regularDayCancellationRules
    },
    {
      label: 'Điều kiện hủy tour (Lễ, Tết)',
      content: policy.holidayCancellationRules
    },
    {
      label: 'Trường hợp bất khả kháng',
      content: policy.forceMajeureRules
    },
    {
      label: 'Hành lý & Chuẩn bị',
      content: policy.packingList
    },
    {
      label: 'Liên hệ & hỗ trợ',
      content: renderContactInfo(branchContact)
    }
  ];

  const toggleItem = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index] // Đảo ngược trạng thái của item đó
    }));
  };

  return (
    <div className={styles.policyContainer}>
      <h2 className={styles.sectionTitle}>NHỮNG THÔNG TIN CẦN LƯU Ý</h2>
      
      <div className={styles.gridWrapper}>
        {policyItems.map((item, index) => {
          // Nếu content null hoặc rỗng thì không render ô này
          if (!item.content) return null;

          const isOpen = !!expandedItems[index]; // Convert sang boolean

          return (
            <div key={index} className={`${styles.policyItem} ${isOpen ? styles.active : ''}`}>
              
              {/* HEADER: Click để mở */}
              <div className={styles.header} onClick={() => toggleItem(index)}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.icon}>
                  {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>

              {/* BODY: Nội dung xổ xuống */}
              <div className={`${styles.body} ${isOpen ? styles.open : ''}`}>
                <div className={styles.bodyInner}>
                  <div 
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TourPolicy;
import React, { useState } from 'react';
import styles from './TourPolicy.module.scss';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const TourPolicy = ({ policy, branchContact }) => {
  // Single-open mutex: chỉ MỘT mục được mở tại một thời điểm
  // → tránh layout 2 cột bị "dàn trải" khi nhiều mục mở cùng lúc.
  const [activeIndex, setActiveIndex] = useState(null);
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
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className={styles.policyContainer}>
      <h2 className={styles.sectionTitle}>NHỮNG THÔNG TIN CẦN LƯU Ý</h2>

      {/* Chia items có content thành 2 cột cố định (even/odd index).
          Mỗi cột là 1 flex độc lập → mở 1 mục KHÔNG làm các mục ở cột
          bên kia nhảy lộn xộn. */}
      {(() => {
        const visible = policyItems
          .map((item, idx) => ({ ...item, _idx: idx }))
          .filter(it => it.content);
        const leftCol  = visible.filter((_, i) => i % 2 === 0);
        const rightCol = visible.filter((_, i) => i % 2 === 1);

        const renderItem = (item) => {
          const index = item._idx;
          const isOpen = activeIndex === index;
          return (
            <div key={index} className={`${styles.policyItem} ${isOpen ? styles.active : ''}`}>
              <div className={styles.header} onClick={() => toggleItem(index)}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.icon}>
                  {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
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
        };

        return (
          <div className={styles.gridWrapper}>
            <div className={styles.column}>{leftCol.map(renderItem)}</div>
            <div className={styles.column}>{rightCol.map(renderItem)}</div>
          </div>
        );
      })()}
    </div>
  );
};

export default TourPolicy;
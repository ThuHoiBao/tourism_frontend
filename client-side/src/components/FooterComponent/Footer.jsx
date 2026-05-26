import React from 'react';
import styles from './Footer.module.scss';

import { FaFacebookF, FaInstagram, FaYoutube, FaTelegramPlane, FaTiktok } from 'react-icons/fa';
import { IoIosAirplane } from 'react-icons/io';
import { FaTicketAlt, FaRegBuilding } from 'react-icons/fa';
import { Plane, CreditCard, Phone } from 'lucide-react';

// Import payment logos từ assets
import visaImg from '../../assets/images/VISA.png';
import masterCardImg from '../../assets/images/mastercard.png';
import JCBImg from '../../assets/images/JCB.png';
import VietCombankImg from '../../assets/images/VietcomBank.png';
import TechcombankImg from '../../assets/images/TechcomBank.png';
import MBBankImg from '../../assets/images/MBBank.png';
import MoMoImg from '../../assets/images/MoMo.png';
import ZaloPayImg from '../../assets/images/ZaLoPay.png';
import VNPAYImg from '../../assets/images/VNPAY.png';

// 3 cột menu tinh giản
const menuColumns = [
  {
    title: 'Về Future',
    items: [
      { name: 'Về chúng tôi', link: '#' },
      { name: 'Liên hệ', link: '#' },
      { name: 'Trợ giúp', link: '#' },
      { name: 'Tuyển dụng', link: '#' },
    ],
  },
  {
    title: 'Sản phẩm',
    items: [
      { name: 'Tour du lịch', link: '#', icon: IoIosAirplane },
      { name: 'Khách sạn', link: '#', icon: FaRegBuilding },
      { name: 'Vé máy bay', link: '#', icon: IoIosAirplane },
      { name: 'Cho thuê xe', link: '#', icon: FaTicketAlt },
    ],
  },
  {
    title: 'Chính sách',
    items: [
      { name: 'Điều khoản sử dụng', link: '#' },
      { name: 'Chính sách bảo mật', link: '#' },
      { name: 'Quy chế hoạt động', link: '#' },
      { name: 'Future Blog', link: '#' },
    ],
  },
];

const socialMedia = [
  { name: 'Facebook', icon: FaFacebookF, link: 'https://www.facebook.com/profile.php?id=61590489687138', color: '#1877f2' },
  { name: 'Instagram', icon: FaInstagram, link: 'https://www.instagram.com/thoai2368/', color: '#e4405f' },
  { name: 'Youtube', icon: FaYoutube, link: 'https://www.youtube.com/@thoaiuc6257', color: '#ff0000' },
  { name: 'TikTok', icon: FaTiktok, link: 'https://www.tiktok.com/@thoaiduc69_zen', color: '#000000' },
  { name: 'Telegram', icon: FaTelegramPlane, link: 'https://t.me/cap_pucci_no', color: '#0088cc' },
];

const paymentMethods = [
  { name: 'Visa',        img: visaImg },
  { name: 'Mastercard',  img: masterCardImg },
  { name: 'JCB',         img: JCBImg },
  { name: 'Vietcombank', img: VietCombankImg },
  { name: 'Techcombank', img: TechcombankImg },
  { name: 'MBBBank',     img: MBBankImg },
  { name: 'Momo',        img: MoMoImg },
  { name: 'ZaloPay',     img: ZaloPayImg },
  { name: 'VNPay',       img: VNPAYImg },
];

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>

        {/* ── Top: Brand + 3 menu columns ── */}
        <div className={styles.topSection}>
          <div className={styles.logoColumn}>
            <div className={styles.brandHeader}>
              <div className={styles.brandIcon}><Plane size={22} /></div>
              <span className={styles.logo}>FUTURE TRAVEL</span>
            </div>

            <p className={styles.brandTagline}>
              Đồng hành cùng bạn trên mọi chuyến đi.
            </p>

            <div className={styles.hotlineBox}>
              <div className={styles.hotlineIcon}><Phone size={18} /></div>
              <div>
                <div className={styles.hotlineLabel}>Hotline 24/7</div>
                <div className={styles.hotlineNumber}>1900 1234</div>
              </div>
            </div>
          </div>

          <div className={styles.linkColumns}>
            {menuColumns.map((col, index) => (
              <div key={index} className={styles.linkColumn}>
                <h3 className={styles.columnTitle}>{col.title}</h3>
                <ul className={styles.menuList}>
                  {col.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <li key={itemIndex}>
                        <a href={item.link} className={styles.menuLink}>
                          {Icon && <Icon className={styles.menuIcon} />}
                          {item.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Middle: Payment + Social — 1 hàng ── */}
        <div className={styles.middleSection}>
          <div className={styles.paymentBlock}>
            <h3 className={styles.blockTitle}>
              <CreditCard size={18} /> Đối tác thanh toán
            </h3>
            <div className={styles.paymentLogos}>
              {paymentMethods.map(b => (
                <div key={b.name} className={styles.paymentCard} title={b.name}>
                  <img src={b.img} alt={b.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.socialBlock}>
            <h3 className={styles.blockTitle}>Kết nối</h3>
            <div className={styles.socialRow}>
              {socialMedia.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.link}
                    className={styles.socialIconBtn}
                    style={{ '--social-color': social.color }}
                    aria-label={social.name}
                    target="_blank"
                  >
                    <Icon className={styles.socialIcon} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Copyright ── */}
        <div className={styles.copyright}>
          <p className={styles.copyrightText}>
            © 2025 <strong>Future Travel</strong> · Công ty TNHH Future Việt Nam · MST: 0313580179
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

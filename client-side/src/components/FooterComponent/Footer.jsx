import React from 'react';
import styles from './Footer.module.scss';

// Import Icons (Giả định bạn đang sử dụng React Icons)
import { FaFacebookF, FaInstagram, FaYoutube, FaTelegramPlane } from 'react-icons/fa';
import { GiShipBow } from 'react-icons/gi';
import { IoIosAirplane } from "react-icons/io";
import { FaTicketAlt } from "react-icons/fa";
import { FaRegBuilding } from "react-icons/fa";
import chanel from '../../assets/images/chanel.png'
import nike from '../../assets/images/nike.png'
// Data cấu hình cho 4 cột menu
const menuColumns = [
    {
        title: 'Về Future',
        items: [
            { name: 'Cách đặt chỗ', link: '#' },
            { name: 'Liên hệ chúng tôi', link: '#' },
            { name: 'Trợ giúp', link: '#' },
            { name: 'Tuyển dụng', link: '#' },
            { name: 'Về chúng tôi', link: '#' },
        ]
    },
    {
        title: 'Sản phẩm',
        items: [
            { name: 'Khách sạn', link: '#', icon: FaRegBuilding },
            { name: 'Vé máy bay', link: '#', icon: IoIosAirplane },
            { name: 'Vé xe khách', link: '#', icon: FaTicketAlt },
            { name: 'Đưa đón sân bay', link: '#', icon: IoIosAirplane },
            { name: 'Cho thuê xe', link: '#' },
            { name: 'Hoạt động & Vui chơi', link: '#' },
            { name: 'Du thuyền', link: '#' },
            { name: 'Biệt thự', link: '#' },
            { name: 'Căn hộ', link: '#' },
        ]
    },
    {
        title: 'Khác',
        items: [
            { name: 'Future Affiliate', link: '#' },
            { name: 'Giới thiệu bạn bè', link: '#' },
            { name: 'Future Blog', link: '#' },
            { name: 'Chính Sách Quyền Riêng', link: '#' },
            { name: 'Điều khoản & Điều kiện', link: '#' },
            { name: 'Đăng ký nơi nghỉ của bạn', link: '#' },
            { name: 'Đăng ký kinh doanh hoạt động du lịch của bạn', link: '#' },
            { name: 'Khu vực báo chí', link: '#' },
            { name: 'Quy chế hoạt động', link: '#' },
            { name: 'Vulnerability Disclosure Program', link: '#' },
            { name: 'APAC Travel Insights', link: '#' },
        ]
    },
    {
        title: 'Hợp tác với Future',
        items: [
            { name: 'Về chúng tôi', link: '#' },
            { name: 'Cho thuê xe', link: '#' },
            { name: 'Hoạt động & Vui chơi', link: '#' },
            { name: 'Du thuyền', link: '#' },
            { name: 'Biệt thự', link: '#' },
            { name: 'Căn hộ', link: '#' },
            { name: 'Điều khoản & Điều kiện', link: '#' },
            { name: 'Đăng ký nơi nghỉ của bạn', link: '#' },
            { name: 'Đăng ký kinh doanh hoạt động du lịch của bạn', link: '#' },
            { name: 'Khu vực báo chí', link: '#' },
        ]
    },
];

const socialMedia = [
    { name: 'Facebook', icon: FaFacebookF, link: '#' },
    { name: 'Instagram', icon: FaInstagram, link: '#' },
    { name: 'Youtube', icon: FaYoutube, link: '#' },
    { name: 'Telegram', icon: FaTelegramPlane, link: '#' },
];

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                
                <div className={styles.topSection}>
                    {/* Cột 1: Logo và Đăng ký */}
                    <div className={styles.logoColumn}>
                        <div className={styles.logo}>Future</div> 
                        
                        {/* ⚠️ Thay thế bằng ảnh thật của logo/chứng nhận của bạn */}
                        <div className={styles.certs}>
                            <img src={chanel} alt="chanel" className={styles.certImage} />
                            <img src={nike} alt="nike" className={styles.certImage} />
                        </div>

                        <button className={styles.partnerButton}>
                            Hợp tác với Future
                        </button>

                        <p className={styles.paymentTitle}>Đội tác thanh toán</p>
                        {/* ⚠️ Thay thế bằng ảnh thật của các thẻ */}
                        <div className={styles.paymentLogos}>
                            <div className={styles.paymentLogoPlaceholder}>VISA</div>
                            <div className={styles.paymentLogoPlaceholder}>MASTER</div>
                            <div className={styles.paymentLogoPlaceholder}>JCB</div>
                            <div className={styles.paymentLogoPlaceholder}>AMEX</div>
                            <div className={styles.paymentLogoPlaceholder}>VPBank</div>
                        </div>
                    </div>

                    {/* Cột 2, 3, 4: Menu Liên kết */}
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

                <div className={styles.bottomSection}>
                    {/* Theo dõi chúng tôi và Tải ứng dụng */}
                    <div className={styles.socialApps}>
                        <div className={styles.socialMedia}>
                            <h3 className={styles.columnTitle}>Theo dõi chúng tôi trên</h3>
                            {socialMedia.map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a key={index} href={social.link} className={styles.socialLink}>
                                        <Icon className={styles.socialIcon} />
                                        {social.name}
                                    </a>
                                );
                            })}
                        </div>
                        
                        <div className={styles.appDownloads}>
                            <h3 className={styles.columnTitle}>Tải ứng dụng Future</h3>
                            {/* ⚠️ Thay thế bằng ảnh thật hoặc component nút tải */}
                            <div className={styles.appButtonPlaceholder}>Google Play</div> 
                            <div className={styles.appButtonPlaceholder}>App Store</div>
                        </div>
                    </div>
                    
                    {/* Thông tin công ty và Bản quyền */}
                    <div className={styles.copyright}>
                        <p className={styles.companyInfo}>
                            Công ty TNHH Future Việt Nam. Mã số ĐN: 0313580179. Tòa nhà An Phú, 117-119 Lý Chính Thắng, Phường Xuân Hòa, TP.HCM
                        </p>
                        <p className={styles.copyrightText}>
                            Copyright © 2025 Future. All rights reserved
                        </p>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
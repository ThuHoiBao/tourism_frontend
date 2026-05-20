// src/components/InformationComponent/TransactionList/TransactionListItem/TransactionDetailModal/TransactionDetailModal.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle,
    BadgeCheck,
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Coins,
    CreditCard,
    DollarSign,
    Hash,
    Info,
    Landmark,
    Mail,
    MapPin,
    NotebookText,
    Phone,
    Plane,
    ReceiptText,
    Ticket,
    UserRound,
    Users,
    WalletCards,
    X,
} from 'lucide-react';
import styles from './TransactionDetailModal.module.scss';

const detailSections = [
    { id: 'booking-contact', label: 'Thông tin người đặt', icon: UserRound },
    { id: 'booking-passengers', label: 'Danh sách hành khách', icon: Users },
    { id: 'booking-payment', label: 'Thông tin thanh toán', icon: WalletCards },
    { id: 'booking-refund', label: 'Thông tin hoàn sau hủy', icon: DollarSign },
];

const InfoTile = ({ icon, label, value, wide = false }) => (
    <div className={`${styles.infoTile} ${wide ? styles.infoTileWide : ''}`}>
        <span className={styles.infoTileIcon}>{icon}</span>
        <div>
            <span>{label}</span>
            <strong>{value || 'N/A'}</strong>
        </div>
    </div>
);

const PaymentRow = ({ label, value, variant = 'default' }) => (
    <div className={`${styles.paymentRow} ${styles[variant] || ''}`}>
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const TransactionDetailModal = ({ booking, onClose, formatPrice, formatDate }) => {
    const bodyRef = useRef(null);

    const formatBookingDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getGenderLabel = (gender) => {
        if (gender === 'MALE') return 'Nam';
        if (gender === 'FEMALE') return 'Nữ';
        return 'Khác';
    };

    const getPassengerTypeLabel = (type) => {
        if (type === 'ADULT') return 'Người lớn';
        if (type === 'CHILD') return 'Trẻ em';
        return 'Em bé';
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            PENDING_PAYMENT: { label: 'Chờ thanh toán', className: styles.statusPending },
            PENDING_CONFIRMATION: { label: 'Chờ xác nhận', className: styles.statusPending },
            PAID: { label: 'Đã thanh toán', className: styles.statusDone },
            CANCELLED: { label: 'Đã hủy', className: styles.statusFailed },
            OVERDUE_PAYMENT: { label: 'Quá hạn thanh toán', className: styles.statusFailed },
            PENDING_REVIEW: { label: 'Chờ đánh giá', className: styles.statusPending },
            REVIEWED: { label: 'Đã đánh giá', className: styles.statusDone },
            PENDING_REFUND: { label: 'Chờ hoàn tiền', className: styles.statusPending },
        };

        return statusMap[status] || {
            label: status || 'Chưa cập nhật',
            className: styles.statusDefault,
        };
    };

    const normalizedCoinRefundStatus = typeof booking.coinRefundStatus === 'string'
        ? booking.coinRefundStatus.trim().toUpperCase()
        : null;
    const validCoinStatus = ['PENDING', 'COMPLETED', 'FAILED'].includes(normalizedCoinRefundStatus)
        ? normalizedCoinRefundStatus
        : null;
    const refundAmount = Number(booking.refundAmount || 0);
    const refundBaseAmount = Number(booking.totalPrice || 0) + Number(booking.paidByCoin || 0);
    const refundDeductionAmount = Math.max(refundBaseAmount - refundAmount, 0);
    const coinRefundAmount = Math.floor(refundAmount / 1000);
    const usedCoinValue = Number(booking.paidByCoin || 0);
    const hasBankRefundInfo = Boolean(
        booking.refundBank ||
        booking.refundAccountNumber ||
        booking.refundAccountName
    );
    const showCoinRefund = Boolean(validCoinStatus) && refundAmount > 0;
    const showBankRefund = refundAmount > 0 && !showCoinRefund && hasBankRefundInfo;
    const showGenericRefund = refundAmount > 0 && !showCoinRefund && !hasBankRefundInfo;
    const statusInfo = getStatusInfo(booking.bookingStatus);
    const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
    const passengerCount = Number(booking.totalPassengers || passengers.length || 0);
    const paymentId = Number(booking.paymentID || 0);
    const paymentMethodLabel = booking.bookingStatus === 'PENDING_PAYMENT'
        ? 'Chưa thanh toán'
        : 'Thanh toán trực tuyến';

    const handleSectionJump = (sectionId) => {
        const section = bodyRef.current?.querySelector(`#${sectionId}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const renderRefundStatus = () => {
        if (showCoinRefund) {
            if (validCoinStatus === 'PENDING') {
                return <span className={styles.statusPending}><Clock3 size={14} /> Đang xử lý</span>;
            }
            if (validCoinStatus === 'COMPLETED') {
                return <span className={styles.statusDone}><CheckCircle2 size={14} /> Đã hoàn điểm</span>;
            }
            return <span className={styles.statusFailed}><AlertTriangle size={14} /> Cần hỗ trợ</span>;
        }

        if (refundAmount > 0) {
            return booking.bookingStatus === 'PENDING_REFUND'
                ? <span className={styles.statusPending}><Clock3 size={14} /> Đang xử lý</span>
                : <span className={styles.statusDone}><CheckCircle2 size={14} /> {showGenericRefund ? 'Đã ghi nhận' : 'Đã hoàn'}</span>;
        }

        return <span className={styles.statusDefault}><Info size={14} /> Chưa phát sinh</span>;
    };

    const modalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <section className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <div className={styles.headerTop}>
                        <div className={styles.titleGroup}>
                            <span className={styles.titleIcon}>
                                <ReceiptText size={22} strokeWidth={2.4} />
                            </span>
                            <div>
                                <p className={styles.eyebrow}>Chi tiết booking</p>
                                <h2 className={styles.modalTitle}>Chi tiết giao dịch</h2>
                                <div className={styles.headerMeta}>
                                    <span><Ticket size={14} /> {booking.bookingCode || 'N/A'}</span>
                                    <span><CalendarDays size={14} /> {formatBookingDateTime(booking.bookingDate)}</span>
                                    <span className={`${styles.statusChip} ${statusInfo.className}`}>{statusInfo.label}</span>
                                </div>
                            </div>
                        </div>

                        <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Đóng">
                            <X size={19} />
                        </button>
                    </div>

                    <nav className={styles.sectionNav} aria-label="Đi tới phần chi tiết booking">
                        {detailSections.map(({ id, label, icon: Icon }) => (
                            <button key={id} type="button" onClick={() => handleSectionJump(id)}>
                                <Icon size={15} strokeWidth={2.3} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>
                </header>

                <div className={styles.modalBody} ref={bodyRef}>
                    <aside className={styles.bookingRail}>
                        <div className={styles.summaryPanel}>
                            <img
                                src={booking.image || 'https://via.placeholder.com/640x420?text=Chuyen+di'}
                                alt={booking.tourName || 'Ảnh chuyến đi'}
                                className={styles.tourImage}
                            />
                            <div className={styles.summaryContent}>
                                <span className={`${styles.statusChip} ${statusInfo.className}`}>{statusInfo.label}</span>
                                <h3>{booking.tourName || 'Chuyến đi của bạn'}</h3>
                                <div className={styles.summaryMeta}>
                                    <span><Plane size={15} /> Mã chuyến: {booking.tourCode || 'N/A'}</span>
                                    <span><CalendarDays size={15} /> Khởi hành: {formatDate(booking.departureDate) || 'N/A'}</span>
                                    <span><Users size={15} /> {passengerCount} hành khách</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.totalPanel}>
                            <span>Tổng thanh toán</span>
                            <strong>{formatPrice(booking.totalPrice || 0)}</strong>
                            <small>{paymentMethodLabel}</small>
                        </div>

                        {booking.cancelReason && booking.cancelReason.trim() && (
                            <div className={styles.notePanel}>
                                <NotebookText size={16} />
                                <div>
                                    <span>Lý do hủy</span>
                                    <p>{booking.cancelReason}</p>
                                </div>
                            </div>
                        )}
                    </aside>

                    <main className={styles.detailMain}>
                        <section id="booking-contact" className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <p>Thông tin liên hệ</p>
                                    <h3><UserRound size={18} /> Thông tin người đặt</h3>
                                </div>
                            </div>

                            <div className={styles.infoGrid}>
                                <InfoTile icon={<UserRound size={17} />} label="Họ tên" value={booking.contactFullName} />
                                <InfoTile icon={<Mail size={17} />} label="Email" value={booking.contactEmail} />
                                <InfoTile icon={<Phone size={17} />} label="Số điện thoại" value={booking.contactPhone} />
                                <InfoTile icon={<MapPin size={17} />} label="Địa chỉ" value={booking.contactAddress} />
                                <InfoTile icon={<Info size={17} />} label="Ghi chú" value={booking.customerNote || 'Không có'} wide />
                            </div>
                        </section>

                        <section id="booking-passengers" className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <p>Đi cùng chuyến đi</p>
                                    <h3><Users size={18} /> Danh sách hành khách ({passengerCount})</h3>
                                </div>
                            </div>

                            {passengers.length > 0 ? (
                                <div className={styles.passengerList}>
                                    {passengers.map((passenger, index) => (
                                        <article key={passenger.bookingPassengerID || index} className={styles.passengerItem}>
                                            <div className={styles.passengerTop}>
                                                <span>{index + 1}</span>
                                                <div>
                                                    <h4>{passenger.fullName || 'Hành khách'}</h4>
                                                    <p>{getPassengerTypeLabel(passenger.passengerType)}</p>
                                                </div>
                                            </div>
                                            <div className={styles.passengerDetails}>
                                                <span>Giới tính <strong>{getGenderLabel(passenger.gender)}</strong></span>
                                                <span>Ngày sinh <strong>{formatDate(passenger.dateOfBirth) || 'N/A'}</strong></span>
                                                <span>Giá cơ bản <strong>{formatPrice(passenger.basePrice || 0)}</strong></span>
                                                {passenger.requiresSingleRoom && (
                                                    <span className={styles.singleRoom}>
                                                        Phụ phí phòng đơn <strong>{formatPrice(passenger.singleRoomSurcharge || 0)}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyBox}>Chưa có danh sách hành khách cho booking này.</div>
                            )}
                        </section>

                        <section id="booking-payment" className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <p>Giao dịch và chi phí</p>
                                    <h3><CreditCard size={18} /> Thông tin thanh toán</h3>
                                </div>
                            </div>

                            <div className={styles.transactionStrip}>
                                <div>
                                    <span>Mã thanh toán</span>
                                    <strong>{paymentId > 0 ? `PM-${paymentId}` : 'Chưa có'}</strong>
                                </div>
                                <div>
                                    <span>Phương thức</span>
                                    <strong>{paymentMethodLabel}</strong>
                                </div>
                                <div>
                                    <span>Trạng thái</span>
                                    <strong>{statusInfo.label}</strong>
                                </div>
                            </div>

                            <div className={styles.paymentSummary}>
                                <PaymentRow label="Tổng giá vé" value={formatPrice(booking.subtotalPrice || 0)} />
                                <PaymentRow label="Phụ phí phòng đơn/khác" value={`+ ${formatPrice(booking.surcharge || 0)}`} variant="surcharge" />
                                <PaymentRow label="Giảm giá coupon" value={`- ${formatPrice(booking.couponDiscount || 0)}`} variant="discount" />
                                <PaymentRow label="Điểm cá nhân đã dùng" value={`- ${formatPrice(booking.paidByCoin || 0)}`} variant="coinUsed" />
                                <PaymentRow label="Tổng tiền thanh toán" value={formatPrice(booking.totalPrice || 0)} variant="total" />
                            </div>
                        </section>

                        <section id="booking-refund" className={`${styles.section} ${styles.refundSection}`}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <p>Thông tin sau khi hủy</p>
                                    <h3>
                                        {showCoinRefund ? <Coins size={18} /> : <DollarSign size={18} />}
                                        Thông tin hoàn sau hủy
                                    </h3>
                                </div>
                                {renderRefundStatus()}
                            </div>

                            {booking.bookingStatus === 'CANCELLED' && (
                                <div className={styles.notificationHint}>
                                    <Bell size={15} />
                                    <span>Email xác nhận hủy sẽ được gửi đến hòm thư của bạn trong ít phút. Nếu chưa nhận được, hãy kiểm tra thư mục spam.</span>
                                </div>
                            )}

                            {showCoinRefund && (
                                <>
                                    <div className={styles.refundSummaryGrid}>
                                        <div className={styles.refundHighlight}>
                                            <span>Số điểm được cộng vào tài khoản</span>
                                            <strong>{coinRefundAmount.toLocaleString('vi-VN')} điểm</strong>
                                        </div>
                                        <PaymentRow label="Giá trị hoàn dùng để quy đổi" value={formatPrice(refundAmount)} />
                                        <PaymentRow label="Giá trị thanh toán và điểm dùng ban đầu" value={formatPrice(refundBaseAmount)} />
                                        {usedCoinValue > 0 && (
                                            <PaymentRow label="Giá trị điểm đã dùng được tính vào hoàn" value={formatPrice(usedCoinValue)} />
                                        )}
                                        <PaymentRow label="Phí/khấu trừ đã áp dụng" value={`- ${formatPrice(refundDeductionAmount)}`} variant="refundDeduction" />
                                    </div>
                                    <p className={styles.refundNote}>
                                        Khoản hoàn sau hủy được cộng vào tài khoản dưới dạng điểm. Giá trị hoàn được quy đổi theo tỉ lệ 1 điểm = 1.000đ.
                                    </p>
                                </>
                            )}

                            {refundAmount > 0 && !showCoinRefund && (
                                <>
                                    <div className={styles.refundSummaryGrid}>
                                        <div className={styles.refundHighlight}>
                                            <span>Phương thức hoàn</span>
                                            <strong>{showBankRefund ? 'Tài khoản ngân hàng' : 'Đang cập nhật'}</strong>
                                        </div>
                                        <PaymentRow label="Số tiền được hoàn" value={formatPrice(refundAmount)} />
                                        <PaymentRow label="Giá trị thanh toán và điểm dùng ban đầu" value={formatPrice(refundBaseAmount)} />
                                        {usedCoinValue > 0 && (
                                            <PaymentRow label="Giá trị điểm đã dùng được tính vào hoàn" value={formatPrice(usedCoinValue)} />
                                        )}
                                        <PaymentRow label="Phí/khấu trừ đã áp dụng" value={`- ${formatPrice(refundDeductionAmount)}`} variant="refundDeduction" />
                                    </div>

                                    {showBankRefund && (
                                        <div className={styles.bankInfoGrid}>
                                            <InfoTile icon={<Landmark size={17} />} label="Ngân hàng" value={booking.refundBank} />
                                            <InfoTile
                                                icon={<Hash size={17} />}
                                                label="Số tài khoản"
                                                value={booking.refundAccountNumber ? `****${booking.refundAccountNumber.slice(-4)}` : 'N/A'}
                                            />
                                            <InfoTile icon={<BadgeCheck size={17} />} label="Chủ tài khoản" value={booking.refundAccountName} wide />
                                        </div>
                                    )}

                                    <p className={styles.refundNote}>
                                        Số tiền được hoàn là số cuối cùng hệ thống ghi nhận trong đơn. Nếu đơn có sử dụng điểm cá nhân, giá trị điểm đã dùng được tính vào công thức hoàn.
                                    </p>
                                </>
                            )}

                            {refundAmount <= 0 && (
                                <div className={styles.emptyBox}>
                                    Chưa phát sinh thông tin hoàn sau hủy cho booking này.
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </section>
        </div>
    );

    return createPortal(modalJSX, document.body);
};

export default TransactionDetailModal;

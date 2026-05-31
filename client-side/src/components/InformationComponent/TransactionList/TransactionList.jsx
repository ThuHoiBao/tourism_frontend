import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ClipboardList, Inbox, Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useBookings from '../../../hook/useBookings.ts';
import useWebSocket from '../../../hook/useWebSocket.ts';
import TransactionListItem from './TransactionListItem/TransactionListItem';
import styles from './TransactionList.module.scss';

const statusTabs = [
    { key: null, label: 'Tất cả' },
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { key: 'PAID', label: 'Đã thanh toán' },
    { key: 'CANCELLED', label: 'Đã hủy' },
    { key: 'OVERDUE_PAYMENT', label: 'Quá hạn' },
    { key: 'REVIEWED', label: 'Đã đánh giá' },
    { key: 'PENDING_REFUND', label: 'Chờ hoàn tiền' },
];

const TransactionList = ({ user }) => {
    const location = useLocation();
    const searchInputRef = useRef(null);
    const [activeStatus, setActiveStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedCode, setHighlightedCode] = useState(null);

    // Auto-fill search khi navigate từ thông báo booking
    useEffect(() => {
        const code = location.state?.bookingCode;
        if (code) {
            setSearchTerm(code);
            setActiveStatus(null);
            setHighlightedCode(code);
            // Focus input để user thấy rõ
            setTimeout(() => searchInputRef.current?.focus(), 100);
            // Clear state khỏi history để không re-trigger khi back/forward
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const apiStatus = activeStatus === 'OVERDUE_PAYMENT' ? null : activeStatus;
    const { bookings, loading, error, refetch, silentRefetch, updateBookingInList } = useBookings(
        user?.id || user?.userID || -1,
        apiStatus
    );

    const displayBookings = useMemo(() => {
        return bookings.map((booking) => {
            const effectiveDeadline = booking?.paymentDeadline || booking?.timeLimit || null;
            const isPaymentExpired = booking?.bookingStatus === 'PENDING_PAYMENT'
                && effectiveDeadline
                && new Date(effectiveDeadline).getTime() <= Date.now();

            return {
                ...booking,
                rawBookingStatus: booking?.bookingStatus,
                bookingStatus: isPaymentExpired ? 'OVERDUE_PAYMENT' : booking?.bookingStatus,
                paymentDeadline: effectiveDeadline,
            };
        });
    }, [bookings]);

    const handleWebSocketMessage = useCallback((event) => {
        console.log('[User WS] Booking update received:', event);
        if (event?.bookingID) {
            const patch = {};
            if (event.bookingStatus != null) patch.bookingStatus = event.bookingStatus;
            if (event.cancelReason != null) patch.cancelReason = event.cancelReason;
            if (event.refundAmount != null) patch.refundAmount = event.refundAmount;
            if (event.coinRefundStatus != null) patch.coinRefundStatus = event.coinRefundStatus;
            if (Object.keys(patch).length > 0) updateBookingInList(event.bookingID, patch);
        }
        silentRefetch();
    }, [updateBookingInList, silentRefetch]);

    useWebSocket({
        topic: `/topic/user/${user?.id || user?.userID}/bookings`,
        onMessage: handleWebSocketMessage,
        enabled: !!(user?.id || user?.userID),
    });

    const getLabelFromKey = (key) => {
        return statusTabs.find(tab => tab.key === key)?.label || 'Tất cả';
    };

    const filteredBookings = displayBookings.filter(booking => {
        if (activeStatus && booking.bookingStatus !== activeStatus) return false;
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            booking.bookingCode?.toLowerCase().includes(search) ||
            booking.tourName?.toLowerCase().includes(search) ||
            booking.tourCode?.toLowerCase().includes(search)
        );
    });

    return (
        <div className={styles.transactionList}>
            <header className={styles.pageHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.headerIntro}>
                        <div className={styles.headerIcon}>
                            <ClipboardList size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className={styles.eyebrow}>Giao dịch</p>
                            <h2 className={styles.pageTitle}>Giao dịch của tôi</h2>
                            <p className={styles.pageSubtitle}>
                                Đang hiển thị <strong>{filteredBookings.length}</strong> / {displayBookings.length} đơn đặt chuyến đi.
                            </p>
                        </div>
                    </div>

                    <label className={`${styles.searchBox} ${highlightedCode ? styles.searchHighlighted : ''}`}>
                        <Search size={18} strokeWidth={2.2} className={styles.searchIcon} />
                        <input
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (highlightedCode) setHighlightedCode(null);
                            }}
                            placeholder="Tìm mã booking, tên chuyến đi..."
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <button
                                className={styles.searchClear}
                                onClick={() => { setSearchTerm(''); setHighlightedCode(null); }}
                                type="button"
                                title="Xóa tìm kiếm"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </label>
                </div>

                <div className={styles.statusTabs} aria-label="Lọc trạng thái giao dịch">
                    {statusTabs.map(tab => (
                        <button
                            key={tab.key || 'all'}
                            className={`${styles.tab} ${activeStatus === tab.key ? styles.active : ''}`}
                            onClick={() => setActiveStatus(tab.key)}
                            type="button"
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading && (
                <div className={styles.loading}>
                    Đang tải danh sách giao dịch...
                </div>
            )}

            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {!loading && !error && filteredBookings.length === 0 && (
                <div className={styles.emptyState}>
                    <Inbox size={42} strokeWidth={2.2} />
                    {searchTerm ? (
                        <p>Không tìm thấy giao dịch nào với từ khóa <strong>{searchTerm}</strong>.</p>
                    ) : (
                        <p>Không có giao dịch nào ở trạng thái <strong>{getLabelFromKey(activeStatus)}</strong>.</p>
                    )}
                </div>
            )}

            {!loading && !error && filteredBookings.length > 0 && (
                <div className={styles.bookingList}>
                    {filteredBookings.map(booking => (
                        <TransactionListItem
                            key={booking.bookingID}
                            booking={booking}
                            refetch={refetch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionList;

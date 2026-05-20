import React, { useState, useCallback } from 'react';
import { ClipboardList, Inbox, Search } from 'lucide-react';
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
    const [activeStatus, setActiveStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { bookings, loading, error, refetch, silentRefetch, updateBookingInList } = useBookings(
        user?.id || user?.userID || -1,
        activeStatus
    );

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

    const filteredBookings = bookings.filter(booking => {
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
                                Đang hiển thị <strong>{filteredBookings.length}</strong> / {bookings.length} đơn đặt chuyến đi.
                            </p>
                        </div>
                    </div>

                    <label className={styles.searchBox}>
                        <Search size={18} strokeWidth={2.2} className={styles.searchIcon} />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm mã booking, tên chuyến đi..."
                            className={styles.searchInput}
                        />
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

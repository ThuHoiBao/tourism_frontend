// src/components/InformationComponent/TransactionList/TransactionList.jsx
import React, { useState, useCallback } from 'react';
import useBookings from '../../../hook/useBookings.ts';
import useWebSocket from '../../../hook/useWebSocket.ts';
import TransactionListItem from './TransactionListItem/TransactionListItem';
import styles from './TransactionList.module.scss';
import { FiSearch } from 'react-icons/fi';

const statusTabs = [
    { key: null, label: 'Tất cả' },
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { key: 'PAID', label: 'Đã thanh toán' },
    { key: 'CANCELLED', label: 'Đã hủy' },
    { key: 'OVERDUE_PAYMENT', label: 'Quá hạn' },
    { key: 'REVIEWED', label: 'Đã đánh giá' },
    { key: 'PENDING_REFUND', label: 'Chờ hoàn tiền' }
];

const TransactionList = ({ user }) => {
    const [activeStatus, setActiveStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { bookings, loading, error, refetch } = useBookings(
        user?.id || user?.userID || -1, 
        activeStatus
    );
    
    // WebSocket listener
    const handleWebSocketMessage = useCallback((updatedBooking) => {
        console.log('🔔 User received booking update:', updatedBooking);
        refetch();
    }, [refetch]);

    useWebSocket({
        topic: `/topic/user/${user?.id || user?.userID}/bookings`,
        onMessage: handleWebSocketMessage,
        enabled: !!(user?.id || user?.userID)
    });

    const getLabelFromKey = (key) => {
        return statusTabs.find(tab => tab.key === key)?.label || 'Tất cả';
    };

    // Filter bookings theo search term
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
            {/* Header cố định */}
            <div className={styles.pageHeader}>
  

                {/* Status Tabs */}
                <div className={styles.statusTabs}>
                    {statusTabs.map(tab => (
                        <button
                            key={tab.key || 'all'}
                            className={`${styles.tab} ${activeStatus === tab.key ? styles.active : ''}`}
                            onClick={() => setActiveStatus(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
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
                    {searchTerm ? (
                        <p>Không tìm thấy giao dịch nào với từ khóa "<strong>{searchTerm}</strong>"</p>
                    ) : (
                        <p>Không có giao dịch nào ở trạng thái <strong>{getLabelFromKey(activeStatus)}</strong></p>
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
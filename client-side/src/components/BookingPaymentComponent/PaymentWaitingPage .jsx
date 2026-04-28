import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import axios from '../../utils/axiosCustomize';
import { useNavigate } from 'react-router-dom';
import styles from './PaymentWaiting.module.scss';

const PaymentWaitingPage = () => {
    const [searchParams] = useState(new URLSearchParams(window.location.search));
    const orderCode = searchParams.get('orderCode');
    const bookingCode = searchParams.get('bookingCode');
    const navigate = useNavigate();

    const [status, setStatus] = useState('PENDING');
    const [message, setMessage] = useState('Đang kiểm tra thanh toán...');
    const [checkCount, setCheckCount] = useState(0);

    useEffect(() => {
        if (!orderCode) {
            navigate('/');
            return;
        }

        let intervalId;
        let timeoutId;

        const checkPaymentStatus = async () => {
            try {
                console.log(`🔍 Checking payment status... (attempt ${checkCount + 1})`);

                const response = await axios.get(`/payment/check-status/${orderCode}`);
                const data = response.data || response;

                console.log('Payment status response:', data);

                if (data.status === 'SUCCESS' || data.code === '00') {
                    setStatus('SUCCESS');
                    setMessage('Thanh toán thành công!');
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);

                    setTimeout(() => {
                        navigate(`/payment-success?bookingCode=${bookingCode}`);
                    }, 2000);

                } else if (data.status === 'CANCELLED' || data.status === 'FAILED' || data.code === '99') {
                    setStatus('FAILED');
                    setMessage('Thanh toán thất bại hoặc đã bị hủy');
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);

                } else if (data.status === 'PENDING' || data.code === '01') {
                    setMessage('Vui lòng hoàn tất thanh toán trên ứng dụng ngân hàng...');
                    setCheckCount(prev => prev + 1);
                }

            } catch (error) {
                console.error('Error checking payment:', error);
                setMessage('Đang kiểm tra thanh toán... (đang thử lại)');
                setCheckCount(prev => prev + 1);
            }
        };

        checkPaymentStatus();

        intervalId = setInterval(checkPaymentStatus, 3000);

        timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            if (status === 'PENDING') {
                setStatus('FAILED');
                setMessage('Hết thời gian chờ thanh toán. Vui lòng kiểm tra lại.');
            }
        }, 300000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [orderCode, bookingCode, navigate]);

    const handleRetry = () => {
        navigate(`/booking-payment?bookingCode=${bookingCode}`);
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>

                {/* Icon Status */}
                <div className={styles.iconWrapper}>
                    {status === 'PENDING' && (
                        <Loader className={styles.loader} />
                    )}
                    {status === 'SUCCESS' && (
                        <CheckCircle className={styles.success} />
                    )}
                    {status === 'FAILED' && (
                        <XCircle className={styles.failed} />
                    )}
                </div>

                {/* Title */}
                <h1 className={styles.title}>
                    {status === 'PENDING' && 'Đang xử lý thanh toán'}
                    {status === 'SUCCESS' && 'Thanh toán thành công!'}
                    {status === 'FAILED' && 'Thanh toán thất bại'}
                </h1>

                {/* Message */}
                <p className={styles.message}>{message}</p>

                {/* Info Box - Pending */}
                {status === 'PENDING' && (
                    <div className={styles.pendingBox}>
                        <div className={styles.infoRow}>
                            <Clock />
                            <span>Mã đơn hàng: {orderCode}</span>
                        </div>
                        <p className={styles.subText}>
                            Đã kiểm tra {checkCount} lần
                        </p>
                        <p className={styles.hintText}>
                            💡 Vui lòng mở app ngân hàng và hoàn tất thanh toán
                        </p>
                    </div>
                )}

                {/* Info Box - Success */}
                {status === 'SUCCESS' && (
                    <div className={styles.successBox}>
                        <p className={styles.successText}>
                            Mã booking: <span>{bookingCode}</span>
                        </p>
                        <p className={styles.redirectText}>
                            Đang chuyển hướng...
                        </p>
                    </div>
                )}

                {/* Actions - Failed */}
                {status === 'FAILED' && (
                    <div className={styles.actions}>
                        <button
                            onClick={handleRetry}
                            className={styles.retryBtn}
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={handleGoHome}
                            className={styles.homeBtn}
                        >
                            Về trang chủ
                        </button>
                    </div>
                )}

                {/* Refresh Button - Only Pending */}
                {status === 'PENDING' && (
                    <button
                        onClick={handleRefresh}
                        className={styles.refreshBtn}
                    >
                        Làm mới trang
                    </button>
                )}
            </div>
        </div>
    );
};

export default PaymentWaitingPage;
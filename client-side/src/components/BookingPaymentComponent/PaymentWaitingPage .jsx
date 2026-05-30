import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Clock, XCircle, Loader2, Smartphone,
    ScanLine, BadgeCheck, RotateCw, Home, ArrowLeft,
    Copy, ShieldCheck, Wifi
} from 'lucide-react';
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
    const [elapsed, setElapsed] = useState(0);          // giây đã chờ
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // If BOTH orderCode and bookingCode missing → navigate home
        if (!orderCode && !bookingCode) { navigate('/'); return; }

        // If orderCode missing but bookingCode present → show "no transaction" message
        if (!orderCode) {
            setStatus('NO_ORDER_CODE');
            setMessage('Không tìm thấy mã giao dịch. Vui lòng kiểm tra email hoặc tra cứu đơn bằng mã đặt tour.');
            return;
        }

        let intervalId, timeoutId, tickerId;

        const checkPaymentStatus = async () => {
            try {
                const response = await axios.get(`/payment/check-status/${orderCode}`);
                const data = response.data || response;

                if (data.status === 'SUCCESS' || data.code === '00') {
                    setStatus('SUCCESS');
                    setMessage('Thanh toán thành công!');
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    clearInterval(tickerId);
                    setTimeout(() => {
                        navigate(`/payment-success?bookingCode=${bookingCode}`);
                    }, 1800);
                } else if (data.status === 'CANCELLED' || data.status === 'FAILED' || data.code === '99') {
                    setStatus('FAILED');
                    setMessage('Thanh toán thất bại hoặc đã bị hủy');
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    clearInterval(tickerId);
                } else if (data.status === 'PENDING' || data.code === '01') {
                    setMessage('Vui lòng hoàn tất thanh toán trên ứng dụng ngân hàng');
                    setCheckCount(prev => prev + 1);
                }
            } catch {
                setMessage('Đang thử lại kết nối...');
                setCheckCount(prev => prev + 1);
            }
        };

        checkPaymentStatus();
        intervalId = setInterval(checkPaymentStatus, 3000);
        tickerId   = setInterval(() => setElapsed(e => e + 1), 1000);
        timeoutId  = setTimeout(() => {
            clearInterval(intervalId);
            clearInterval(tickerId);
            if (status === 'PENDING') {
                setStatus('FAILED');
                setMessage('Hết thời gian chờ thanh toán. Vui lòng thử lại.');
            }
        }, 300000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            clearInterval(tickerId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, bookingCode, navigate]);

    const handleRetry  = () => navigate(`/booking-payment?bookingCode=${bookingCode}`);
    const handleGoHome = () => navigate('/');
    const handleRefresh = () => window.location.reload();
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(orderCode || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    };

    const fmtTime = (sec) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    // 3 bước trạng thái thanh toán (timeline)
    const steps = [
        { key: 'SCAN',    label: 'Quét mã QR',          icon: ScanLine },
        { key: 'CONFIRM', label: 'Xác nhận trên ngân hàng', icon: Smartphone },
        { key: 'DONE',    label: 'Hoàn tất',            icon: BadgeCheck },
    ];
    // bước hiện tại
    let activeStep = 1;                  // đang ở "Xác nhận trên ngân hàng"
    if (status === 'SUCCESS') activeStep = 2;
    if (status === 'FAILED')  activeStep = -1;

    return (
        <div className={styles.container}>
            <div className={styles.shell}>

                {/* HEADER: status banner */}
                <header className={`${styles.banner} ${styles[`banner_${status}`]}`}>
                    <button className={styles.back} onClick={handleGoHome} aria-label="Về trang chủ">
                        <ArrowLeft size={18} />
                    </button>

                    <div className={styles.bannerIcon}>
                        {status === 'PENDING'      && <Loader2 className={styles.spin} size={28} />}
                        {status === 'SUCCESS'      && <CheckCircle2 size={28} />}
                        {status === 'FAILED'       && <XCircle size={28} />}
                        {status === 'NO_ORDER_CODE' && <Clock size={28} />}
                    </div>

                    <div className={styles.bannerText}>
                        <h1>
                            {status === 'PENDING'       && 'Đang chờ thanh toán'}
                            {status === 'SUCCESS'       && 'Thanh toán thành công'}
                            {status === 'FAILED'        && 'Thanh toán thất bại'}
                            {status === 'NO_ORDER_CODE' && 'Chờ xác nhận thanh toán'}
                        </h1>
                        <p>{message}</p>
                    </div>

                    {status === 'PENDING' && (
                        <div className={styles.timer}>
                            <Clock size={14} />
                            <span>{fmtTime(elapsed)}</span>
                        </div>
                    )}
                </header>

                {/* NO_ORDER_CODE: show retry + lookup buttons */}
                {status === 'NO_ORDER_CODE' && (
                    <main className={styles.content}>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>Mã đặt tour</span>
                                <span className={styles.infoValueMono}>{bookingCode || '—'}</span>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.retryBtn} onClick={handleRefresh}>
                                <RotateCw size={16} /> Thử lại
                            </button>
                            {bookingCode && (
                                <button className={styles.homeBtn}
                                    onClick={() => navigate(`/booking-detail?bookingCode=${bookingCode}`)}>
                                    📋 Xem chi tiết đơn
                                </button>
                            )}
                            <button className={styles.homeBtn} onClick={handleGoHome}>
                                <Home size={16} /> Về trang chủ
                            </button>
                        </div>
                    </main>
                )}

                {/* CONTENT — only shown when we have orderCode */}
                {status !== 'NO_ORDER_CODE' && <main className={styles.content}>

                    {/* Timeline 3 bước */}
                    <ol className={styles.steps}>
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const done   = idx <  activeStep;
                            const active = idx === activeStep;
                            return (
                                <li
                                    key={s.key}
                                    className={`${styles.step}
                                        ${done   ? styles.stepDone   : ''}
                                        ${active ? styles.stepActive : ''}`}
                                >
                                    <span className={styles.stepIcon}>
                                        {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                    </span>
                                    <span className={styles.stepLabel}>{s.label}</span>
                                </li>
                            );
                        })}
                    </ol>

                    {/* INFO GRID 2 cột */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Mã đơn hàng</span>
                            <div className={styles.infoValueRow}>
                                <span className={styles.infoValueMono}>{orderCode || '—'}</span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className={styles.copyBtn}
                                    title="Sao chép"
                                >
                                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                    <span>{copied ? 'Đã copy' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Mã booking</span>
                            <div className={styles.infoValueRow}>
                                <span className={styles.infoValueMono}>{bookingCode || '—'}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Đã kiểm tra</span>
                            <div className={styles.infoValueRow}>
                                <span className={styles.infoValue}>
                                    <Wifi size={13} /> {checkCount} lần
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Bảo mật</span>
                            <div className={styles.infoValueRow}>
                                <span className={styles.infoValue}>
                                    <ShieldCheck size={13} /> Mã hóa SSL
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* HINT khi đang chờ */}
                    {status === 'PENDING' && (
                        <div className={styles.hintBox}>
                            <div className={styles.hintHeader}>
                                <Smartphone size={16} />
                                <span>Vui lòng mở app ngân hàng để hoàn tất thanh toán</span>
                            </div>
                            <ul className={styles.hintList}>
                                <li>Mở app ngân hàng / ví điện tử trên điện thoại</li>
                                <li>Xác nhận giao dịch theo hướng dẫn trên app</li>
                                <li>Trang này sẽ tự cập nhật khi giao dịch hoàn tất</li>
                            </ul>
                        </div>
                    )}

                    {/* SUCCESS BOX */}
                    {status === 'SUCCESS' && (
                        <div className={styles.successBox}>
                            <BadgeCheck size={18} />
                            <span>Đang chuyển sang trang xác nhận đặt chỗ...</span>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className={styles.actions}>
                        {status === 'PENDING' && (
                            <button onClick={handleRefresh} className={styles.btnGhost}>
                                <RotateCw size={15} /> Làm mới trang
                            </button>
                        )}
                        {status === 'FAILED' && (
                            <>
                                <button onClick={handleRetry} className={styles.btnPrimary}>
                                    <RotateCw size={15} /> Thử thanh toán lại
                                </button>
                                <button onClick={handleGoHome} className={styles.btnGhost}>
                                    <Home size={15} /> Về trang chủ
                                </button>
                            </>
                        )}
                    </div>
                </main>}
            </div>
        </div>
    );
};

export default PaymentWaitingPage;

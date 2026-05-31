import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Landmark, RefreshCw, WalletCards, CircleAlert,
    CheckCircle2, XCircle, RotateCcw, Eye, DollarSign, Loader2
} from 'lucide-react';
import { FaSearch, FaRedoAlt, FaQrcode } from 'react-icons/fa';
import styles from './CoinWithdrawalsPage.module.scss';
import {
    getCoinWithdrawalDetailApi,
    retryCoinWithdrawalApi,
    searchCoinWithdrawalsAdminApi,
    confirmManualPayoutApi,
} from '../../../../services/coinWithdrawal/coinWithdrawal.ts';

const STATUS_OPTIONS = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL'];
const ERROR_OPTIONS  = ['', 'IAM', 'RABBITMQ', 'NOTIFICATION', 'SEPAY', 'SYSTEM'];

const STATUS_META = {
    PENDING:    { label: 'Đang chờ',    cls: 'statusPending'    },
    PROCESSING: { label: 'Đang xử lý', cls: 'statusProcessing' },
    COMPLETED:  { label: 'Thành công', cls: 'statusCompleted'  },
    FAILED:     { label: 'Thất bại',   cls: 'statusFailed'     },
    MANUAL:     { label: 'Thủ công',   cls: 'statusManual'     },
};

const VietQRCode = ({ bank, accountNumber, accountName, amount, referenceCode }) => {
    const addInfo = `RUTDIEM ${referenceCode}`;
    const url = `https://img.vietqr.io/image/${bank}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
    return (
        <div className={styles.qrSection}>
            <div className={styles.qrHeader}><FaQrcode className={styles.qrIcon} /><span>Quét để chuyển khoản</span></div>
            <img src={url} alt="VietQR" className={styles.qrImage} onError={(e) => { e.target.style.display='none'; }} />
            <div className={styles.qrDetails}>
                <div><span>Ngân hàng</span><strong>{bank}</strong></div>
                <div><span>Số tài khoản</span><strong>{accountNumber}</strong></div>
                <div><span>Chủ tài khoản</span><strong>{accountName}</strong></div>
                <div><span>Số tiền</span><strong className={styles.amountHighlight}>{Number(amount).toLocaleString('vi-VN')} VND</strong></div>
                <div><span>Nội dung CK</span><strong>{addInfo}</strong></div>
            </div>
        </div>
    );
};

const ConfirmManualModal = ({ item, onClose, onSuccess }) => {
    const [transferRef, setTransferRef] = useState('');
    const [note, setNote]               = useState('');
    const [loading, setLoading]         = useState(false);

    if (!item) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await confirmManualPayoutApi(item.id, { transferRef: transferRef || undefined, note: note || undefined });
            toast.success(`Đã xác nhận chuyển khoản thủ công cho ${item.referenceCode}`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Xác nhận thất bại, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.confirmModalHeader}>
                    <div>
                        <p className={styles.eyebrow}>Xác nhận chuyển khoản thủ công</p>
                        <h3>{item.referenceCode}</h3>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div className={styles.confirmModalBody}>
                    <VietQRCode
                        bank={item.bank}
                        accountNumber={item.accountNumberMasked?.replace(/\*/g, '') || item.accountNumberMasked}
                        accountName={item.accountName}
                        amount={item.moneyAmount}
                        referenceCode={item.referenceCode}
                    />
                    <div className={styles.confirmForm}>
                        <div className={styles.formGroup}>
                            <label>Mã giao dịch ngân hàng <span>(tuỳ chọn)</span></label>
                            <input
                                type="text"
                                placeholder="VD: FT24XXXXXXXX (từ app ngân hàng)"
                                value={transferRef}
                                onChange={(e) => setTransferRef(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ghi chú <span>(tuỳ chọn)</span></label>
                            <input
                                type="text"
                                placeholder="VD: Đã chuyển đủ 50,000 VND lúc 14:30"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                        <div className={styles.confirmInfo}>
                            <CircleAlert size={15} />
                            <span>Sau khi xác nhận, hệ thống sẽ đánh dấu giao dịch <strong>COMPLETED</strong> và gửi thông báo cho khách hàng.</span>
                        </div>
                    </div>
                </div>
                <div className={styles.confirmModalFooter}>
                    <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={loading}>Hủy</button>
                    <button type="button" className={styles.successBtn} onClick={handleConfirm} disabled={loading}>
                        {loading ? <><Loader2 size={15} className={styles.spin} /> Đang xử lý...</> : <><CheckCircle2 size={15} /> Xác nhận đã chuyển</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailModal = ({ item, onClose, onRetry, onConfirmManual }) => {
    if (!item) return null;
    const meta = STATUS_META[item.status] || STATUS_META.PENDING;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <p className={styles.eyebrow}>Chi tiết giao dịch</p>
                        <h3>{item.referenceCode}</h3>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div className={styles.detailGrid}>
                    <div><span>User ID</span><strong>{item.userId}</strong></div>
                    <div><span>Trạng thái</span><strong><span className={`${styles.statusBadge} ${styles[meta.cls]}`}>{meta.label}</span></strong></div>
                    <div><span>Điểm rút</span><strong>{Number(item.coinAmount).toLocaleString('vi-VN')} pts</strong></div>
                    <div><span>Số tiền</span><strong>{Number(item.moneyAmount).toLocaleString('vi-VN')} VND</strong></div>
                    <div><span>Ngân hàng</span><strong>{item.bank}</strong></div>
                    <div><span>Số tài khoản</span><strong>{item.accountNumberMasked}</strong></div>
                    <div><span>Chủ tài khoản</span><strong>{item.accountName}</strong></div>
                    <div><span>Mã chuyển khoản</span><strong>{item.transferRef || '—'}</strong></div>
                    <div><span>Số lần retry</span><strong>{item.retryCount}</strong></div>
                    <div><span>Nguồn lỗi</span><strong>{item.errorSource || '—'}</strong></div>
                    <div><span>Thời gian tạo</span><strong>{new Date(item.createdAt).toLocaleString('vi-VN')}</strong></div>
                    <div><span>Cập nhật lúc</span><strong>{new Date(item.updatedAt).toLocaleString('vi-VN')}</strong></div>
                </div>
                {item.note && (
                    <div className={styles.noteBox}><CircleAlert size={14} /><span>{item.note}</span></div>
                )}
                <div className={styles.modalActions}>
                    {item.status === 'MANUAL' && (
                        <button type="button" className={styles.successBtn} onClick={() => onConfirmManual(item)}>
                            <DollarSign size={15} /> Xác nhận chuyển khoản
                        </button>
                    )}
                    {(item.status === 'FAILED' || item.status === 'MANUAL') && (
                        <button type="button" className={styles.warnBtn} onClick={() => onRetry(item.id)}>
                            <RotateCcw size={15} /> Retry giao dịch
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CoinWithdrawalsPage = () => {
    const [filters,         setFilters]         = useState({ status: '', userId: '', errorSource: '' });
    const [appliedFilters,  setAppliedFilters]  = useState({ status: '', userId: '', errorSource: '' });
    const [page,            setPage]            = useState(0);
    const [loading,         setLoading]         = useState(true);
    const [detailLoading,   setDetailLoading]   = useState(false);
    const [rows,            setRows]            = useState([]);
    const [totalPages,      setTotalPages]      = useState(0);
    const [totalElements,   setTotalElements]   = useState(0);
    const [selectedItem,    setSelectedItem]    = useState(null);
    const [confirmItem,     setConfirmItem]     = useState(null);

    const loadData = useCallback(async (nextFilters = appliedFilters, nextPage = page) => {
        setLoading(true);
        try {
            const res = await searchCoinWithdrawalsAdminApi(nextFilters, nextPage, 10);
            setRows(res.content || []);
            setTotalPages(res.totalPages || 0);
            setTotalElements(res.totalElements || 0);
        } catch {
            toast.error('Không tải được danh sách rút điểm');
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, page]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSearch = () => { setPage(0); setAppliedFilters(filters); };
    const handleReset  = () => {
        const blank = { status: '', userId: '', errorSource: '' };
        setFilters(blank); setAppliedFilters(blank); setPage(0);
    };

    const handleViewDetail = async (id) => {
        setDetailLoading(true);
        try {
            const detail = await getCoinWithdrawalDetailApi(id);
            setSelectedItem(detail);
        } catch {
            toast.error('Không tải được chi tiết giao dịch');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRetry = async (id) => {
        try {
            await retryCoinWithdrawalApi(id);
            toast.success('Đã đưa giao dịch vào hàng chờ retry');
            setSelectedItem(null);
            loadData(appliedFilters, page);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Retry giao dịch thất bại');
        }
    };

    const handleOpenConfirmModal = (item) => { setSelectedItem(null); setConfirmItem(item); };
    const handleConfirmSuccess   = () => loadData(appliedFilters, page);

    const failedCount     = rows.filter((r) => r.status === 'FAILED').length;
    const manualCount     = rows.filter((r) => r.status === 'MANUAL').length;
    const processingCount = rows.filter((r) => ['PENDING','PROCESSING'].includes(r.status)).length;

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <h1><Landmark size={22} /> Quản lý rút điểm thưởng</h1>
                    <p>Theo dõi và xử lý các lệnh rút điểm. Với giao dịch <strong>Thủ công</strong>, admin quét QR chuyển khoản rồi bấm xác nhận.</p>
                </div>
                <button type="button" className={styles.refreshBtn} onClick={() => loadData(appliedFilters, page)}>
                    <RefreshCw size={15} /> Làm mới
                </button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><WalletCards size={18} /></div>
                    <div><span>Tổng giao dịch</span><strong>{totalElements}</strong></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{background:'#dbeafe',color:'#1d4ed8'}}><Loader2 size={18} /></div>
                    <div><span>Đang xử lý</span><strong>{processingCount}</strong></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{background:'#fef3c7',color:'#d97706'}}><CircleAlert size={18} /></div>
                    <div><span>Chờ hoàn thủ công</span><strong>{manualCount}</strong></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{background:'#fee2e2',color:'#dc2626'}}><XCircle size={18} /></div>
                    <div><span>Thất bại</span><strong>{failedCount}</strong></div>
                </div>
            </div>

            <div className={styles.filterBar}>
                <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((o) => <option key={o || 'ALL'} value={o}>{o || 'Tất cả trạng thái'}</option>)}
                </select>
                <input
                    type="text"
                    placeholder="User ID"
                    value={filters.userId}
                    onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))}
                />
                <select value={filters.errorSource} onChange={(e) => setFilters((p) => ({ ...p, errorSource: e.target.value }))}>
                    {ERROR_OPTIONS.map((o) => <option key={o || 'ALL'} value={o}>{o || 'Tất cả nguồn lỗi'}</option>)}
                </select>
                <button type="button" className={styles.primaryBtn} onClick={handleSearch}><FaSearch /> Tìm kiếm</button>
                <button type="button" className={styles.secondaryBtn} onClick={handleReset}><FaRedoAlt /> Đặt lại</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã lệnh</th>
                            <th>User</th>
                            <th>Điểm</th>
                            <th>Số tiền</th>
                            <th>Ngân hàng / Tài khoản</th>
                            <th>Trạng thái</th>
                            <th>Nguồn lỗi</th>
                            <th>Retry</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className={styles.centered}><Loader2 size={18} className={styles.spin} /> Đang tải...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={9} className={styles.centered}>Không có giao dịch phù hợp bộ lọc.</td></tr>
                        ) : rows.map((item) => {
                            const meta = STATUS_META[item.status] || STATUS_META.PENDING;
                            return (
                                <tr key={item.id}>
                                    <td className={styles.refCode}>{item.referenceCode}</td>
                                    <td>{item.userId}</td>
                                    <td>{Number(item.coinAmount).toLocaleString('vi-VN')} pts</td>
                                    <td className={styles.amountCell}>{Number(item.moneyAmount).toLocaleString('vi-VN')} VND</td>
                                    <td>
                                        <span className={styles.bankName}>{item.bank}</span>
                                        <br /><span className={styles.subText}>{item.accountNumberMasked}</span>
                                    </td>
                                    <td><span className={`${styles.statusBadge} ${styles[meta.cls]}`}>{meta.label}</span></td>
                                    <td>{item.errorSource ? <span className={styles.errorSource}>{item.errorSource}</span> : <span className={styles.textMuted}>—</span>}</td>
                                    <td className={styles.centered}>{item.retryCount}</td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            <button
                                                type="button"
                                                className={`${styles.iconBtn} ${styles.iconBtnInfo}`}
                                                title="Xem chi tiết"
                                                onClick={() => handleViewDetail(item.id)}
                                                disabled={detailLoading}
                                            ><Eye size={14} /></button>
                                            {item.status === 'MANUAL' && (
                                                <button
                                                    type="button"
                                                    className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                                                    title="Xác nhận chuyển khoản thủ công"
                                                    onClick={() => handleOpenConfirmModal(item)}
                                                ><DollarSign size={14} /></button>
                                            )}
                                            {(item.status === 'FAILED' || item.status === 'MANUAL') && (
                                                <button
                                                    type="button"
                                                    className={`${styles.iconBtn} ${styles.iconBtnWarn}`}
                                                    title="Retry giao dịch"
                                                    onClick={() => handleRetry(item.id)}
                                                ><RotateCcw size={14} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>‹</button>
                    <span>Trang {page + 1} / {totalPages}</span>
                    <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))} disabled={page + 1 >= totalPages}>›</button>
                </div>
            )}

            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onRetry={handleRetry}
                onConfirmManual={handleOpenConfirmModal}
            />
            <ConfirmManualModal
                item={confirmItem}
                onClose={() => setConfirmItem(null)}
                onSuccess={handleConfirmSuccess}
            />
        </div>
    );
};

export default CoinWithdrawalsPage;

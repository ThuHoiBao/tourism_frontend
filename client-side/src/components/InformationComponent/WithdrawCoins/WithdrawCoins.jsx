import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, WalletCards, ArrowRightLeft, ShieldCheck, RefreshCw, Clock3, CircleAlert, BadgeCheck, ChevronsUpDown, X } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './WithdrawCoins.module.scss';
import {
    createCoinWithdrawalApi,
    getMyCoinWithdrawalsApi,
} from '../../../services/coinWithdrawal/coinWithdrawal.ts';
import { BANK_LIST } from '../TransactionList/TransactionListItem/RefundInfoModal/RefundInfoModal.jsx';

const MIN_WITHDRAWAL = 5;
const EXCHANGE_RATE = 1000;

const statusMeta = {
    PENDING: { label: 'Đang chờ', className: styles.statusPending },
    PROCESSING: { label: 'Đang xử lý', className: styles.statusProcessing },
    COMPLETED: { label: 'Thành công', className: styles.statusCompleted },
    FAILED: { label: 'Thất bại', className: styles.statusFailed },
    MANUAL: { label: 'Thủ công', className: styles.statusManual },
};

const initialForm = {
    coinAmount: '',
    bank: '',
    accountNumber: '',
    accountName: '',
};

const resolveBank = (code) => BANK_LIST.find((item) => item.code === code || item.shortName === code) || null;

const WithdrawCoins = ({ user }) => {
    const userData = user?.data || user || {};
    const userId = userData?.id || userData?.userId || userData?.userID;
    const balance = Number(userData?.coinBalance || 0);

    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
    const [form, setForm] = useState(initialForm);

    const numericCoinAmount = Number(form.coinAmount || 0);
    const moneyAmount = Number.isFinite(numericCoinAmount) ? numericCoinAmount * EXCHANGE_RATE : 0;

    const hasPendingWithdrawal = useMemo(
        () => withdrawals.some((item) => ['PENDING', 'PROCESSING'].includes(item.status)),
        [withdrawals],
    );

    const loadWithdrawals = useCallback(async (showError = false) => {
        if (!userId) return;
        try {
            const data = await getMyCoinWithdrawalsApi(userId);
            setWithdrawals(Array.isArray(data) ? data : []);
        } catch (error) {
            if (showError) {
                toast.error(error?.response?.data?.message || 'Không tải được lịch sử rút điểm');
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadWithdrawals();
    }, [loadWithdrawals]);

    useEffect(() => {
        if (!hasPendingWithdrawal) return undefined;
        const timer = window.setInterval(() => loadWithdrawals(), 15000);
        return () => window.clearInterval(timer);
    }, [hasPendingWithdrawal, loadWithdrawals]);

    const validate = () => {
        if (!numericCoinAmount || !Number.isInteger(numericCoinAmount)) {
            toast.error('Số điểm rút phải là số nguyên');
            return false;
        }
        if (numericCoinAmount < MIN_WITHDRAWAL) {
            toast.error('Số điểm rút tối thiểu là 5');
            return false;
        }
        if (numericCoinAmount > balance) {
            toast.error('Số điểm rút vượt quá số dư hiện có');
            return false;
        }
        if (!form.bank || !form.accountNumber.trim() || !form.accountName.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng');
            return false;
        }
        return true;
    };

    const selectedBank = resolveBank(form.bank);

    const resetForm = () => {
        setForm(initialForm);
        setSubmitting(false);
        setIsBankPickerOpen(false);
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);
        try {
            await createCoinWithdrawalApi({
                userId,
                coinAmount: numericCoinAmount,
                bank: form.bank,
                accountNumber: form.accountNumber.trim(),
                accountName: form.accountName.trim(),
            });
            toast.success('Đã tạo yêu cầu rút điểm. Hệ thống đang xử lý tự động.');
            resetForm();
            setLoading(true);
            await loadWithdrawals();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Tạo yêu cầu rút điểm thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.withdrawPage}>
            <header className={styles.pageHeader}>
                <div className={styles.headerIntro}>
                    <div className={styles.headerIcon}><Landmark size={22} strokeWidth={2.2} /></div>
                    <div>
                        <p className={styles.eyebrow}>Rút điểm tự động</p>
                        <h2>Rút điểm về tài khoản ngân hàng</h2>
                        <p>Hệ thống tự động tạo lệnh chuyển khoản, không cần chờ admin duyệt từng yêu cầu.</p>
                    </div>
                </div>
                <button className={styles.refreshBtn} type="button" onClick={() => { setLoading(true); loadWithdrawals(true); }}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </header>

            <div className={styles.overviewGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}><WalletCards size={20} /></div>
                    <div>
                        <span>Số dư hiện có</span>
                        <strong>{balance.toLocaleString('vi-VN')} điểm</strong>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}><ArrowRightLeft size={20} /></div>
                    <div>
                        <span>Tỷ lệ quy đổi</span>
                        <strong>1 điểm = 1.000 VND</strong>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}><ShieldCheck size={20} /></div>
                    <div>
                        <span>Quy tắc rút</span>
                        <strong>Tối thiểu 5 điểm</strong>
                    </div>
                </div>
            </div>

            <section className={styles.actionPanel}>
                <div>
                    <h3>Bắt đầu rút điểm</h3>
                    <p>Nhập số điểm muốn đổi và thông tin tài khoản nhận tiền. Lệnh sẽ được xử lý ngay sau khi tạo.</p>
                </div>
                <div className={styles.formGrid}>
                    <label className={styles.fieldGroup}>
                        <span>Tên chủ tài khoản *</span>
                        <input
                            type="text"
                            value={form.accountName}
                            onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                            placeholder="Nhập tên chủ tài khoản"
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span>Số tài khoản *</span>
                        <input
                            type="text"
                            value={form.accountNumber}
                            onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                            placeholder="Nhập số tài khoản"
                        />
                    </label>
                    <div className={styles.fieldGroup}>
                        <span>Ngân hàng hưởng thụ *</span>
                        <button
                            type="button"
                            className={styles.bankPickerBtn}
                            onClick={() => setIsBankPickerOpen(true)}
                        >
                            {selectedBank ? (
                                <>
                                    <img src={selectedBank.logo} alt={selectedBank.name} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                                    <div>
                                        <strong>{selectedBank.name}</strong>
                                        <small>BIN: {selectedBank.bin}</small>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <strong>Chọn ngân hàng</strong>
                                    <small>Chưa chọn ngân hàng nhận tiền</small>
                                </div>
                            )}
                            <ChevronsUpDown size={18} />
                        </button>
                    </div>
                    <label className={styles.fieldGroup}>
                        <span>Số điểm muốn rút *</span>
                        <input
                            type="number"
                            min={MIN_WITHDRAWAL}
                            step="1"
                            value={form.coinAmount}
                            onChange={(event) => setForm((prev) => ({ ...prev, coinAmount: event.target.value }))}
                            placeholder="Nhập số điểm"
                        />
                    </label>
                </div>

                <div className={styles.previewBox}>
                    <div>
                        <span>Số dư hiện có</span>
                        <strong>{balance.toLocaleString('vi-VN')} điểm</strong>
                    </div>
                    <div>
                        <span>Số tiền quy đổi</span>
                        <strong>{moneyAmount.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <button className={styles.primaryBtn} type="button" onClick={handleSubmit} disabled={submitting}>
                        <Landmark size={16} /> {submitting ? 'Đang gửi...' : 'Tạo yêu cầu rút điểm'}
                    </button>
                </div>
            </section>

            <section className={styles.historySection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.eyebrow}>Lịch sử</p>
                        <h3>Lệnh rút điểm của bạn</h3>
                    </div>
                    {hasPendingWithdrawal && <span className={styles.liveBadge}><Clock3 size={14} /> Tự động cập nhật khi đang xử lý</span>}
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Đang tải lịch sử rút điểm...</div>
                ) : withdrawals.length === 0 ? (
                    <div className={styles.emptyState}>
                        <CircleAlert size={18} /> Chưa có yêu cầu rút điểm nào.
                    </div>
                ) : (
                    <div className={styles.historyList}>
                        {withdrawals.map((item) => {
                            const meta = statusMeta[item.status] || statusMeta.PENDING;
                            return (
                                <article key={item.id} className={styles.historyCard}>
                                    <div className={styles.historyTop}>
                                        <div>
                                            <strong>{item.referenceCode}</strong>
                                            <p>{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                        <span className={`${styles.statusBadge} ${meta.className}`}>{meta.label}</span>
                                    </div>
                                    <div className={styles.historyGrid}>
                                        <div><span>Điểm</span><strong>{Number(item.coinAmount).toLocaleString('vi-VN')}</strong></div>
                                        <div><span>Số tiền</span><strong>{Number(item.moneyAmount).toLocaleString('vi-VN')} VND</strong></div>
                                        <div><span>Ngân hàng</span><strong>{item.bank}</strong></div>
                                        <div><span>Tài khoản</span><strong>{item.accountNumberMasked}</strong></div>
                                    </div>
                                    {(item.note || item.transferRef) && (
                                        <div className={styles.noteRow}>
                                            {item.transferRef && <p><BadgeCheck size={14} /> Mã đối soát: {item.transferRef}</p>}
                                            {item.note && <p><CircleAlert size={14} /> {item.note}</p>}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {isBankPickerOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsBankPickerOpen(false)}>
                    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chọn Ngân hàng hưởng thụ</h3>
                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={() => setIsBankPickerOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className={styles.bankGrid}>
                            {BANK_LIST.map((bank) => (
                                <button
                                    type="button"
                                    key={bank.code}
                                    className={`${styles.bankItem} ${form.bank === bank.code ? styles.bankItemActive : ''}`}
                                    onClick={() => {
                                        setForm((prev) => ({ ...prev, bank: bank.code }));
                                        setIsBankPickerOpen(false);
                                    }}
                                >
                                    <img src={bank.logo} alt={bank.name} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                                    <div>
                                        <strong>{bank.name}</strong>
                                        <small>BIN: {bank.bin}</small>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawCoins;
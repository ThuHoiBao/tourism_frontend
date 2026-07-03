import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Landmark, WalletCards, ArrowRightLeft, ShieldCheck, RefreshCw, Clock3, CircleAlert, BadgeCheck, ChevronsUpDown, X, List, Building2, User, CreditCard, Coins, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './WithdrawCoins.module.scss';
import {
    createCoinWithdrawalApi,
    getMyCoinWithdrawalsApi,
} from '../../../services/coinWithdrawal/coinWithdrawal.ts';
import { BANK_LIST } from '../TransactionList/TransactionListItem/RefundInfoModal/RefundInfoModal.jsx';
import GreenFundDonateModal from '../../GreenFundComponent/GreenFundDonateModal';
import useWebSocket from '../../../hook/useWebSocket';

const MIN_WITHDRAWAL = 5;
const EXCHANGE_RATE = 1000;

const statusMeta = {
    PENDING: { label: 'Đang chờ', className: styles.statusPending },
    PROCESSING: { label: 'Đang xử lý', className: styles.statusProcessing },
    COMPLETED: { label: 'Thành công', className: styles.statusCompleted },
    FAILED: { label: 'Thất bại', className: styles.statusFailed },
    MANUAL: { label: 'Chờ hoàn tiền', className: styles.statusManual },
};

const initialForm = {
    coinAmount: '',
    bank: '',
    accountNumber: '',
    accountName: '',
};

const resolveBank = (code) => BANK_LIST.find((item) => item.code === code || item.shortName === code) || null;

// Hien thi ghi chu than thien theo trang thai (khong hien loi he thong)
const getFriendlyNote = (item) => {
    if (item.status === 'COMPLETED') return null; // transferRef da duoc hien
    if (item.status === 'MANUAL' || item.status === 'PENDING' || item.status === 'PROCESSING') {
        return 'Yêu cầu đang được admin xử lý. Tiền sẽ được chuyển về tài khoản của bạn trong vòng 24 giờ.';
    }
    if (item.status === 'FAILED') {
        return 'Giao dịch gặp sự cố. Vui lòng liên hệ admin để được hỗ trợ.';
    }
    return null;
};

const WithdrawCoins = ({ user }) => {
    const userData = user?.data || user || {};
    const userId = userData?.id || userData?.userId || userData?.userID;
    const balance = Number(userData?.coinBalance || 0);

    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
    const [isGreenFundOpen, setIsGreenFundOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const historyRef = useRef(null);
    const formRef = useRef(null);

    const numericCoinAmount = Number(form.coinAmount || 0);
    const moneyAmount = Number.isFinite(numericCoinAmount) ? numericCoinAmount * EXCHANGE_RATE : 0;

    const hasPendingWithdrawal = useMemo(
        () => withdrawals.some((item) => ['MANUAL', 'PENDING', 'PROCESSING'].includes(item.status)),
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

    // Auto-reload when server pushes a coin withdrawal update via WebSocket
    useWebSocket({
        topic: userId ? `/topic/user/${userId}/withdrawals` : null,
        onMessage: useCallback(() => { loadWithdrawals(); }, [loadWithdrawals]),
        enabled: !!userId,
    });

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
        if (submitting) return;
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
            toast.success('Yêu cầu rút điểm đã được ghi nhận. Tiền sẽ được chuyển về tài khoản ngân hàng của bạn trong vòng 24 giờ.');
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
                        <p className={styles.eyebrow}>Quản lý điểm thưởng</p>
                        <h2>Rút điểm về tài khoản ngân hàng</h2>
                        <p>Gửi yêu cầu rút điểm, admin sẽ chuyển khoản và hoàn tiền về tài khoản của bạn trong vòng 24 giờ.</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.navBtn}
                        onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <List size={15} /> Lịch sử giao dịch
                    </button>
                    <button
                        type="button"
                        className={styles.navBtnActive}
                        onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <Building2 size={15} /> Rút tiền về ngân hàng
                    </button>
                    <button className={styles.refreshBtn} type="button" onClick={() => { setLoading(true); loadWithdrawals(true); }}>
                        <RefreshCw size={16} /> Làm mới
                    </button>
                </div>
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

            <div className={styles.greenFundBanner}>
                <div className={styles.greenFundText}>
                    <strong>🌳 Quỹ Trồng Cây Xanh</strong>
                    <span>Dùng coin của bạn để trồng cây tại các điểm du lịch — 1 coin = 1 cây xanh.</span>
                </div>
                <button type="button" className={styles.greenFundBtn} onClick={() => setIsGreenFundOpen(true)}>
                    Dùng coin góp trồng cây 🌳
                </button>
            </div>

            <section className={styles.actionPanel} ref={formRef}>
                <div className={styles.formPanelHeader}>
                    <div className={styles.formHeaderIcon}><Coins size={20} /></div>
                    <div>
                        <h3>Bắt đầu rút điểm</h3>
                        <p>Nhập thông tin tài khoản nhận tiền và số điểm muốn đổi.</p>
                    </div>
                </div>
                <div className={styles.formGrid}>
                    <label className={styles.fieldGroup}>
                        <span><User size={13} /> Tên chủ tài khoản *</span>
                        <input
                            type="text"
                            value={form.accountName}
                            onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                            placeholder="Nhập tên chủ tài khoản"
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span><CreditCard size={13} /> Số tài khoản *</span>
                        <input
                            type="text"
                            value={form.accountNumber}
                            onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                            placeholder="Nhập số tài khoản"
                        />
                    </label>
                    <div className={styles.fieldGroup}>
                        <span><Building2 size={13} /> Ngân hàng hưởng thụ *</span>
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
                        <span><Coins size={13} /> Số điểm muốn rút *</span>
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
                    <div className={styles.previewItem}>
                        <span>Số dư hiện có</span>
                        <strong>{balance.toLocaleString('vi-VN')} điểm</strong>
                    </div>
                    <div className={styles.previewDivider} />
                    <div className={styles.previewItem}>
                        <span>Số tiền quy đổi</span>
                        <strong className={styles.previewAmount}>{moneyAmount.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <button className={styles.primaryBtn} type="button" onClick={handleSubmit} disabled={submitting}>
                        <Landmark size={16} /> {submitting ? 'Đang gử i...' : 'Tạo yêu cầu rút điểm'} <ChevronRight size={15} />
                    </button>
                </div>
            </section>

            <section className={styles.historySection} ref={historyRef}>
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
                            const bank = resolveBank(item.bank);
                            return (
                                <article key={item.id} className={`${styles.historyCard} ${styles[`historyCard_${item.status}`] || ''}`}>
                                    <div className={styles.cardAccent} />
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardTopRow}>
                                            <div className={styles.cardRef}>
                                                <span>{item.referenceCode}</span>
                                                <small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
                                            </div>
                                            <span className={`${styles.statusBadge} ${meta.className}`}>{meta.label}</span>
                                        </div>
                                        <div className={styles.cardAmountRow}>
                                            <span className={styles.coinAmount}>{Number(item.coinAmount).toLocaleString('vi-VN')} điểm</span>
                                            <ArrowRightLeft size={14} className={styles.arrowIcon} />
                                            <span className={styles.moneyAmount}>{Number(item.moneyAmount).toLocaleString('vi-VN')} VND</span>
                                        </div>
                                        <div className={styles.cardInfoRow}>
                                            <div className={styles.infoChip}>
                                                {bank ? <img src={bank.logo} alt={bank.shortName} className={styles.bankLogoSmall} onError={(e) => { e.currentTarget.style.display='none'; }} /> : null}
                                                <span>{bank ? bank.shortName : item.bank}</span>
                                            </div>
                                            <div className={styles.infoChip}>
                                                <WalletCards size={13} />
                                                <span>{item.accountNumberMasked} &bull; {item.accountName}</span>
                                            </div>
                                        </div>
                                        {(() => {
                                            const friendlyNote = getFriendlyNote(item);
                                            return (
                                                <div className={styles.cardFooter}>
                                                    {item.transferRef && (
                                                        <p className={styles.footerRef}>
                                                            <BadgeCheck size={13} /> Mã đối soát: <code>{item.transferRef}</code>
                                                        </p>
                                                    )}
                                                    {friendlyNote && (
                                                        <p className={`${styles.footerNote} ${item.status === 'COMPLETED' || item.status === 'FAILED' ? styles.footerNoteAlt : ''}`}>
                                                            <CircleAlert size={13} /> {friendlyNote}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
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

            <GreenFundDonateModal
                isOpen={isGreenFundOpen}
                onClose={() => setIsGreenFundOpen(false)}
            />
        </div>
    );
};

export default WithdrawCoins;

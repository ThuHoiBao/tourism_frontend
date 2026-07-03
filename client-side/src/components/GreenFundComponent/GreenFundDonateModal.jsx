import React, { useEffect, useMemo, useState } from 'react';
import { X, Sprout, TreePine, Users, Coins, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getGreenFundSummaryApi, donateGreenFundApi } from '../../services/greenFund.ts';
import styles from './GreenFundDonateModal.module.scss';

const QUICK_PICKS = [1, 5, 10, 20];

const GreenFundDonateModal = ({ isOpen, onClose }) => {
    const { user, fetchProfile } = useAuth();
    const userId = user?.id || user?.userId || user?.userID;
    const coinBalance = Number(user?.coinBalance || 0);

    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [coinAmount, setCoinAmount] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setCoinAmount('');
        setAnonymous(false);
        setLoadingSummary(true);
        getGreenFundSummaryApi()
            .then((data) => setSummary(data))
            .catch(() => setSummary(null))
            .finally(() => setLoadingSummary(false));
    }, [isOpen]);

    const costPerTree = Number(summary?.costPerTree || 1000);
    const minDonation = Number(summary?.minDonationCoin || 1);
    // 1 coin = 1.000đ → số cây cho mỗi coin
    const treesPerCoin = useMemo(() => (costPerTree > 0 ? 1000 / costPerTree : 1), [costPerTree]);

    const numericAmount = Number(coinAmount || 0);
    const treesEquivalent = Number.isFinite(numericAmount) ? Math.floor(numericAmount * treesPerCoin) : 0;
    const vndEquivalent = Number.isFinite(numericAmount) ? numericAmount * 1000 : 0;

    if (!isOpen) return null;

    const validate = () => {
        if (!userId) {
            toast.error('Vui lòng đăng nhập để góp trồng cây');
            return false;
        }
        if (!numericAmount || !Number.isInteger(numericAmount) || numericAmount <= 0) {
            toast.error('Số coin góp phải là số nguyên dương');
            return false;
        }
        if (numericAmount < minDonation) {
            toast.error(`Số coin góp tối thiểu là ${minDonation}`);
            return false;
        }
        if (numericAmount > coinBalance) {
            toast.error('Số coin góp vượt quá số dư hiện có');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await donateGreenFundApi(userId, numericAmount, anonymous);
            const result = res?.data || {};
            const baseMsg = res?.message || 'Cảm ơn bạn đã góp trồng cây 🌳';
            toast.success(`${baseMsg} Bạn đã góp tổng cộng ${result.myTotalTrees ?? treesEquivalent} cây!`);
            await fetchProfile?.(userId); // cập nhật lại coinBalance
            onClose?.();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Góp cây thất bại, thử lại sau');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div className={styles.header}>
                    <h3>🌳 Góp trồng cây xanh</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {loadingSummary ? (
                    <div className={styles.loadingState}>
                        <Loader size={20} className={styles.spinner} /> Đang tải thông tin Quỹ Xanh...
                    </div>
                ) : summary && summary.enabled === false ? (
                    <div className={styles.disabledState}>
                        <TreePine size={28} />
                        <p>Quỹ Xanh đang tạm đóng. Vui lòng quay lại sau nhé! 🌿</p>
                    </div>
                ) : (
                    <div className={styles.body}>
                        <p className={styles.intro}>
                            Mỗi <strong>1 coin = {treesPerCoin === 1 ? '1 cây xanh' : `${treesPerCoin.toLocaleString('vi-VN')} cây xanh`}</strong> được trồng tại các điểm du lịch.
                            Cùng Future Travel phủ xanh hành trình của bạn! 🌱
                        </p>

                        <div className={styles.balanceRow}>
                            <Coins size={15} />
                            <span>Số dư hiện có: <strong>{coinBalance.toLocaleString('vi-VN')} coin</strong></span>
                        </div>

                        <label className={styles.fieldGroup}>
                            <span>Số coin muốn góp (tối thiểu {minDonation})</span>
                            <input
                                type="number"
                                min={minDonation}
                                step="1"
                                value={coinAmount}
                                onChange={(event) => setCoinAmount(event.target.value)}
                                placeholder="Nhập số coin"
                            />
                        </label>

                        <div className={styles.quickPicks}>
                            {QUICK_PICKS.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`${styles.quickBtn} ${numericAmount === value ? styles.quickBtnActive : ''}`}
                                    onClick={() => setCoinAmount(String(value))}
                                >
                                    {value} coin
                                </button>
                            ))}
                        </div>

                        {numericAmount > 0 && (
                            <p className={styles.conversionLine}>
                                {numericAmount.toLocaleString('vi-VN')} coin = <strong>{treesEquivalent.toLocaleString('vi-VN')} cây 🌱</strong> ({vndEquivalent.toLocaleString('vi-VN')}đ)
                            </p>
                        )}

                        <label className={styles.anonymousRow}>
                            <input
                                type="checkbox"
                                checked={anonymous}
                                onChange={(event) => setAnonymous(event.target.checked)}
                            />
                            <span>Đóng góp ẩn danh</span>
                        </label>

                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <TreePine size={16} />
                                <div>
                                    <strong>{Number(summary?.treesPlanted || 0).toLocaleString('vi-VN')}</strong>
                                    <span>cây đã trồng</span>
                                </div>
                            </div>
                            <div className={styles.statItem}>
                                <Users size={16} />
                                <div>
                                    <strong>{Number(summary?.totalContributors || 0).toLocaleString('vi-VN')}</strong>
                                    <span>người đã góp</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            <Sprout size={16} /> {submitting ? 'Đang gửi...' : 'Góp ngay 🌱'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GreenFundDonateModal;

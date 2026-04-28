import React, { useState, useEffect } from 'react';
import styles from './PointRedemption.module.scss';
import { FaCoins } from 'react-icons/fa';

const PointRedemption = ({ userPoints, maxRedeemableAmount, onRedeem }) => {
  const EXCHANGE_RATE = 1000; 
  
  const maxPointsUsable = Math.min(userPoints, Math.floor(maxRedeemableAmount / EXCHANGE_RATE));

  const [pointsToUse, setPointsToUse] = useState(0);
  const [isUsing, setIsUsing] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleToggle = () => {
    if (isUsing) {
      setPointsToUse(0);
      onRedeem(0, 0); 
      setIsUsing(false);
    } else {
      const points = maxPointsUsable;
      const amount = points * EXCHANGE_RATE;
      setPointsToUse(points);
      onRedeem(amount, points);
      setIsUsing(true);
    }
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;

    if (val > maxPointsUsable) val = maxPointsUsable;
    if (val < 0) val = 0;

    const amount = val * EXCHANGE_RATE;
    setPointsToUse(val);
    onRedeem(amount, val); 
  };

  useEffect(() => {
    if (isUsing && pointsToUse > maxPointsUsable) {
      const newPoints = maxPointsUsable;
      const newAmount = newPoints * EXCHANGE_RATE;
      setPointsToUse(newPoints);
      onRedeem(newAmount, newPoints);
    }
  }, [maxRedeemableAmount]);

  if (!userPoints || userPoints <= 0) return null;

  if (maxRedeemableAmount <= 0) {
    return (
      <div className={styles.pointContainer}>
        <div className={styles.header}>
          <div className={styles.title}>
            <FaCoins className={styles.icon} />
            <span>Dùng điểm thưởng</span>
          </div>
        </div>
        <div className={styles.balanceInfo}>
          Bạn có <b>{userPoints}</b> điểm
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px',
          fontSize: '13px',
          color: '#666'
        }}>
          ⚠️ Đơn hàng đã được giảm giá tối đa
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pointContainer}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaCoins className={styles.icon} />
          <span>Dùng điểm thưởng</span>
        </div>
        
        <label className={styles.switch}>
          <input 
            type="checkbox" 
            checked={isUsing}
            onChange={handleToggle}
            disabled={maxPointsUsable <= 0}
          />
          <span className={`${styles.slider} ${styles.round}`}></span>
        </label>
      </div>

      <div className={styles.balanceInfo}>
        Bạn có <b>{userPoints}</b> điểm (Trị giá: {formatCurrency(userPoints * EXCHANGE_RATE)})
      </div>

      {isUsing && (
        <div className={styles.redeemSection}>
          <div className={styles.inputGroup}>
            <input 
              type="number" 
              value={pointsToUse === 0 ? '' : pointsToUse}
              onChange={handleInputChange}
              placeholder="Nhập điểm"
              max={maxPointsUsable}
              min={0}
            />
            <span className={styles.suffix}>điểm</span>
          </div>
          
          <div className={styles.conversionResult}>
            Quy đổi: <span className={styles.highlight}>-{formatCurrency(pointsToUse * EXCHANGE_RATE)}</span>
          </div>
          
          <div className={styles.helperText}>
            (Tối đa {maxPointsUsable} điểm cho đơn này)
          </div>

          {pointsToUse < maxPointsUsable && (
            <button 
              className={styles.useMaxBtn}
              onClick={() => {
                const points = maxPointsUsable;
                const amount = points * EXCHANGE_RATE;
                setPointsToUse(points);
                onRedeem(amount, points);
              }}
            >
              Dùng tất cả {maxPointsUsable} điểm
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PointRedemption;
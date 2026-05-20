// DashboardHeader.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfYear, endOfDay, startOfDay } from 'date-fns';
import { CalendarDays, Download, Moon, RefreshCw, Sun } from 'lucide-react';
import styles from './DashboardHeader.module.scss';

const PRESETS = [
    { label: 'Hôm nay', fn: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: '7 ngày', fn: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: '30 ngày', fn: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: '3 tháng', fn: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: '6 tháng', fn: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: 'Năm nay', fn: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    { label: 'Tất cả', fn: () => ({ from: new Date('2023-01-01'), to: new Date() }) },
];

const DashboardHeader = ({ dateRange, onDateRangeChange, onRefresh, darkMode, onToggleDarkMode, loading }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [tempFrom, setTempFrom] = useState(dateRange.from);
    const [tempTo, setTempTo] = useState(dateRange.to);

    const applyPreset = (preset) => {
        const range = preset.fn();
        onDateRangeChange(range);
        setShowPicker(false);
    };

    const applyCustom = () => {
        if (tempFrom && tempTo) {
            onDateRangeChange({ from: tempFrom, to: tempTo });
            setShowPicker(false);
        }
    };

    const formatRange = (from, to) => {
        const fmt = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${fmt(from)} — ${fmt(to)}`;
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.titleBlock}>
                    <h1 className={styles.title}>
                        <span className={styles.titleAccent}>Dashboard</span> Analytics
                    </h1>
                    <p className={styles.subtitle}>Thống kê tổng quan hiệu suất kinh doanh</p>
                </div>
            </div>

            <div className={styles.headerRight}>
                {/* Date Range Picker */}
                <div className={styles.datePickerWrapper}>
                    <button
                        className={styles.dateBtn}
                        onClick={() => setShowPicker(!showPicker)}
                    >
                        <CalendarDays className={styles.btnIcon} size={16} />
                        <span>{formatRange(dateRange.from, dateRange.to)}</span>
                    </button>

                    {showPicker && (
                        <div className={styles.pickerDropdown}>
                            <div className={styles.presets}>
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        className={styles.presetBtn}
                                        onClick={() => applyPreset(p)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.customPicker}>
                                <div className={styles.pickerRow}>
                                    <div className={styles.pickerCol}>
                                        <label>Từ ngày</label>
                                        <DatePicker
                                            selected={tempFrom}
                                            onChange={setTempFrom}
                                            selectsStart
                                            startDate={tempFrom}
                                            endDate={tempTo}
                                            maxDate={tempTo}
                                            dateFormat="dd/MM/yyyy"
                                            inline
                                        />
                                    </div>
                                    <div className={styles.pickerCol}>
                                        <label>Đến ngày</label>
                                        <DatePicker
                                            selected={tempTo}
                                            onChange={setTempTo}
                                            selectsEnd
                                            startDate={tempFrom}
                                            endDate={tempTo}
                                            minDate={tempFrom}
                                            maxDate={new Date()}
                                            dateFormat="dd/MM/yyyy"
                                            inline
                                        />
                                    </div>
                                </div>
                                <div className={styles.pickerActions}>
                                    <button className={styles.cancelBtn} onClick={() => setShowPicker(false)}>Hủy</button>
                                    <button className={styles.applyBtn} onClick={applyCustom}>Áp dụng</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <button
                    className={`${styles.iconBtn} ${loading ? styles.spinning : ''}`}
                    onClick={onRefresh}
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw size={16} />
                </button>
                <button className={styles.iconBtn} onClick={handleExport} title="Xuất báo cáo">
                    <Download size={16} />
                </button>
                <button className={styles.iconBtn} onClick={onToggleDarkMode} title="Chế độ tối">
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>

            {/* Close picker on outside click */}
            {showPicker && (
                <div className={styles.pickerOverlay} onClick={() => setShowPicker(false)} />
            )}
        </div>
    );
};

export default DashboardHeader;

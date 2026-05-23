import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, Calendar, GripVertical, Copy, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Maximize2, Minimize2, Utensils, Sparkles
} from 'lucide-react';
import RichTextEditor from '../../RichTextEditor/RichTextEditor';
import styles from './TabStyles.module.scss';

const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, '').trim();

const ItineraryTab = ({ itineraryDays, setItineraryDays }) => {
  // Mỗi ngày tự quản lý collapse: mặc định mở. Map theo index để đơn giản.
  const [collapsed, setCollapsed] = useState({});
  const [dragIdx, setDragIdx]     = useState(null);   // index đang được kéo
  const [overIdx, setOverIdx]     = useState(null);   // index đang được hover (drop target)
  const draggingFromRef           = useRef(null);     // dùng để chống flicker

  // Sau khi drop, re-number lại cả mảng cho liên tục
  const renumber = (arr) => arr.map((d, i) => ({ ...d, dayNumber: i + 1 }));

  const handleAddDay = () => {
    const newDay = {
      dayNumber: itineraryDays.length + 1,
      title: '',
      meals: '',
      details: ''
    };
    setItineraryDays([...itineraryDays, newDay]);
    // Tự mở ngày mới thêm
    setCollapsed(c => ({ ...c, [itineraryDays.length]: false }));
  };

  const handleDayChange = (index, field, value) => {
    const newDays = [...itineraryDays];
    newDays[index] = { ...newDays[index], [field]: value };
    setItineraryDays(newDays);
  };

  const handleRemoveDay = (index) => {
    const next = renumber(itineraryDays.filter((_, i) => i !== index));
    setItineraryDays(next);
    // dọn collapsed map theo index mới
    const newCollapsed = {};
    Object.keys(collapsed).forEach(k => {
      const ki = Number(k);
      if (ki < index)      newCollapsed[ki]     = collapsed[ki];
      else if (ki > index) newCollapsed[ki - 1] = collapsed[ki];
    });
    setCollapsed(newCollapsed);
  };

  const handleDuplicate = (index) => {
    const src = itineraryDays[index];
    const clone = {
      title: src.title ? `${src.title} (bản sao)` : '',
      meals: src.meals || '',
      details: src.details || ''
    };
    const next = renumber([
      ...itineraryDays.slice(0, index + 1),
      clone,
      ...itineraryDays.slice(index + 1),
    ]);
    setItineraryDays(next);
    // Tự mở ngày vừa nhân bản
    setCollapsed(c => ({ ...c, [index + 1]: false }));
  };

  const toggleCollapse = (index) =>
    setCollapsed(c => ({ ...c, [index]: !c[index] }));

  const expandAll  = () => setCollapsed({});
  const collapseAll = () => {
    const all = {};
    itineraryDays.forEach((_, i) => { all[i] = true; });
    setCollapsed(all);
  };

  // ── Drag & drop reorder (HTML5 native) ─────────────────────────────────
  const onDragStart = (idx) => (e) => {
    setDragIdx(idx);
    draggingFromRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    // Để có hiệu ứng ghost, set dữ liệu tối thiểu
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    if (idx !== overIdx) setOverIdx(idx);
    e.dataTransfer.dropEffect = 'move';
  };
  const onDragLeave = () => setOverIdx(null);
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = draggingFromRef.current ?? dragIdx;
    if (from === null || from === idx) {
      setDragIdx(null); setOverIdx(null);
      return;
    }
    const next = [...itineraryDays];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setItineraryDays(renumber(next));
    // Map lại collapsed state theo vị trí mới
    const remap = {};
    next.forEach((_, newIdx) => {
      const oldIdx = newIdx === idx ? from : (newIdx < idx
        ? (newIdx < from ? newIdx : newIdx + 1)
        : (newIdx <= from ? newIdx - 1 : newIdx));
      if (collapsed[oldIdx] !== undefined) remap[newIdx] = collapsed[oldIdx];
    });
    setCollapsed(remap);
    setDragIdx(null); setOverIdx(null); draggingFromRef.current = null;
  };
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); draggingFromRef.current = null; };

  // ── Validation realtime ─────────────────────────────────────────────────
  const dayValidity = useMemo(() => itineraryDays.map(d => {
    const titleOk = !!d.title?.trim();
    const mealsOk = !!d.meals?.trim();
    const detailsOk = !!stripHtml(d.details);
    return { titleOk, mealsOk, detailsOk, complete: titleOk && mealsOk && detailsOk };
  }), [itineraryDays]);

  const completeCount = dayValidity.filter(v => v.complete).length;
  const totalDays     = itineraryDays.length;
  const allCollapsed  = totalDays > 0 && itineraryDays.every((_, i) => collapsed[i]);

  return (
    <div className={styles.tabContainer}>
      <div className={styles.section}>
        {/* Header sticky-ish bar */}
        <div className={styles.itinToolbar}>
          <div className={styles.itinTitle}>
            <h3>Lịch trình chi tiết</h3>
            {totalDays > 0 && (
              <div className={styles.itinStats}>
                <span className={styles.statChip}>
                  <Calendar size={12} /> {totalDays} ngày
                </span>
                <span className={`${styles.statChip} ${
                  completeCount === totalDays ? styles.statOk : styles.statWarn
                }`}>
                  {completeCount === totalDays
                    ? <CheckCircle2 size={12} />
                    : <AlertCircle size={12} />}
                  {completeCount}/{totalDays} hoàn chỉnh
                </span>
              </div>
            )}
          </div>

          <div className={styles.itinActions}>
            {totalDays > 1 && (
              <button
                type="button"
                className={styles.btnIcon}
                title={allCollapsed ? 'Mở tất cả' : 'Thu gọn tất cả'}
                onClick={allCollapsed ? expandAll : collapseAll}
              >
                {allCollapsed ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
            )}
            <button className={styles.btnAdd} onClick={handleAddDay} type="button">
              <Plus size={16} /> Thêm ngày
            </button>
          </div>
        </div>

        {itineraryDays.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={44} />
            <p>Chưa có lịch trình nào. Thêm ngày đầu tiên để bắt đầu.</p>
            <button className={styles.btnPrimary} onClick={handleAddDay} type="button">
              <Plus size={15} /> Thêm ngày đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.itinList}>
            {itineraryDays.map((day, index) => {
              const isCollapsed = !!collapsed[index];
              const v           = dayValidity[index];
              const isDragging  = dragIdx === index;
              const isDropTarget = overIdx === index && dragIdx !== null && dragIdx !== index;

              return (
                <div
                  key={index}
                  className={`${styles.itinCard}
                    ${isDragging   ? styles.itinDragging : ''}
                    ${isDropTarget ? styles.itinDropTarget : ''}
                    ${v.complete   ? styles.itinComplete : styles.itinIncomplete}`}
                  draggable
                  onDragStart={onDragStart(index)}
                  onDragOver={onDragOver(index)}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop(index)}
                  onDragEnd={onDragEnd}
                >
                  {/* Header: drag handle + badge + summary + actions */}
                  <div className={styles.itinHeader}>
                    <div className={styles.itinHeaderLeft}>
                      <span className={styles.dragHandle} title="Kéo để sắp xếp lại">
                        <GripVertical size={16} />
                      </span>
                      <span className={styles.itinBadge}>Ngày {day.dayNumber}</span>

                      {/* Summary khi collapsed */}
                      {isCollapsed && (
                        <div className={styles.itinSummary}>
                          <span className={styles.itinSumTitle}>
                            {day.title || <em>(chưa có tiêu đề)</em>}
                          </span>
                          {day.meals && (
                            <span className={styles.itinSumMeals}>
                              <Utensils size={11} /> {day.meals}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={styles.itinHeaderRight}>
                      {/* Validity dot */}
                      <span
                        className={`${styles.validDot} ${
                          v.complete ? styles.validOk : styles.validWarn
                        }`}
                        title={v.complete ? 'Đã hoàn chỉnh' : 'Còn thiếu thông tin'}
                      >
                        {v.complete ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      </span>

                      <button
                        type="button"
                        className={styles.btnIcon}
                        title="Nhân bản ngày này"
                        onClick={() => handleDuplicate(index)}
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        type="button"
                        className={styles.btnIcon}
                        title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        onClick={() => toggleCollapse(index)}
                      >
                        {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                      </button>

                      <button
                        type="button"
                        className={styles.btnIconDelete}
                        title="Xóa ngày này"
                        onClick={() => handleRemoveDay(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Content: chỉ render khi không collapsed */}
                  {!isCollapsed && (
                    <div className={styles.itinContent}>
                      <div className={styles.itinRow}>
                        <div className={styles.formGroup}>
                          <label>
                            <Sparkles size={11} /> Tiêu đề
                            <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            className={!v.titleOk && (day.title !== undefined) ? styles.error : ''}
                            value={day.title}
                            onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                            placeholder="VD: Hà Nội - Đà Nẵng - Check in khách sạn"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            <Utensils size={11} /> Bữa ăn
                            <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            className={!v.mealsOk && (day.meals !== undefined) ? styles.error : ''}
                            value={day.meals}
                            onChange={(e) => handleDayChange(index, 'meals', e.target.value)}
                            placeholder="VD: Sáng, Trưa, Tối"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          Chi tiết lịch trình <span className={styles.required}>*</span>
                        </label>
                        <RichTextEditor
                          value={day.details}
                          onChange={(value) => handleDayChange(index, 'details', value)}
                          placeholder="Mô tả chi tiết lịch trình trong ngày..."
                          height="280px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Nút thêm cuối — gọn, không chiếm chỗ như card đầy đủ */}
            <button
              type="button"
              className={styles.itinAddRow}
              onClick={handleAddDay}
            >
              <Plus size={16} /> Thêm ngày {totalDays + 1}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryTab;

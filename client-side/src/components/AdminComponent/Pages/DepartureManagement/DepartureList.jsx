import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Plus, Search, Eye, Edit2, Copy, Trash2, ChevronLeft, ChevronRight,
  Plane, Users, MapPin, Filter, X, Download, ChevronDown,
  AlertTriangle, Layers, CalendarRange, TrendingUp, CircleDot, Ban, Package
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './DepartureList.module.scss';
import DepartureFormModal from './DepartureModal/DepartureFormModal';
import DepartureDetailModal from './DepartureModal/DepartureDetailModal';
import CloneModal from './CloneModal/CloneModal';

// ── Confirm modal đẹp (thay window.confirm) ──────────────────────────────
const ConfirmDeleteModal = ({ open, title, message, onCancel, onConfirm, busy }) => {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}><AlertTriangle size={22} /></div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnGhost} onClick={onCancel} disabled={busy}>Hủy</button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DepartureList = () => {
  const [groups, setGroups]               = useState([]);   // nhóm theo tour
  const [loading, setLoading]             = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [dateFilter, setDateFilter]       = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo]   = useState('');
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalItems, setTotalItems]       = useState(0);       // số tour
  const [totalDepartures, setTotalDepartures] = useState(0);   // tổng số lịch
  const [pageSize, setPageSize]           = useState(10);
  const [locations, setLocations]         = useState([]);

  const [expandedTours, setExpandedTours] = useState(new Set());

  const [showFormModal, setShowFormModal]   = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneLoading, setCloneLoading]     = useState(false);
  const [idToClone, setIdToClone]           = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirm, setConfirm]         = useState({ open: false, ids: [], busy: false });

  useEffect(() => { loadLocations(); }, []);

  const loadLocations = async () => {
    try {
      const res = await axios.get('/locations/national', { params: { page: 0, size: 1000 } });
      if (res.data.content) setLocations(res.data.content);
    } catch {
      toast.error('Không thể tải danh sách địa điểm');
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter, dateFilter, customDateFrom, customDateTo]);

  // ── Date range helper ──────────────────────────────────────────────────
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startISO = (d) => { const x = new Date(d); x.setHours(0,0,0,0);   return x.toISOString(); };
    const endISO   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x.toISOString(); };

    switch (dateFilter) {
      case 'today': return { from: startISO(today), to: endISO(today) };
      case 'thisWeek': {
        const s = new Date(today); s.setDate(today.getDate() - today.getDay());
        const e = new Date(s);     e.setDate(s.getDate() + 6);
        return { from: startISO(s), to: endISO(e) };
      }
      case 'thisMonth': {
        const s = new Date(today.getFullYear(), today.getMonth(), 1);
        const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: startISO(s), to: endISO(e) };
      }
      case 'nextMonth': {
        const s = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const e = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return { from: startISO(s), to: endISO(e) };
      }
      case 'custom': {
        if (!customDateFrom || !customDateTo) return null;
        try {
          const f = new Date(customDateFrom + 'T00:00:00');
          const t = new Date(customDateTo   + 'T23:59:59');
          if (isNaN(f.getTime()) || isNaN(t.getTime())) return null;
          return { from: f.toISOString(), to: t.toISOString() };
        } catch { return null; }
      }
      default: return null;
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, size: pageSize };
      if (statusFilter !== 'all') params.status = statusFilter === 'active';
      const range = getDateRange();
      if (range) { params.startDate = range.from; params.endDate = range.to; }

      const res = await axios.get('/admin/departures/grouped', { params });
      if (res.data.success) {
        const data = res.data.data || [];
        setGroups(data);
        setTotalPages(res.data.totalPages || 0);
        setTotalItems(res.data.totalItems || 0);
        setTotalDepartures(res.data.totalDepartures || 0);
        setSelectedIds(new Set());
        // Mặc định mở rộng nếu chỉ có ít tour
        setExpandedTours(new Set(data.length <= 3 ? data.map(g => g.tourID) : []));
      }
    } catch {
      toast.error('Không thể tải danh sách lịch khởi hành');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartureDetail = async (id) => {
    try {
      const res = await axios.get(`/admin/departures/${id}`);
      return res.data?.success ? res.data.data : null;
    } catch {
      toast.error('Không thể tải chi tiết');
      return null;
    }
  };

  // Single + bulk delete
  const askDeleteOne      = (id) => setConfirm({ open: true, ids: [id], busy: false });
  const askDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ open: true, ids: [...selectedIds], busy: false });
  };
  const doDelete = async () => {
    setConfirm(c => ({ ...c, busy: true }));
    try {
      await Promise.all(confirm.ids.map(id => axios.delete(`/admin/departures/${id}`)));
      toast.success(`Đã xóa ${confirm.ids.length} lịch khởi hành`);
      setConfirm({ open: false, ids: [], busy: false });
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
      setConfirm(c => ({ ...c, busy: false }));
    }
  };

  // Clone
  const handleClone = (id) => { setIdToClone(id); setShowCloneModal(true); };
  const handleCloneSubmit = async (newDate) => {
    if (!idToClone || !newDate) return;
    setCloneLoading(true);
    try {
      const res = await axios.post(`/admin/departures/${idToClone}/clone`, null,
        { params: { newDepartureDate: newDate } });
      if (res.data.success) {
        toast.success('Sao chép thành công!');
        setShowCloneModal(false); setIdToClone(null);
        fetchGroups();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể sao chép');
    } finally {
      setCloneLoading(false);
    }
  };

  const handleEdit = async (departure) => {
    const full = await fetchDepartureDetail(departure.departureID);
    if (full) { setSelectedDeparture(full); setShowFormModal(true); }
  };
  const handleViewDetail = (departure) => {
    setSelectedDeparture(departure);
    setShowDetailModal(true);
  };
  const handleCreateNew = () => { setSelectedDeparture(null); setShowFormModal(true); };

  const handleDateFilterChange = (v) => {
    setDateFilter(v);
    setCurrentPage(0);
    if (v !== 'custom') { setCustomDateFrom(''); setCustomDateTo(''); }
  };

  // Accordion
  const toggleExpand = (tourID) => {
    setExpandedTours(prev => {
      const next = new Set(prev);
      next.has(tourID) ? next.delete(tourID) : next.add(tourID);
      return next;
    });
  };
  const expandAll   = () => setExpandedTours(new Set(filtered.map(g => g.tourID)));
  const collapseAll = () => setExpandedTours(new Set());

  // Selection (theo departure)
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allDepartureIds = useMemo(
    () => filteredIds(groups, searchTerm),
    [groups, searchTerm]
  );
  function filteredIds(gs, term) {
    const t = term.toLowerCase();
    return gs
      .filter(g => g.tourName?.toLowerCase().includes(t) || g.tourCode?.toLowerCase().includes(t))
      .flatMap(g => (g.departures || []).map(d => d.departureID));
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === allDepartureIds.length && allDepartureIds.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(allDepartureIds));
  };

  // Export CSV (toàn bộ lịch trên trang)
  const exportCsv = () => {
    const rows = [['ID', 'Mã tour', 'Tên tour', 'Ngày khởi hành', 'Thời gian', 'Chỗ trống', 'Đã đặt', 'Giá thấp nhất', 'Trạng thái']];
    filtered.forEach(g => (g.departures || []).forEach(d => rows.push([
      d.departureID, g.tourCode, g.tourName,
      d.departureDate || '', d.tourDuration || '',
      d.availableSlots || 0, d.totalBookings || 0,
      d.lowestPrice || 0, d.status ? 'Hoạt động' : 'Tạm dừng',
    ])));
    if (rows.length <= 1) { toast.info('Không có dữ liệu để xuất'); return; }
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `departures-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  // Helpers
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  const formatDate = (s) => {
    if (!s) return '—';
    try {
      let d;
      if (s.includes('/')) {
        const parts = s.split(' ')[0].split('/');
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      } else { d = new Date(s); }
      if (isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    } catch { return '—'; }
  };

  // Filter nhóm client-side
  const filtered = useMemo(() => groups.filter(g =>
    g.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.tourCode?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [groups, searchTerm]);

  const allSelected = selectedIds.size > 0 && selectedIds.size === allDepartureIds.length;

  // Stats trên trang
  const pageStats = useMemo(() => ({
    active: filtered.reduce((s, g) => s + (g.activeCount || 0), 0),
    totalSlots: filtered.reduce((s, g) => s + (g.totalAvailableSlots || 0), 0),
    totalBooked: filtered.reduce((s, g) => s + (g.totalBooked || 0), 0),
  }), [filtered]);

  const slotFillPct = (dep) => {
    const total = (dep.availableSlots || 0) + (dep.totalBookings || 0);
    if (total === 0) return 0;
    return Math.round((dep.totalBookings || 0) / total * 100);
  };

  return (
    <div className={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleIcon}><CalendarRange size={22} /></div>
          <div>
            <h1>Quản lý Lịch khởi hành</h1>
            <p>Nhóm theo tour — bấm vào tour để xem các lịch khởi hành</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={exportCsv}>
            <Download size={15} /> Xuất CSV
          </button>
          <button className={styles.btnPrimary} onClick={handleCreateNew}>
            <Plus size={16} /> Tạo lịch khởi hành
          </button>
        </div>
      </header>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><Package size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng số tour</div>
            <div className={styles.statValue}>{totalItems.toLocaleString('vi-VN')}</div>
            <div className={styles.statHint}>{totalDepartures.toLocaleString('vi-VN')} lịch khởi hành</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><CircleDot size={20} /></div>
          <div>
            <div className={styles.statLabel}>Lịch đang hoạt động</div>
            <div className={styles.statValue}>{pageStats.active}</div>
            <div className={styles.statHint}>trên trang hiện tại</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statPurple}`}><Users size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng chỗ trống</div>
            <div className={styles.statValue}>{pageStats.totalSlots}</div>
            <div className={styles.statHint}>còn trống trên trang</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><TrendingUp size={20} /></div>
          <div>
            <div className={styles.statLabel}>Đã đặt</div>
            <div className={styles.statValue}>{pageStats.totalBooked}</div>
            <div className={styles.statHint}>khách trên trang</div>
          </div>
        </div>
      </section>

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm theo tên tour, mã tour…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className={styles.clearBtn} onClick={() => setSearchTerm('')} title="Xóa tìm kiếm">
              <X size={13} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <Filter size={13} />
          <div className={styles.segmented}>
            {[
              { v: 'all',      label: 'Tất cả' },
              { v: 'active',   label: 'Hoạt động' },
              { v: 'inactive', label: 'Tạm dừng' },
            ].map(o => (
              <button key={o.v}
                className={statusFilter === o.v ? styles.segActive : ''}
                onClick={() => { setStatusFilter(o.v); setCurrentPage(0); }}>
                {o.label}
              </button>
            ))}
          </div>

          <select
            value={dateFilter}
            onChange={e => handleDateFilterChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Mọi thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="thisWeek">Tuần này</option>
            <option value="thisMonth">Tháng này</option>
            <option value="nextMonth">Tháng sau</option>
            <option value="custom">Tùy chỉnh…</option>
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
            className={styles.filterSelect}>
            <option value={10}>10 tour / trang</option>
            <option value={20}>20 tour / trang</option>
            <option value={50}>50 tour / trang</option>
          </select>

          <button className={styles.btnGhost} onClick={expandAll} title="Mở rộng tất cả">
            <ChevronDown size={13} /> Mở tất cả
          </button>
          <button className={styles.btnGhost} onClick={collapseAll} title="Thu gọn tất cả">
            <ChevronRight size={13} /> Thu gọn
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className={styles.customDateRow}>
            <span>Từ</span>
            <input type="date" value={customDateFrom}
              onChange={e => { setCustomDateFrom(e.target.value); setCurrentPage(0); }}
              className={styles.dateInput} />
            <span>đến</span>
            <input type="date" value={customDateTo}
              onChange={e => { setCustomDateTo(e.target.value); setCurrentPage(0); }}
              className={styles.dateInput} />
          </div>
        )}
      </section>

      {/* ── BULK BAR ──────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <section className={styles.bulkBar}>
          <span><strong>{selectedIds.size}</strong> lịch khởi hành đã chọn</span>
          <div>
            <button className={styles.btnGhost} onClick={() => setSelectedIds(new Set())}>
              <X size={13} /> Bỏ chọn
            </button>
            <button className={styles.btnDanger} onClick={askDeleteSelected}>
              <Trash2 size={13} /> Xóa đã chọn
            </button>
          </div>
        </section>
      )}

      {/* ── CONTENT ──────────────────────────────────────────── */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} /> <p>Đang tải dữ liệu…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <Calendar size={52} />
          <h3>Chưa có lịch khởi hành nào</h3>
          <p>Tạo lịch khởi hành đầu tiên cho hệ thống</p>
          <button className={styles.btnPrimary} onClick={handleCreateNew}>
            <Plus size={15} /> Tạo lịch khởi hành đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className={styles.accordion}>
            {filtered.map((g, gi) => {
              const expanded = expandedTours.has(g.tourID);
              return (
                <div key={g.tourID} className={styles.groupCard}
                     style={{ animationDelay: `${Math.min(gi * 0.03, 0.25)}s` }}>
                  {/* Header tour */}
                  <div className={styles.groupHeader} onClick={() => toggleExpand(g.tourID)}>
                    <div className={styles.groupChevron} data-open={expanded}>
                      <ChevronRight size={18} />
                    </div>
                    <div className={styles.groupTitle}>
                      <strong title={g.tourName}>{g.tourName}</strong>
                      <div className={styles.tourMeta}>
                        <span className={styles.tourCode}>{g.tourCode}</span>
                        {g.tourDuration && (
                          <span className={styles.tourDuration}><Layers size={11} /> {g.tourDuration}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.groupMetrics}>
                      <span className={styles.metricPill}>
                        <Calendar size={12} /> {g.departureCount} lịch
                      </span>
                      <span className={styles.metricMuted}>Gần nhất: {formatDate(g.nextDepartureDate)}</span>
                      <span className={styles.slotAvail}>{g.totalAvailableSlots} <small>còn</small></span>
                      <span className={styles.slotBooked}>{g.totalBooked} <small>đã đặt</small></span>
                      <span className={styles.priceCell}>{g.lowestPrice ? formatPrice(g.lowestPrice) : '—'}</span>
                    </div>
                  </div>

                  {/* Body: bảng lịch của tour */}
                  {expanded && (
                    <div className={styles.groupBody}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.cbCol}></th>
                            <th>Ngày khởi hành</th>
                            <th>Tình trạng chỗ</th>
                            <th>Giá từ</th>
                            <th>Vận chuyển</th>
                            <th>Trạng thái</th>
                            <th className={styles.actionsCol}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(g.departures || []).map((d) => {
                            const isSel = selectedIds.has(d.departureID);
                            const pct = slotFillPct(d);
                            return (
                              <tr key={d.departureID} className={isSel ? styles.rowSel : ''}>
                                <td className={styles.cbCol}>
                                  <input type="checkbox" checked={isSel}
                                    onChange={() => toggleSelect(d.departureID)}
                                    aria-label={`Chọn lịch ${formatDate(d.departureDate)}`} />
                                </td>
                                <td className={styles.metaCell}>
                                  <Calendar size={12} /> {formatDate(d.departureDate)}
                                </td>
                                <td>
                                  <div className={styles.slotCell}>
                                    <div className={styles.slotNums}>
                                      <span className={styles.slotAvail}>{d.availableSlots} <small>còn</small></span>
                                      <span className={styles.slotSep}>·</span>
                                      <span className={styles.slotBooked}>{d.totalBookings || 0} <small>đã đặt</small></span>
                                    </div>
                                    <div className={styles.slotBar}>
                                      <div className={styles.slotFill} style={{ width: `${pct}%` }} data-pct={pct} />
                                    </div>
                                  </div>
                                </td>
                                <td className={styles.priceCell}>
                                  {d.lowestPrice ? formatPrice(d.lowestPrice) : '—'}
                                </td>
                                <td>
                                  <div className={styles.transportIcons}>
                                    {d.hasOutboundTransport && (
                                      <span className={styles.transportIcon} title="Có chiều đi">
                                        <Plane size={12} style={{ transform: 'rotate(-45deg)' }} />
                                      </span>
                                    )}
                                    {d.hasInboundTransport && (
                                      <span className={`${styles.transportIcon} ${styles.inbound}`} title="Có chiều về">
                                        <Plane size={12} style={{ transform: 'rotate(135deg)' }} />
                                      </span>
                                    )}
                                    {!d.hasOutboundTransport && !d.hasInboundTransport && (
                                      <span className={styles.muted}>—</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className={`${styles.status} ${d.status ? styles.active : styles.inactive}`}>
                                    {d.status ? <CircleDot size={11} /> : <Ban size={11} />}
                                    {d.status ? 'Hoạt động' : 'Tạm dừng'}
                                  </span>
                                </td>
                                <td className={styles.actionsCol}>
                                  <div className={styles.actions}>
                                    <button className={styles.btnView} title="Xem chi tiết"
                                      onClick={() => handleViewDetail(d)}><Eye size={14} /></button>
                                    <button className={styles.btnEdit} title="Chỉnh sửa"
                                      onClick={() => handleEdit(d)}><Edit2 size={14} /></button>
                                    <button className={styles.btnClone} title="Sao chép sang ngày khác"
                                      onClick={() => handleClone(d.departureID)}><Copy size={14} /></button>
                                    <button className={styles.btnDelete} title="Xóa"
                                      onClick={() => askDeleteOne(d.departureID)}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── PAGINATION (theo tour) ───────────────────────── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0} className={styles.pageBtn}>
                <ChevronLeft size={15} /> Trước
              </button>
              <div className={styles.pageNumbers}>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = totalPages <= 7 ? i : Math.max(0, currentPage - 3) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1} className={styles.pageBtn}>
                Sau <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ──────────────────────────────────────────── */}
      {showFormModal && (
        <DepartureFormModal
          departure={selectedDeparture}
          locations={locations}
          onClose={() => { setShowFormModal(false); setSelectedDeparture(null); }}
          onSuccess={() => { setShowFormModal(false); setSelectedDeparture(null); fetchGroups(); }}
        />
      )}

      <CloneModal
        isOpen={showCloneModal}
        onClose={() => { setShowCloneModal(false); setIdToClone(null); }}
        onClone={handleCloneSubmit}
        loading={cloneLoading}
      />

      {showDetailModal && (
        <DepartureDetailModal
          departureId={selectedDeparture?.departureID}
          onClose={() => { setShowDetailModal(false); setSelectedDeparture(null); }}
          onEdit={async (dep) => {
            setShowDetailModal(false);
            const full = await fetchDepartureDetail(dep.departureID);
            if (full) { setSelectedDeparture(full); setShowFormModal(true); }
          }}
        />
      )}

      <ConfirmDeleteModal
        open={confirm.open}
        title={confirm.ids.length > 1 ? `Xóa ${confirm.ids.length} lịch khởi hành?` : 'Xóa lịch khởi hành này?'}
        message={confirm.ids.length > 1
          ? `Hành động này sẽ xóa ${confirm.ids.length} lịch khởi hành và không thể hoàn tác.`
          : 'Hành động này không thể hoàn tác. Booking liên quan có thể bị ảnh hưởng.'}
        busy={confirm.busy}
        onCancel={() => setConfirm({ open: false, ids: [], busy: false })}
        onConfirm={doDelete}
      />
    </div>
  );
};

export default DepartureList;

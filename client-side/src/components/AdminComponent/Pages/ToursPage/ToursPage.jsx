import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, MapPin, Calendar, ChevronLeft, ChevronRight,
  Image as ImageIcon, Filter, Eye, Download, AlertTriangle, X, CheckCircle2,
  Map, Plane, Clock, ArrowUpDown, ArrowUp, ArrowDown, Layers, Power, PowerOff,
  TrendingUp, Package
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './ToursPage.module.scss';
import TourForm from './ToursForm/TourForm';

// ── Modal confirm xóa (đẹp hơn window.confirm) ────────────────────────────
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

// ── Modal xem chi tiết tour ────────────────────────────────────────────────
const ViewTourModal = ({ tour, onClose, onEdit }) => {
  if (!tour) return null;
  const Info = ({ label, value, icon: Icon }) => (
    <div className={styles.viewRow}>
      <div className={styles.viewLabel}>{Icon && <Icon size={14} />} {label}</div>
      <div className={styles.viewValue}>{value || '—'}</div>
    </div>
  );
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.viewModal} onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Chi tiết tour</h3>
          <button onClick={onClose} className={styles.iconClose}><X size={18} /></button>
        </header>
        <div className={styles.viewBody}>
          <div className={styles.viewHero}>
            {tour.mainImageUrl
              ? <img src={tour.mainImageUrl} alt={tour.tourName} />
              : <div className={styles.noImageLg}><ImageIcon size={36} /></div>}
            <div>
              <span className={styles.tourCodeChip}>{tour.tourCode}</span>
              <h2>{tour.tourName}</h2>
              <span className={`${styles.status} ${tour.status ? styles.active : styles.inactive}`}>
                {tour.status ? <CheckCircle2 size={12} /> : <PowerOff size={12} />}
                {tour.status ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
            </div>
          </div>
          <div className={styles.viewGrid}>
            <Info label="Thời gian"     value={tour.duration}            icon={Clock} />
            <Info label="Phương tiện"   value={tour.transportation}      icon={Plane} />
            <Info label="Khởi hành"     value={tour.startLocationName}   icon={MapPin} />
            <Info label="Điểm đến"      value={tour.endLocationName}     icon={Map} />
            <Info label="Ngày tạo"      value={tour.createdAt ? new Date(tour.createdAt).toLocaleString('vi-VN') : null} icon={Calendar} />
            <Info label="Cập nhật"      value={tour.updatedAt ? new Date(tour.updatedAt).toLocaleString('vi-VN') : null} icon={Calendar} />
          </div>
        </div>
        <footer>
          <button className={styles.btnGhost} onClick={onClose}>Đóng</button>
          <button className={styles.btnPrimary} onClick={() => { onClose(); onEdit(tour.tourID); }}>
            <Edit size={15} /> Chỉnh sửa
          </button>
        </footer>
      </div>
    </div>
  );
};

const ToursPage = () => {
  const [tours, setTours]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalItems, setTotalItems]     = useState(0);
  const [pageSize, setPageSize]         = useState(10);
  const [showTourForm, setShowTourForm] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);

  // Bulk select
  const [selectedIds, setSelectedIds]   = useState(new Set());

  // Sort column
  const [sortBy, setSortBy]             = useState('tourID');
  const [sortDir, setSortDir]           = useState('DESC');

  // View detail modal
  const [viewingTour, setViewingTour]   = useState(null);

  // Confirm delete
  const [confirm, setConfirm]           = useState({ open: false, ids: [], busy: false });

  useEffect(() => {
    fetchTours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, sortDir]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/tours', {
        params: { page: currentPage, size: pageSize, sortBy, sortDirection: sortDir }
      });
      if (response.data.success) {
        const paged = response.data.data;
        setTours(paged.content || []);
        setTotalPages(paged.totalPages || 0);
        setTotalItems(paged.totalItems || 0);
        setSelectedIds(new Set());
      }
    } catch {
      toast.error('Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) { fetchTours(); return; }
    setLoading(true);
    try {
      const response = await axios.get('/admin/tours/search', {
        params: { keyword: searchTerm, page: 0, size: pageSize }
      });
      if (response.data.success) {
        const paged = response.data.data;
        setTours(paged.content || []);
        setTotalPages(paged.totalPages || 0);
        setTotalItems(paged.totalItems || 0);
        setCurrentPage(0);
        setSelectedIds(new Set());
      }
    } catch {
      toast.error('Không thể tìm kiếm tour');
    } finally {
      setLoading(false);
    }
  };

  // Single delete
  const askDeleteOne = (tourId) => setConfirm({ open: true, ids: [tourId], busy: false });
  // Bulk delete
  const askDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ open: true, ids: [...selectedIds], busy: false });
  };

  const doDelete = async () => {
    setConfirm(c => ({ ...c, busy: true }));
    try {
      await Promise.all(confirm.ids.map(id => axios.delete(`/admin/tours/${id}`)));
      toast.success(`Đã xóa ${confirm.ids.length} tour`);
      setConfirm({ open: false, ids: [], busy: false });
      fetchTours();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa tour');
      setConfirm(c => ({ ...c, busy: false }));
    }
  };

  // Sort handler — click cột header
  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => (d === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col); setSortDir('ASC');
    }
    setCurrentPage(0);
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={12} className={styles.sortIconIdle} />;
    return sortDir === 'ASC'
      ? <ArrowUp size={12} className={styles.sortIconActive} />
      : <ArrowDown size={12} className={styles.sortIconActive} />;
  };

  // Selection
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedTours.length && displayedTours.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTours.map(t => t.tourID)));
    }
  };

  // Export CSV (đang hiển thị)
  const exportCsv = () => {
    if (displayedTours.length === 0) { toast.info('Không có dữ liệu để xuất'); return; }
    const rows = [
      ['Mã tour', 'Tên tour', 'Thời gian', 'Phương tiện', 'Khởi hành', 'Điểm đến', 'Trạng thái', 'Ngày tạo'],
      ...displayedTours.map(t => [
        t.tourCode, t.tourName, t.duration, t.transportation,
        t.startLocationName || '', t.endLocationName || '',
        t.status ? 'Hoạt động' : 'Tạm dừng',
        t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : ''
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `tours-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  // Filter trên page hiện tại
  const displayedTours = useMemo(() => (
    statusFilter === 'all'
      ? tours
      : tours.filter(t => statusFilter === 'active' ? t.status : !t.status)
  ), [tours, statusFilter]);

  // Stat overview (dựa trên dữ liệu hiện tại trên trang + totalItems)
  const stats = useMemo(() => {
    const active   = tours.filter(t => t.status).length;
    const inactive = tours.length - active;
    return { active, inactive, page: tours.length, total: totalItems };
  }, [tours, totalItems]);

  const formatDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '—';
  const allSelected = selectedIds.size > 0 && selectedIds.size === displayedTours.length;

  return (
    <div className={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleIcon}><Map size={22} /></div>
          <div>
            <h1>Quản lý Tours</h1>
            <p>Toàn bộ tour du lịch trong hệ thống</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={exportCsv} title="Xuất CSV trang hiện tại">
            <Download size={16} /> Xuất CSV
          </button>
          <button className={styles.btnPrimary}
            onClick={() => { setEditingTourId(null); setShowTourForm(true); }}>
            <Plus size={16} /> Tạo tour mới
          </button>
        </div>
      </header>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><Package size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng tour</div>
            <div className={styles.statValue}>{stats.total.toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><Power size={20} /></div>
          <div>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statHint}>trên trang</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><PowerOff size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tạm dừng</div>
            <div className={styles.statValue}>{stats.inactive}</div>
            <div className={styles.statHint}>trên trang</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statSlate}`}><TrendingUp size={20} /></div>
          <div>
            <div className={styles.statLabel}>Đang xem</div>
            <div className={styles.statValue}>{stats.page} / {pageSize}</div>
            <div className={styles.statHint}>trang {currentPage + 1}/{totalPages || 1}</div>
          </div>
        </div>
      </section>

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên, mã tour…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          {searchTerm && (
            <button className={styles.clearBtn} onClick={() => { setSearchTerm(''); fetchTours(); }} title="Xóa tìm kiếm">
              <X size={14} />
            </button>
          )}
          <button className={styles.searchBtn} onClick={handleSearch}>Tìm</button>
        </div>

        <div className={styles.filterGroup}>
          <Filter size={14} />
          <div className={styles.segmented}>
            {[
              { v: 'all',      label: 'Tất cả'     },
              { v: 'active',   label: 'Hoạt động'  },
              { v: 'inactive', label: 'Tạm dừng'   },
            ].map(o => (
              <button key={o.v}
                className={statusFilter === o.v ? styles.segActive : ''}
                onClick={() => setStatusFilter(o.v)}>
                {o.label}
              </button>
            ))}
          </div>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </section>

      {/* ── BULK BAR (chỉ hiện khi có chọn) ─────────────────── */}
      {selectedIds.size > 0 && (
        <section className={styles.bulkBar}>
          <span><strong>{selectedIds.size}</strong> tour đã chọn</span>
          <div>
            <button className={styles.btnGhost} onClick={() => setSelectedIds(new Set())}>
              <X size={14} /> Bỏ chọn
            </button>
            <button className={styles.btnDanger} onClick={askDeleteSelected}>
              <Trash2 size={14} /> Xóa đã chọn
            </button>
          </div>
        </section>
      )}

      {/* ── CONTENT ──────────────────────────────────────────── */}
      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /><p>Đang tải tour…</p></div>
      ) : displayedTours.length === 0 ? (
        <div className={styles.empty}>
          <ImageIcon size={56} />
          <h3>Chưa có tour nào</h3>
          <p>Bắt đầu bằng việc tạo tour đầu tiên cho hệ thống</p>
          <button className={styles.btnPrimary}
            onClick={() => { setEditingTourId(null); setShowTourForm(true); }}>
            <Plus size={16} /> Tạo tour đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.cbCol}>
                    <input type="checkbox" checked={allSelected}
                      onChange={toggleSelectAll} aria-label="Chọn tất cả" />
                  </th>
                  <th>Ảnh</th>
                  <th className={styles.sortable} onClick={() => toggleSort('tourCode')}>
                    Mã Tour <SortIcon col="tourCode" />
                  </th>
                  <th className={styles.sortable} onClick={() => toggleSort('tourName')}>
                    Tên Tour <SortIcon col="tourName" />
                  </th>
                  <th>Thời gian</th>
                  <th>Điểm đến</th>
                  <th>Khởi hành</th>
                  <th>Trạng thái</th>
                  <th className={styles.sortable} onClick={() => toggleSort('createdAt')}>
                    Ngày tạo <SortIcon col="createdAt" />
                  </th>
                  <th className={styles.actionsCol}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedTours.map((tour, idx) => {
                  const isSel = selectedIds.has(tour.tourID);
                  return (
                    <tr key={tour.tourID}
                        className={`${isSel ? styles.rowSel : ''}`}
                        style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}>
                      <td className={styles.cbCol}>
                        <input type="checkbox" checked={isSel}
                          onChange={() => toggleSelect(tour.tourID)}
                          aria-label={`Chọn ${tour.tourName}`} />
                      </td>
                      <td>
                        <div className={styles.tourImage}>
                          {tour.mainImageUrl
                            ? <img src={tour.mainImageUrl} alt={tour.tourName} loading="lazy" />
                            : <div className={styles.noImage}><ImageIcon size={20} /></div>}
                        </div>
                      </td>
                      <td><span className={styles.tourCodeChip}>{tour.tourCode}</span></td>
                      <td>
                        <div className={styles.tourName}>
                          <strong>{tour.tourName}</strong>
                          <span>
                            <Plane size={11} /> {tour.transportation || '—'}
                          </span>
                        </div>
                      </td>
                      <td className={styles.metaCell}><Clock size={12} /> {tour.duration || '—'}</td>
                      <td className={styles.metaCell}><Map size={12} /> {tour.endLocationName || '—'}</td>
                      <td className={styles.metaCell}><MapPin size={12} /> {tour.startLocationName || '—'}</td>
                      <td>
                        <span className={`${styles.status} ${tour.status ? styles.active : styles.inactive}`}>
                          {tour.status ? <CheckCircle2 size={11} /> : <PowerOff size={11} />}
                          {tour.status ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className={styles.metaCell}>{formatDate(tour.createdAt)}</td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actions}>
                          <button className={styles.btnView} title="Xem chi tiết"
                            onClick={() => setViewingTour(tour)}>
                            <Eye size={15} />
                          </button>
                          <button className={styles.btnEdit} title="Chỉnh sửa"
                            onClick={() => { setEditingTourId(tour.tourID); setShowTourForm(true); }}>
                            <Edit size={15} />
                          </button>
                          <Link className={styles.btnView} title="Bản đồ lộ trình"
                            to={`/admin/tours/${tour.tourID}/stops`}>
                            <MapPin size={15} />
                          </Link>
                          <button className={styles.btnDelete} title="Xóa"
                            onClick={() => askDeleteOne(tour.tourID)}>
                            <Trash2 size={15} />
                          </button>
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
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0} className={styles.pageBtn}>
                <ChevronLeft size={16} /> Trước
              </button>
              <div className={styles.pageNumbers}>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = totalPages <= 7 ? i : Math.max(0, currentPage - 3) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1} className={styles.pageBtn}>
                Sau <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showTourForm && (
        <TourForm
          tourId={editingTourId}
          onClose={() => { setShowTourForm(false); setEditingTourId(null); fetchTours(); }}
        />
      )}

      <ViewTourModal
        tour={viewingTour}
        onClose={() => setViewingTour(null)}
        onEdit={(id) => { setEditingTourId(id); setShowTourForm(true); }}
      />

      <ConfirmDeleteModal
        open={confirm.open}
        title={confirm.ids.length > 1 ? `Xóa ${confirm.ids.length} tour?` : 'Xóa tour này?'}
        message={confirm.ids.length > 1
          ? `Hành động này sẽ xóa ${confirm.ids.length} tour đã chọn và không thể hoàn tác.`
          : 'Hành động này không thể hoàn tác. Tất cả thông tin liên quan đến tour sẽ bị xóa.'}
        busy={confirm.busy}
        onCancel={() => setConfirm({ open: false, ids: [], busy: false })}
        onConfirm={doDelete}
      />
    </div>
  );
};

export default ToursPage;

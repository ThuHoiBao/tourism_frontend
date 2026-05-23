import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, Calendar, Tag, TrendingUp, Users,
  RotateCcw, TicketPercent, Filter, X, Download, AlertTriangle,
  Copy, CheckCircle2, Ban, Clock, Globe, MapPin, ArrowUpDown,
  ArrowUp, ArrowDown, Hash, Sparkles
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './CouponManagement.module.scss';
import CouponModal from './CouponModal/CouponModal';

// ── Confirm modal đẹp ────────────────────────────────────────────────────
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

const CouponManagement = () => {
  const [coupons, setCoupons]           = useState([]);
  const [loading, setLoading]           = useState(false);

  const [page, setPage]                 = useState(0);
  const [pageSize, setPageSize]         = useState(10);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [filterType, setFilterType]     = useState('ALL');
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | expired | used_up | inactive

  // Sort
  const [sortBy, setSortBy]             = useState('createdAt');
  const [sortDir, setSortDir]           = useState('DESC');

  // Bulk select
  const [selectedIds, setSelectedIds]   = useState(new Set());

  // Confirm
  const [confirm, setConfirm]           = useState({ open: false, ids: [], busy: false });

  // Copied feedback
  const [copiedCode, setCopiedCode]     = useState(null);

  // Modal
  const [showModal, setShowModal]       = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/coupons';
      const params = { page, size: pageSize, sortBy, sortDir };

      if (searchTerm.trim()) {
        url = '/admin/coupons/search';
        params.keyword = searchTerm.trim();
      } else if (filterType === 'GLOBAL') {
        url = '/admin/coupons/global';
      } else if (filterType === 'DEPARTURE') {
        url = '/admin/coupons/departure';
      }

      const res = await axios.get(url, { params });
      if (res?.data) {
        setCoupons(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements ?? res.data.totalItems ?? (res.data.content?.length || 0));
        setSelectedIds(new Set());
      }
    } catch {
      toast.error('Không thể tải danh sách coupon');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterType, searchTerm, sortBy, sortDir]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleFilterChange = (type) => {
    if (filterType === type) return;
    setSearchTerm('');
    setPage(0);
    setFilterType(type);
  };

  const handleRefresh = () => {
    if (filterType !== 'ALL' || searchTerm || page !== 0 || statusFilter !== 'all') {
      setFilterType('ALL'); setSearchTerm(''); setPage(0); setStatusFilter('all');
      toast.info('Đã reset bộ lọc');
    } else {
      fetchCoupons();
      toast.info('Đã cập nhật dữ liệu mới nhất');
    }
  };

  const handleCreate = () => { setEditingCoupon(null); setShowModal(true); };
  const handleEdit = (coupon) => { setEditingCoupon(coupon); setShowModal(true); };

  const handleSubmit = async (formData) => {
    if (!formData.couponCode || !formData.discountAmount) {
      toast.warning('Vui lòng điền mã coupon và số tiền giảm');
      return;
    }
    try {
      const payload = {
        couponCode: formData.couponCode,
        description: formData.description,
        discountAmount: Number(formData.discountAmount),
        couponType: formData.couponType,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        departureIds: formData.couponType === 'DEPARTURE' ? formData.departureIds : [],
        sendNotification: formData.sendNotification,
        startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
        endDate: formData.endDate ? `${formData.endDate}T23:59:59` : null,
      };
      if (editingCoupon) {
        await axios.put(`/admin/coupons/${editingCoupon.couponId}`, payload);
        toast.success('Cập nhật coupon thành công');
      } else {
        await axios.post('/admin/coupons', payload);
        toast.success('Tạo coupon thành công');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Confirm delete
  const askDeleteOne = (id) => setConfirm({ open: true, ids: [id], busy: false });
  const askDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ open: true, ids: [...selectedIds], busy: false });
  };
  const doDelete = async () => {
    setConfirm(c => ({ ...c, busy: true }));
    try {
      await Promise.all(confirm.ids.map(id => axios.delete(`/admin/coupons/${id}`)));
      toast.success(`Đã xóa ${confirm.ids.length} coupon`);
      setConfirm({ open: false, ids: [], busy: false });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
      setConfirm(c => ({ ...c, busy: false }));
    }
  };

  // Sort
  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => (d === 'ASC' ? 'DESC' : 'ASC'));
    else { setSortBy(col); setSortDir('ASC'); }
    setPage(0);
  };
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className={styles.sortIconIdle} />;
    return sortDir === 'ASC'
      ? <ArrowUp size={11} className={styles.sortIconActive} />
      : <ArrowDown size={11} className={styles.sortIconActive} />;
  };

  // Selection
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => { if (searchTerm !== undefined) fetchCoupons(); }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [searchTerm]);

  // Copy code
  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      toast.error('Không thể copy');
    }
  };

  // Helpers
  const formatCurrency = (a) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(a || 0);
  const formatDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  const daysLeft = (endDate) => {
    if (!endDate) return null;
    const e = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((e - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const couponStatus = (c) => {
    if (!c.isActive) return { key: 'inactive', label: 'Không hoạt động', cls: styles.statusInactive, Icon: Ban };
    if (c.usageLimit && c.usageCount >= c.usageLimit)
      return { key: 'used_up', label: 'Đã hết lượt', cls: styles.statusUsedUp, Icon: Users };
    if (c.endDate && new Date(c.endDate) < new Date())
      return { key: 'expired', label: 'Hết hạn', cls: styles.statusExpired, Icon: Clock };
    return { key: 'active', label: 'Đang hoạt động', cls: styles.statusActive, Icon: CheckCircle2 };
  };

  // Filter trên page (client-side cho statusFilter)
  const displayedCoupons = useMemo(() => {
    if (statusFilter === 'all') return coupons;
    return coupons.filter(c => couponStatus(c).key === statusFilter);
  }, [coupons, statusFilter]);

  // Real stats (không còn giả lập)
  const stats = useMemo(() => {
    const active = coupons.filter(c => couponStatus(c).key === 'active').length;
    const expired = coupons.filter(c => couponStatus(c).key === 'expired').length;
    const usedUp = coupons.filter(c => couponStatus(c).key === 'used_up').length;
    const totalUsage = coupons.reduce((s, c) => s + (c.usageCount || 0), 0);
    const totalDiscountValue = coupons.reduce((s, c) =>
      s + (Number(c.discountAmount || 0) * (c.usageCount || 0)), 0);
    return { active, expired, usedUp, totalUsage, totalDiscountValue, total: totalElements };
  }, [coupons, totalElements]);

  // Export CSV
  const exportCsv = () => {
    if (displayedCoupons.length === 0) { toast.info('Không có dữ liệu'); return; }
    const rows = [
      ['ID', 'Mã', 'Mô tả', 'Loại', 'Giảm giá', 'Đơn tối thiểu', 'Đã dùng', 'Giới hạn', 'Bắt đầu', 'Kết thúc', 'Trạng thái'],
      ...displayedCoupons.map(c => [
        c.couponId, c.couponCode, c.description || '',
        c.couponType === 'GLOBAL' ? 'Toàn cục' : 'Theo tour',
        c.discountAmount || 0, c.minOrderValue || '',
        c.usageCount || 0, c.usageLimit || '∞',
        c.startDate || '', c.endDate || '',
        couponStatus(c).label
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `coupons-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  // Select all (current page filtered)
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedCoupons.length && displayedCoupons.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedCoupons.map(c => c.couponId)));
    }
  };
  const allSelected = selectedIds.size > 0 && selectedIds.size === displayedCoupons.length;

  return (
    <div className={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleIcon}><TicketPercent size={22} /></div>
          <div>
            <h1>Quản lý Coupon</h1>
            <p>Tạo, theo dõi mã giảm giá và gửi thông báo đến khách hàng</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={exportCsv}>
            <Download size={15} /> Xuất CSV
          </button>
          <button className={styles.btnGhost} onClick={handleRefresh} title="Reset bộ lọc / làm mới">
            <RotateCcw size={15} /> Làm mới
          </button>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <Plus size={16} /> Tạo coupon
          </button>
        </div>
      </header>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><Tag size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng coupon</div>
            <div className={styles.statValue}>{stats.total.toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><CheckCircle2 size={20} /></div>
          <div>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statHint}>trên trang hiện tại</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statPurple}`}><Users size={20} /></div>
          <div>
            <div className={styles.statLabel}>Lượt sử dụng</div>
            <div className={styles.statValue}>{stats.totalUsage}</div>
            <div className={styles.statHint}>trên trang hiện tại</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><TrendingUp size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng giảm đã áp dụng</div>
            <div className={styles.statValue}>{formatCurrency(stats.totalDiscountValue)}</div>
            <div className={styles.statHint}>{stats.expired} hết hạn · {stats.usedUp} hết lượt</div>
          </div>
        </div>
      </section>

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm theo mã coupon, mô tả…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
          {searchTerm && (
            <button className={styles.clearBtn} onClick={() => { setSearchTerm(''); setPage(0); }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <Filter size={13} />
          {/* Loại coupon */}
          <div className={styles.segmented}>
            {[
              { v: 'ALL',       label: 'Tất cả' },
              { v: 'GLOBAL',    label: 'Toàn cục' },
              { v: 'DEPARTURE', label: 'Theo tour' },
            ].map(o => (
              <button key={o.v}
                className={filterType === o.v ? styles.segActive : ''}
                onClick={() => handleFilterChange(o.v)}>
                {o.label}
              </button>
            ))}
          </div>

          {/* Trạng thái (client-side) */}
          <div className={styles.segmented}>
            {[
              { v: 'all',      label: 'Mọi trạng thái' },
              { v: 'active',   label: 'Hoạt động' },
              { v: 'expired',  label: 'Hết hạn' },
              { v: 'used_up',  label: 'Hết lượt' },
            ].map(o => (
              <button key={o.v}
                className={statusFilter === o.v ? styles.segActive : ''}
                onClick={() => setStatusFilter(o.v)}>
                {o.label}
              </button>
            ))}
          </div>

          <select value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className={styles.filterSelect}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </section>

      {/* ── BULK BAR ──────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <section className={styles.bulkBar}>
          <span><strong>{selectedIds.size}</strong> coupon đã chọn</span>
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
          <div className={styles.spinner} /> <p>Đang tải coupon…</p>
        </div>
      ) : displayedCoupons.length === 0 ? (
        <div className={styles.empty}>
          <Sparkles size={52} />
          <h3>Chưa có coupon nào</h3>
          <p>Tạo coupon đầu tiên để khuyến mại cho khách hàng</p>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <Plus size={15} /> Tạo coupon đầu tiên
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
                  <th className={styles.sortable} onClick={() => toggleSort('couponCode')}>
                    Mã coupon <SortIcon col="couponCode" />
                  </th>
                  <th>Mô tả</th>
                  <th className={styles.sortable} onClick={() => toggleSort('discountAmount')}>
                    Giảm giá <SortIcon col="discountAmount" />
                  </th>
                  <th>Loại</th>
                  <th>Sử dụng</th>
                  <th className={styles.sortable} onClick={() => toggleSort('endDate')}>
                    Thời hạn <SortIcon col="endDate" />
                  </th>
                  <th>Trạng thái</th>
                  <th className={styles.actionsCol}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedCoupons.map((c, idx) => {
                  const isSel = selectedIds.has(c.couponId);
                  const st = couponStatus(c);
                  const dleft = daysLeft(c.endDate);
                  const usagePct = c.usageLimit
                    ? Math.min(((c.usageCount || 0) / c.usageLimit) * 100, 100)
                    : 0;
                  return (
                    <tr key={c.couponId}
                        className={isSel ? styles.rowSel : ''}
                        style={{ animationDelay: `${Math.min(idx * 0.03, 0.25)}s` }}>
                      <td className={styles.cbCol}>
                        <input type="checkbox" checked={isSel}
                          onChange={() => toggleSelect(c.couponId)}
                          aria-label={`Chọn ${c.couponCode}`} />
                      </td>
                      <td>
                        <div className={styles.couponInfo}>
                          <div className={styles.iconBox}>
                            <Tag size={14} />
                          </div>
                          <div>
                            <div className={styles.codeRow}>
                              <span className={styles.code}>{c.couponCode}</span>
                              <button className={styles.copyBtn}
                                onClick={() => handleCopy(c.couponCode)}
                                title="Sao chép mã">
                                {copiedCode === c.couponCode
                                  ? <CheckCircle2 size={12} />
                                  : <Copy size={12} />}
                              </button>
                            </div>
                            <div className={styles.idChip}>
                              <Hash size={9} /> {c.couponId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.descCell}>
                          {c.description || <span className={styles.muted}>Không có mô tả</span>}
                          {c.couponType === 'DEPARTURE' && (
                            <div className={styles.couponNote}>
                              <MapPin size={10} /> Áp dụng cho chuyến đi cụ thể
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.amountCell}>
                          <strong>{formatCurrency(c.discountAmount)}</strong>
                          {c.minOrderValue ? (
                            <span className={styles.minOrder}>
                              Min: {formatCurrency(c.minOrderValue)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.typeBadge} ${c.couponType === 'GLOBAL' ? styles.typeGlobal : styles.typeDeparture}`}>
                          {c.couponType === 'GLOBAL'
                            ? <><Globe size={11} /> Toàn cục</>
                            : <><MapPin size={11} /> Theo tour</>}
                        </span>
                      </td>
                      <td>
                        <div className={styles.usageCell}>
                          <div className={styles.usageNums}>
                            <strong>{c.usageCount || 0}</strong>
                            <span>/{c.usageLimit || '∞'}</span>
                          </div>
                          {c.usageLimit ? (
                            <div className={styles.usageBar}>
                              <div className={styles.usageFill}
                                style={{ width: `${usagePct}%` }}
                                data-pct={Math.round(usagePct)} />
                            </div>
                          ) : (
                            <div className={styles.usageInfinite}>Không giới hạn</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <div><Calendar size={11} /> {formatDate(c.startDate)}</div>
                          <div><Calendar size={11} /> {formatDate(c.endDate)}</div>
                          {dleft !== null && st.key === 'active' && (
                            <div className={`${styles.countdownChip} ${
                              dleft <= 3 ? styles.countdownUrgent
                              : dleft <= 7 ? styles.countdownWarn
                              : styles.countdownOk
                            }`}>
                              <Clock size={10} /> còn {dleft} ngày
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.status} ${st.cls}`}>
                          <st.Icon size={11} /> {st.label}
                        </span>
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actions}>
                          <button className={styles.btnEdit} title="Chỉnh sửa"
                            onClick={() => handleEdit(c)}>
                            <Edit2 size={14} />
                          </button>
                          <button className={styles.btnDelete} title="Xóa"
                            onClick={() => askDeleteOne(c.couponId)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0} className={styles.pageBtn}>
                ← Trước
              </button>
              <div className={styles.pageNumbers}>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`${styles.pageNumber} ${page === pageNum ? styles.active : ''}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1} className={styles.pageBtn}>
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <CouponModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        editingCoupon={editingCoupon}
      />

      <ConfirmDeleteModal
        open={confirm.open}
        title={confirm.ids.length > 1 ? `Xóa ${confirm.ids.length} coupon?` : 'Xóa coupon này?'}
        message={confirm.ids.length > 1
          ? `Hành động này sẽ xóa ${confirm.ids.length} coupon và không thể hoàn tác.`
          : 'Hành động này không thể hoàn tác. Booking đã áp dụng coupon vẫn được giữ nguyên.'}
        busy={confirm.busy}
        onCancel={() => setConfirm({ open: false, ids: [], busy: false })}
        onConfirm={doDelete}
      />
    </div>
  );
};

export default CouponManagement;

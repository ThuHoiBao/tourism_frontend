import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, MapPin, X, Image as ImageIcon, Download,
  ChevronLeft, ChevronRight, Filter, Eye, AlertTriangle, ArrowUpDown,
  ArrowUp, ArrowDown, Globe, Compass, Layers, Map, Plane, CheckCircle2,
  Hash
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './LocationManager.module.scss';

// Vietnam Airport Database (auto-fill)
const AIRPORTS = {
  'hà nội':      { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài' },
  'đà nẵng':     { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng' },
  'hồ chí minh': { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất' },
  'nha trang':   { code: 'CXR', name: 'Sân bay Quốc tế Cam Ranh' },
  'phú quốc':    { code: 'PQC', name: 'Sân bay Quốc tế Phú Quốc' },
  'đà lạt':      { code: 'DLI', name: 'Sân bay Liên Khương' },
  'cần thơ':     { code: 'VCA', name: 'Sân bay Quốc tế Cần Thơ' },
  'huế':         { code: 'HUI', name: 'Sân bay Quốc tế Phú Bài' },
  'hải phòng':   { code: 'HPH', name: 'Sân bay Quốc tế Cát Bi' },
  'vinh':        { code: 'VII', name: 'Sân bay Quốc tế Vinh' },
};

const REGION_INFO = {
  NORTH:   { label: 'Miền Bắc',   className: 'badgeNorth' },
  CENTRAL: { label: 'Miền Trung', className: 'badgeCentral' },
  SOUTH:   { label: 'Miền Nam',   className: 'badgeSouth' },
};

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

const LocationManager = () => {
  const [locations, setLocations]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [showModal, setShowModal]         = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Pagination
  const [page, setPage]                   = useState(0);
  const [pageSize, setPageSize]           = useState(10);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm]       = useState('');
  const [regionFilter, setRegionFilter]   = useState('');

  // Sort
  const [sortBy, setSortBy]               = useState('updatedAt');
  const [sortDir, setSortDir]             = useState('DESC');

  // Bulk
  const [selectedIds, setSelectedIds]     = useState(new Set());

  // Confirm modal
  const [confirm, setConfirm]             = useState({ open: false, ids: [], busy: false });

  // Form data
  const [formData, setFormData] = useState({
    name: '', slug: '', region: 'NORTH', description: '',
    airportCode: '', airportName: '', image: ''
  });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm, regionFilter, sortBy, sortDir]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/locations', {
        params: {
          page, size: pageSize,
          search: searchTerm,
          region: regionFilter,
          sortBy, sortDir
        }
      });
      setLocations(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setSelectedIds(new Set());
    } catch {
      toast.error('Không thể tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug
  const generateSlug = (name) =>
    name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  // Handle name change — auto-fill slug + airport
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    setFormData(prev => {
      const next = { ...prev, name, slug };
      if (!prev.airportCode || !prev.airportName) {
        const airport = AIRPORTS[name.toLowerCase().trim()];
        if (airport) {
          next.airportCode = airport.code;
          next.airportName = airport.name;
        }
      }
      return next;
    });
  };

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Kích thước ảnh tối đa 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Modal handlers
  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({ name: '', slug: '', region: 'NORTH', description: '', airportCode: '', airportName: '', image: '' });
    setImageFile(null); setImagePreview('');
    setShowModal(true);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      slug: location.slug,
      region: location.region,
      description: location.description || '',
      airportCode: location.airportCode || '',
      airportName: location.airportName || '',
      image: location.image || ''
    });
    setImagePreview(location.image || ''); setImageFile(null);
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.region) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
    }
    setSaving(true);
    try {
      let locationId = editingLocation?.locationID;
      if (editingLocation) {
        await axios.put(`/admin/locations/${locationId}`, formData);
        toast.success('Cập nhật địa điểm thành công');
      } else {
        const res = await axios.post('/admin/locations', formData);
        locationId = res.data?.locationID || res.locationID;
        toast.success('Tạo địa điểm thành công');
      }
      if (imageFile && locationId) {
        const fd = new FormData();
        fd.append('file', imageFile);
        await axios.post(`/admin/locations/${locationId}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Delete (single + bulk)
  const askDeleteOne      = (id) => setConfirm({ open: true, ids: [id], busy: false });
  const askDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ open: true, ids: [...selectedIds], busy: false });
  };
  const doDelete = async () => {
    setConfirm(c => ({ ...c, busy: true }));
    try {
      await Promise.all(confirm.ids.map(id => axios.delete(`/admin/locations/${id}`)));
      toast.success(`Đã xóa ${confirm.ids.length} địa điểm`);
      setConfirm({ open: false, ids: [], busy: false });
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
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
  const toggleSelectAll = () => {
    if (selectedIds.size === locations.length && locations.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(locations.map(l => l.locationID)));
  };

  // Export CSV
  const exportCsv = () => {
    if (locations.length === 0) { toast.info('Không có dữ liệu để xuất'); return; }
    const rows = [
      ['ID', 'Tên', 'Slug', 'Khu vực', 'Mã sân bay', 'Tên sân bay', 'Tours đi', 'Tours đến', 'Mô tả'],
      ...locations.map(l => [
        l.locationID, l.name, l.slug, REGION_INFO[l.region]?.label || l.region,
        l.airportCode || '', l.airportName || '',
        l.toursAsStartPoint || 0, l.toursAsEndPoint || 0,
        (l.description || '').replace(/\n/g, ' ')
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `locations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  // Stats (page-level)
  const stats = useMemo(() => {
    const north   = locations.filter(l => l.region === 'NORTH').length;
    const central = locations.filter(l => l.region === 'CENTRAL').length;
    const south   = locations.filter(l => l.region === 'SOUTH').length;
    const withAirport = locations.filter(l => l.airportCode).length;
    return { north, central, south, withAirport };
  }, [locations]);

  const allSelected = selectedIds.size > 0 && selectedIds.size === locations.length;

  return (
    <div className={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleIcon}><Globe size={22} /></div>
          <div>
            <h1>Quản lý Địa điểm</h1>
            <p>Tỉnh / thành phố, khu vực và thông tin sân bay</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={exportCsv}>
            <Download size={15} /> Xuất CSV
          </button>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <Plus size={16} /> Thêm địa điểm
          </button>
        </div>
      </header>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><MapPin size={20} /></div>
          <div>
            <div className={styles.statLabel}>Tổng địa điểm</div>
            <div className={styles.statValue}>{totalElements.toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statRed}`}><Compass size={20} /></div>
          <div>
            <div className={styles.statLabel}>Miền Bắc</div>
            <div className={styles.statValue}>{stats.north}</div>
            <div className={styles.statHint}>trên trang hiện tại</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><Layers size={20} /></div>
          <div>
            <div className={styles.statLabel}>Miền Trung / Nam</div>
            <div className={styles.statValue}>{stats.central + stats.south}</div>
            <div className={styles.statHint}>{stats.central} TR · {stats.south} N</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><Plane size={20} /></div>
          <div>
            <div className={styles.statLabel}>Có sân bay</div>
            <div className={styles.statValue}>{stats.withAirport}</div>
            <div className={styles.statHint}>trên trang hiện tại</div>
          </div>
        </div>
      </section>

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm theo tên, slug, mô tả…"
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
          <div className={styles.segmented}>
            {[
              { v: '',        label: 'Tất cả' },
              { v: 'NORTH',   label: 'Miền Bắc' },
              { v: 'CENTRAL', label: 'Miền Trung' },
              { v: 'SOUTH',   label: 'Miền Nam' },
            ].map(o => (
              <button key={o.v}
                className={regionFilter === o.v ? styles.segActive : ''}
                onClick={() => { setRegionFilter(o.v); setPage(0); }}>
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
          <span><strong>{selectedIds.size}</strong> địa điểm đã chọn</span>
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
      ) : locations.length === 0 ? (
        <div className={styles.empty}>
          <Map size={52} />
          <h3>Chưa có địa điểm nào</h3>
          <p>Thêm địa điểm đầu tiên để bắt đầu xây dựng catalog</p>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <Plus size={15} /> Thêm địa điểm đầu tiên
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
                      onChange={toggleSelectAll}
                      aria-label="Chọn tất cả" />
                  </th>
                  <th>Ảnh</th>
                  <th className={styles.sortable} onClick={() => toggleSort('name')}>
                    Tên địa điểm <SortIcon col="name" />
                  </th>
                  <th>Khu vực</th>
                  <th>Sân bay</th>
                  <th>Mô tả</th>
                  <th>Tours</th>
                  <th className={styles.sortable} onClick={() => toggleSort('updatedAt')}>
                    Cập nhật <SortIcon col="updatedAt" />
                  </th>
                  <th className={styles.actionsCol}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((l, idx) => {
                  const isSel = selectedIds.has(l.locationID);
                  const region = REGION_INFO[l.region] || { label: l.region, className: '' };
                  return (
                    <tr key={l.locationID}
                        className={isSel ? styles.rowSel : ''}
                        style={{ animationDelay: `${Math.min(idx * 0.03, 0.25)}s` }}>
                      <td className={styles.cbCol}>
                        <input type="checkbox" checked={isSel}
                          onChange={() => toggleSelect(l.locationID)}
                          aria-label={`Chọn ${l.name}`} />
                      </td>
                      <td>
                        <div className={styles.locationImage}>
                          {l.image
                            ? <img src={l.image} alt={l.name}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            : null}
                          <div className={styles.noImage}
                               style={{ display: l.image ? 'none' : 'flex' }}>
                            <ImageIcon size={18} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.locationName}>
                          <strong>{l.name}</strong>
                          <span className={styles.slugChip}>
                            <Hash size={10} /> {l.slug}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[region.className]}`}>
                          {region.label}
                        </span>
                      </td>
                      <td>
                        {l.airportCode ? (
                          <div className={styles.airportCell} title={l.airportName}>
                            <span className={styles.airportCode}>{l.airportCode}</span>
                            <span className={styles.airportName}>{l.airportName}</span>
                          </div>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.descCell}>
                          {l.description
                            ? (l.description.length > 70
                                ? l.description.slice(0, 70) + '…'
                                : l.description)
                            : <span className={styles.muted}>Chưa có mô tả</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.tourStats}>
                          <span className={styles.tourStat} title="Tour có điểm khởi hành ở đây">
                            <Plane size={11} style={{ transform: 'rotate(-45deg)' }} /> {l.toursAsStartPoint || 0}
                          </span>
                          <span className={styles.tourStat} title="Tour có điểm đến ở đây">
                            <MapPin size={11} /> {l.toursAsEndPoint || 0}
                          </span>
                        </div>
                      </td>
                      <td className={styles.metaCell}>
                        {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actions}>
                          <button className={styles.btnEdit} title="Chỉnh sửa"
                            onClick={() => handleEdit(l)}>
                            <Edit2 size={14} />
                          </button>
                          <button className={styles.btnDelete} title="Xóa"
                            onClick={() => askDeleteOne(l.locationID)}>
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
                <ChevronLeft size={15} /> Trước
              </button>
              <div className={styles.pageNumbers}>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`${styles.pageNumber} ${page === pageNum ? styles.active : ''}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1} className={styles.pageBtn}>
                Sau <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODAL FORM ──────────────────────────────────────── */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <h2>{editingLocation ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}</h2>
                <p>{editingLocation ? `ID: ${editingLocation.locationID}` : 'Điền thông tin để tạo địa điểm'}</p>
              </div>
              <button className={styles.btnClose} onClick={() => setShowModal(false)} type="button">
                <X size={18} />
              </button>
            </header>

            <form className={styles.modalBody} onSubmit={handleSubmit}>

              {/* Section: Ảnh */}
              <div className={styles.section}>
                <h3>Hình ảnh</h3>
                <div className={styles.uploadArea}>
                  {imagePreview ? (
                    <div className={styles.imagePreview}>
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className={styles.btnChangeImage}
                        onClick={() => document.getElementById('image-input').click()}
                      >
                        <ImageIcon size={14} /> Thay đổi ảnh
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.uploadPlaceholder}
                      onClick={() => document.getElementById('image-input').click()}
                    >
                      <ImageIcon size={36} />
                      <strong>Click để chọn ảnh</strong>
                      <span>JPG, PNG, WebP — tối đa 5MB</span>
                    </div>
                  )}
                  <input id="image-input" type="file" accept="image/*"
                    onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
              </div>

              {/* Section: Thông tin cơ bản */}
              <div className={styles.section}>
                <h3>Thông tin cơ bản</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tên địa điểm <span className={styles.required}>*</span></label>
                    <input
                      type="text" value={formData.name}
                      onChange={handleNameChange}
                      placeholder="VD: Đà Nẵng, Hà Nội…"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Slug <span className={styles.required}>*</span>
                      {formData.slug && <CheckCircle2 size={11} className={styles.checkIcon} />}
                    </label>
                    <input
                      type="text" value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="da-nang, ha-noi…"
                      required
                      className={styles.monoInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Khu vực <span className={styles.required}>*</span></label>
                  <div className={styles.regionPicker}>
                    {[
                      { v: 'NORTH',   label: 'Miền Bắc' },
                      { v: 'CENTRAL', label: 'Miền Trung' },
                      { v: 'SOUTH',   label: 'Miền Nam' },
                    ].map(o => (
                      <button key={o.v} type="button"
                        className={`${styles.regionOption} ${formData.region === o.v ? styles.regionOptionActive : ''}`}
                        onClick={() => setFormData({ ...formData, region: o.v })}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn về địa điểm (tối đa 500 ký tự)…"
                    rows={4}
                    maxLength={500}
                  />
                  <div className={styles.metaRow}>
                    <span className={styles.helper}>Hiển thị trên trang chi tiết khi khách click vào</span>
                    <span className={styles.charCount}>{(formData.description || '').length}/500</span>
                  </div>
                </div>
              </div>

              {/* Section: Sân bay (mới) */}
              <div className={styles.section}>
                <h3><Plane size={14} /> Thông tin sân bay</h3>
                <p className={styles.sectionHint}>
                  Tự động điền khi nhập tên địa điểm có sân bay. Có thể chỉnh tay nếu cần.
                </p>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Mã sân bay</label>
                    <input
                      type="text"
                      value={formData.airportCode}
                      onChange={(e) => setFormData({ ...formData, airportCode: e.target.value.toUpperCase() })}
                      placeholder="VD: SGN, HAN, DAD…"
                      className={styles.monoInput}
                      maxLength={4}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tên sân bay</label>
                    <input
                      type="text"
                      value={formData.airportName}
                      onChange={(e) => setFormData({ ...formData, airportName: e.target.value })}
                      placeholder="VD: Sân bay Quốc tế Tân Sơn Nhất"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost}
                  onClick={() => setShowModal(false)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving
                    ? <><span className={styles.miniSpin} /> Đang lưu…</>
                    : <><CheckCircle2 size={15} /> {editingLocation ? 'Cập nhật' : 'Tạo mới'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ──────────────────────────────────── */}
      <ConfirmDeleteModal
        open={confirm.open}
        title={confirm.ids.length > 1
          ? `Xóa ${confirm.ids.length} địa điểm?`
          : 'Xóa địa điểm này?'}
        message={confirm.ids.length > 1
          ? `Hành động này sẽ xóa ${confirm.ids.length} địa điểm và không thể hoàn tác. Tour đang liên kết có thể bị ảnh hưởng.`
          : 'Hành động này không thể hoàn tác. Tour đang liên kết tới địa điểm này có thể bị ảnh hưởng.'}
        busy={confirm.busy}
        onCancel={() => setConfirm({ open: false, ids: [], busy: false })}
        onConfirm={doDelete}
      />
    </div>
  );
};

export default LocationManager;

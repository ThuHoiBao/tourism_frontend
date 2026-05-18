import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, MapPin, Calendar,
  ChevronLeft, ChevronRight, Image as ImageIcon, Filter
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './ToursPage.module.scss';
import TourForm from './ToursForm/TourForm';

const ToursPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showTourForm, setShowTourForm] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);

  useEffect(() => {
    fetchTours();
  }, [currentPage, pageSize]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/tours', {
        params: { page: currentPage, size: pageSize, sortBy: 'tourID', sortDirection: 'DESC' }
      });
      if (response.data.success) {
        const paged = response.data.data;
        setTours(paged.content || []);
        setTotalPages(paged.totalPages || 0);
        setTotalItems(paged.totalItems || 0);
      }
    } catch (error) {
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
      }
    } catch {
      toast.error('Không thể tìm kiếm tour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId, tourName) => {
    if (!window.confirm(`Xóa tour "${tourName}"?`)) return;
    try {
      await axios.delete(`/admin/tours/${tourId}`);
      toast.success('Xóa tour thành công!');
      fetchTours();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tour');
    }
  };

  const displayedTours = statusFilter === 'all'
    ? tours
    : tours.filter(t => statusFilter === 'active' ? t.status : !t.status);

  const formatDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '-';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1><MapPin size={28} /> Quản lý Tours</h1>
          <p>Quản lý tất cả các tour du lịch</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setEditingTourId(null); setShowTourForm(true); }}>
          <Plus size={18} /> Tạo tour mới
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, mã tour..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Tìm</button>
        </div>

        <div className={styles.filterGroup}>
          <Filter size={16} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
            <option value={50}>50/trang</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <span>Tổng: <strong>{totalItems}</strong> tour</span>
        <span>Trang: <strong>{currentPage + 1}/{totalPages || 1}</strong></span>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /><p>Đang tải...</p></div>
      ) : displayedTours.length === 0 ? (
        <div className={styles.empty}>
          <ImageIcon size={56} />
          <h3>Chưa có tour nào</h3>
          <button className={styles.btnPrimary} onClick={() => { setEditingTourId(null); setShowTourForm(true); }}>
            <Plus size={18} /> Tạo tour đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã Tour</th>
                  <th>Tên Tour</th>
                  <th>Thời gian</th>
                  <th>Điểm đến</th>
                  <th>Khởi hành</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedTours.map(tour => (
                  <tr key={tour.tourID}>
                    <td>
                      <div className={styles.tourImage}>
                        {tour.mainImageUrl
                          ? <img src={tour.mainImageUrl} alt={tour.tourName} />
                          : <div className={styles.noImage}><ImageIcon size={22} /></div>
                        }
                      </div>
                    </td>
                    <td><span className={styles.tourCode}>{tour.tourCode}</span></td>
                    <td>
                      <div className={styles.tourName}>
                        <strong>{tour.tourName}</strong>
                        <span>{tour.transportation}</span>
                      </div>
                    </td>
                    <td><Calendar size={13} /> {tour.duration}</td>
                    <td><MapPin size={13} /> {tour.endLocationName || '-'}</td>
                    <td>{tour.startLocationName || '-'}</td>
                    <td>
                      <span className={`${styles.status} ${tour.status ? styles.active : styles.inactive}`}>
                        {tour.status ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>{formatDate(tour.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnEdit} title="Chỉnh sửa"
                          onClick={() => { setEditingTourId(tour.tourID); setShowTourForm(true); }}>
                          <Edit size={16} />
                        </button>
                        <button className={styles.btnDelete} title="Xóa"
                          onClick={() => handleDelete(tour.tourID, tour.tourName)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0} className={styles.pageBtn}>
                <ChevronLeft size={18} /> Trước
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
                Sau <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {showTourForm && (
        <TourForm
          tourId={editingTourId}
          onClose={() => { setShowTourForm(false); setEditingTourId(null); fetchTours(); }}
        />
      )}
    </div>
  );
};

export default ToursPage;

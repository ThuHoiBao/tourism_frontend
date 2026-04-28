import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, MapPin, Calendar, 
  Filter, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './ToursPage.module.scss';
import TourForm from './ToursForm/TourForm';

const TourList = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal states
  const [showTourForm, setShowTourForm] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);

  useEffect(() => {
    fetchTours();
  }, [currentPage, pageSize]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/tours', {
        params: {
          page: currentPage,
          size: pageSize,
          sortBy: 'tourID',
          sortDirection: 'DESC'
        }
      });

      if (response.data.success) {
        setTours(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error('Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchTours();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/admin/tours/search', {
        params: {
          keyword: searchTerm,
          page: 0,
          size: pageSize
        }
      });

      if (response.data.success) {
        setTours(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error('Error searching tours:', error);
      toast.error('Không thể tìm kiếm tour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId, tourName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tour "${tourName}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/tours/${tourId}`);
      
      if (response.data.success) {
        toast.success('Xóa tour thành công!');
        fetchTours();
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      const msg = error.response?.data?.message || 'Không thể xóa tour';
      toast.error(msg);
    }
  };

  const handleEdit = (tourId) => {
    setEditingTourId(tourId);
    setShowTourForm(true);
  };

  const handleCreateNew = () => {
    setEditingTourId(null);
    setShowTourForm(true);
  };

  const handleCloseForm = () => {
    setShowTourForm(false);
    setEditingTourId(null);
    fetchTours();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1> <MapPin size={32} />Quản lý Tours</h1>
          <p>Quản lý tất cả các tour du lịch</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleCreateNew}>
          <Plus size={20} />
          Tạo tour mới
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên tour, mã tour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Tìm kiếm</button>
        </div>

        <div className={styles.filterGroup}>
          <select 
            value={pageSize} 
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            className={styles.pageSize}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Tổng số tour</span>
          <span className={styles.statValue}>{totalItems}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Trang hiện tại</span>
          <span className={styles.statValue}>{currentPage + 1} / {totalPages}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : tours.length === 0 ? (
        <div className={styles.empty}>
          <ImageIcon size={64} />
          <h3>Chưa có tour nào</h3>
          <p>Bắt đầu bằng cách tạo tour đầu tiên của bạn</p>
          <button className={styles.btnPrimary} onClick={handleCreateNew}>
            <Plus size={20} />
            Tạo tour đầu tiên
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
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.tourID}>
                    <td>
                       <div className={styles.tourImage}>
                          {tour.images && tour.images.length > 0 ? (
                            (() => {
                              const mainImg = tour.images.find(img => img.isMainImage);
                              return mainImg ? (
                                <img
                                  src={mainImg.imageURL}
                                  alt={tour.tourName}
                                />
                              ) : (
                                <div className={styles.noImage}>
                                  <ImageIcon size={24} />
                                </div>
                              );
                            })()
                          ) : (
                            <div className={styles.noImage}>
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>
                    </td>
                    <td>
                      <span className={styles.tourCode}>{tour.tourCode}</span>
                    </td>
                    <td>
                      <div className={styles.tourName}>
                        <strong>{tour.tourName}</strong>
                        <span className={styles.tourTransport}>
                          {tour.transportation}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.duration}>
                        <Calendar size={14} />
                        {tour.duration}
                      </div>
                    </td>
                    <td>
                      <div className={styles.location}>
                        <MapPin size={14} />
                        {tour.endLocationName || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.status} ${tour.status ? styles.active : styles.inactive}`}>
                        {tour.status ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.date}>
                        {formatDate(tour.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnEdit}
                          onClick={() => handleEdit(tour.tourID)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className={styles.btnDelete}
                          onClick={() => handleDelete(tour.tourID, tour.tourName)}
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className={styles.pageBtn}
              >
                <ChevronLeft size={20} />
                Trước
              </button>

              <div className={styles.pageNumbers}>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`${styles.pageNumber} ${currentPage === index ? styles.active : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className={styles.pageBtn}
              >
                Sau
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Tour Form Modal */}
      {showTourForm && (
        <TourForm
          tourId={editingTourId}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default TourList;
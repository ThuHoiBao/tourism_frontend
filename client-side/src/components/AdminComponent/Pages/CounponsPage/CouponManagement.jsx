import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, Tag, TrendingUp, Users, RotateCcw, Bell, TicketPercent  } from 'lucide-react';
import axios from '../../../../utils/axiosCustomize'; 
import { toast } from 'react-toastify'; 
import styles from './CouponManagement.module.scss';
import CouponModal from './CouponModal/CouponModal'; 

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/coupons';
      const params = {
        page: page,
        size: 10,
        sortDir: 'DESC' 
      };

      if (searchTerm.trim()) {
        url = '/admin/coupons/search';
        params.keyword = searchTerm.trim();
      } 
      else if (filterType === 'GLOBAL') {
        url = '/admin/coupons/global';
      } else if (filterType === 'DEPARTURE') {
        url = '/admin/coupons/departure';
      }

      const response = await axios.get(url, { params });
      
      if (response && response.data) {
        setCoupons(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Không thể tải danh sách coupon');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, searchTerm]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFilterChange = useCallback((type) => {
    if (filterType === type) return; 
    setSearchTerm(''); 
    setPage(0);
    setFilterType(type);
  }, [filterType]);

  const handleRefresh = useCallback(() => {
    if (filterType !== 'ALL' || searchTerm !== '' || page !== 0) {
      setFilterType('ALL');
      setSearchTerm('');
      setPage(0);
      toast.info('Đã reset về trạng thái ban đầu');
    } else {
      fetchCoupons();
      toast.info('Đã cập nhật dữ liệu mới nhất');
    }
  }, [filterType, searchTerm, page, fetchCoupons]);

  const handleCreate = () => {
    setEditingCoupon(null);
    setShowModal(true);
  };

  const handleEdit = (coupon) => {
    // Khi bấm sửa, truyền toàn bộ object coupon vào modal
    // Backend cần trả về field 'departureDetails' trong response danh sách hoặc chi tiết
    setEditingCoupon(coupon);
    setShowModal(true);
  };

  // --- HÀM QUAN TRỌNG ĐÃ ĐƯỢC FIX ---
  const handleSubmit = async (formData) => {
    // Validate cơ bản
    if (!formData.couponCode || !formData.discountAmount) {
      toast.warning('Vui lòng điền mã coupon và số tiền giảm');
      return;
    }

    try {
      // Construct Payload chuẩn theo DTO backend mới
      const payload = {
        couponCode: formData.couponCode,
        description: formData.description,
        discountAmount: Number(formData.discountAmount),
        couponType: formData.couponType,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        
        // [FIX QUAN TRỌNG]: Sử dụng departureIds (mảng) thay vì departureId (đơn)
        departureIds: formData.couponType === 'DEPARTURE' ? formData.departureIds : [],
        
        // Thêm trường gửi thông báo
        sendNotification: formData.sendNotification,

        startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
        endDate: formData.endDate ? `${formData.endDate}T23:59:59` : null
      };
      
      console.log("Payload sending to server:", payload); // Debug log

      if (editingCoupon) {
        await axios.put(`/admin/coupons/${editingCoupon.couponId}`, payload);
        toast.success('Cập nhật coupon thành công');
      } else {
        await axios.post('/admin/coupons', payload);
        toast.success('Tạo coupon thành công');
      }
      setShowModal(false);
      fetchCoupons(); 
    } catch (error) {
      console.error('Error submitting coupon:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa coupon này?')) {
      try {
        await axios.delete(`/admin/coupons/${id}`);
        toast.success('Đã xóa coupon');
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        toast.error('Xóa thất bại');
      }
    }
  };

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setPage(0);
    if (value.trim() && filterType !== 'ALL') {
      setFilterType('ALL');
    }
  }, [filterType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCoupons();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchCoupons]); 

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.isActive) return <span className={`${styles.statusBadge} ${styles.inactive}`}>Không hoạt động</span>;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return <span className={`${styles.statusBadge} ${styles.limit}`}>Đã hết lượt</span>;
    if (new Date(coupon.endDate) < new Date()) return <span className={`${styles.statusBadge} ${styles.expired}`}>Hết hạn</span>;
    return <span className={`${styles.statusBadge} ${styles.active}`}>Đang hoạt động</span>;
  };

  const stats = [
    { label: 'Tổng Coupons', value: coupons.length || 0, icon: Tag, color: 'blue' },
    { label: 'Đang hoạt động', value: coupons.filter(c => c.isActive).length || 0, icon: TrendingUp, color: 'green' },
    { label: 'Đã sử dụng', value: coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0), icon: Users, color: 'purple' },
    { label: 'Lượt thông báo', value: coupons.length * 2, icon: Bell, color: 'orange' } // Giả lập
  ];

  // (Phần JSX render bảng stats và table giữ nguyên như cũ, chỉ thay đổi phần gọi Modal)
  return (
    <div className={styles.couponManagement}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
          
            <h1><TicketPercent size={32} /> Quản lý Coupon & Thông báo</h1>
            <p>Tạo và quản lý mã giảm giá, gửi thông báo tự động đến khách hàng</p>
          </div>
          <button onClick={handleCreate} className={styles.btnCreate}>
            <Plus size={20} />
            Tạo Coupon Mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={styles.statCard}>
                <div className={styles.cardContent}>
                  <div>
                    <p className={styles.label}>{stat.label}</p>
                    <p className={styles.value}>{stat.value}</p>
                  </div>
                  <div className={`${styles.iconWrapper} ${styles[stat.color]}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm mã coupon..." 
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className={styles.filterButtons}>
              {['ALL', 'GLOBAL', 'DEPARTURE'].map((type) => (
                <button 
                  key={type} 
                  type="button"
                  onClick={() => handleFilterChange(type)} 
                  className={filterType === type ? styles.active : ''}
                >
                  {type === 'ALL' ? 'Tất cả' : type === 'GLOBAL' ? 'Toàn cục' : 'Theo tour'}
                </button>
              ))}
              
              <button 
                type="button"
                onClick={handleRefresh} 
                className={styles.btnRefresh}
                title="Tải lại dữ liệu"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Mã Coupon</th>
                <th>Mô tả</th>
                <th>Giảm giá</th>
                <th>Loại</th>
                <th>Sử dụng</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '3rem'}}>Đang tải dữ liệu...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '3rem'}}>Không tìm thấy coupon nào.</td></tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.couponId}>
                  <td>
                    <div className={styles.couponInfo}>
                      <div className={styles.iconBox}>
                        <Tag size={18} />
                      </div>
                      <div>
                        <div className={styles.code}>{coupon.couponCode}</div>
                        <div className={styles.id}>ID: {coupon.couponId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{maxWidth: '200px'}}>
                      <p style={{fontSize: '0.875rem'}}>{coupon.description || 'Không có mô tả'}</p>
                      {/* Hiển thị tóm tắt nếu là departure coupon */}
                      {coupon.couponType === 'DEPARTURE' && (
                        <p style={{fontSize: '0.75rem', color: '#2563eb', marginTop: '0.25rem'}}>
                          📍 Áp dụng cho các chuyến đi cụ thể
                        </p>
                      )}
                    </div>
                  </td>
                  <td className={styles.priceCol}>
                    <div className={styles.amount}>{formatCurrency(coupon.discountAmount)}</div>
                    {coupon.minOrderValue && <div className={styles.min}>Min: {formatCurrency(coupon.minOrderValue)}</div>}
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${coupon.couponType === 'GLOBAL' ? styles.global : styles.departure}`}>
                      {coupon.couponType === 'GLOBAL' ? '🌐 Toàn cục' : '🎫 Theo tour'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.progressBar}>
                      <div className={styles.text}>{coupon.usageCount} / {coupon.usageLimit || '∞'}</div>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: coupon.usageLimit ? `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%` : '0%' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize: '0.875rem', color: '#4b5563'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><Calendar size={14} />{formatDate(coupon.startDate)}</div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem'}}><Calendar size={14} />{formatDate(coupon.endDate)}</div>
                    </div>
                  </td>
                  <td>{getStatusBadge(coupon)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEdit(coupon)} className={styles.edit}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(coupon.couponId)} className={styles.delete}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', gap: '10px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))} 
                  disabled={page === 0}
                  style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Trước
                </button>
                <span style={{ display: 'flex', alignItems: 'center' }}>Trang {page + 1} / {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                  disabled={page >= totalPages - 1}
                  style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                >
                  Sau
                </button>
             </div>
          )}
        </div>
      </div>
      
      {/* Component Modal đã fix logic */}
      <CouponModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        editingCoupon={editingCoupon}
      />
    </div>
  );
};

export default CouponManagement;
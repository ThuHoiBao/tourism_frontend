import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CheckCircle, AlertCircle, Trash2, BellRing } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './CouponModal.module.scss';

const CouponModal = ({ isOpen, onClose, onSubmit, editingCoupon }) => {
  // State quản lý form
  const [formData, setFormData] = useState({
    couponCode: '', 
    description: '', 
    discountAmount: '', 
    couponType: 'GLOBAL',
    usageLimit: '', 
    startDate: '', 
    endDate: '', 
    minOrderValue: '', 
    departureIds: [], // Mảng ID, không phải null
    sendNotification: true 
  });

  const [tours, setTours] = useState([]);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [departures, setDepartures] = useState([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);

  // State lưu trữ chi tiết để hiển thị Summary
  const [selectedDetails, setSelectedDetails] = useState([]);

  // Fetch Tours khi cần
  useEffect(() => {
    if (isOpen && formData.couponType === 'DEPARTURE') {
      fetchTours();
    }
  }, [isOpen, formData.couponType]);

  // Sync data khi mở modal (Edit / Create)
  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        ...editingCoupon,
        startDate: editingCoupon.startDate ? editingCoupon.startDate.split('T')[0] : '',
        endDate: editingCoupon.endDate ? editingCoupon.endDate.split('T')[0] : '',
        // Backend cần map dữ liệu trả về để có mảng departureIds (hoặc ta tự map từ departureDetails)
        departureIds: editingCoupon.departureIds || (editingCoupon.departureDetails?.map(d => d.departureId) || []),
        sendNotification: false
      });

      if (editingCoupon.departureDetails && editingCoupon.departureDetails.length > 0) {
         // Map lại field name cho khớp với logic hiển thị nếu cần (tuỳ vào DTO backend trả về)
         const mappedDetails = editingCoupon.departureDetails.map(d => ({
             id: d.departureId,
             date: d.departureDate,
             tourId: d.tourId,
             tourCode: d.tourCode,
             tourName: d.tourName
         }));
         setSelectedDetails(mappedDetails);

         // Tự chọn lại tour của coupon và nạp lịch để checkbox tick sẵn khi mở Sửa
         const first = editingCoupon.departureDetails[0];
         if (first?.tourId) setSelectedTourId(String(first.tourId));
         if (first?.tourCode) loadDepartures(first.tourCode);
      }
    } else {
      setFormData({
        couponCode: '', description: '', discountAmount: '', couponType: 'GLOBAL',
        usageLimit: '', startDate: '', endDate: '', minOrderValue: '', 
        departureIds: [],
        sendNotification: true 
      });
      setSelectedTourId('');
      setDepartures([]);
      setSelectedDetails([]);
    }
  }, [editingCoupon, isOpen]);

  const fetchTours = async () => {
    try {
      const res = await axios.get('/admin/tours', {
        params: { page: 0, size: 1000 }
      });
      // Response có thể ở dạng { success, data: { content: [...] } } hoặc { data: [...] }
      const tourData =
        res.data?.data?.content || res.data?.data || res.data?.content || [];
      setTours(tourData);
    } catch (error) {
      console.error("Error fetching tours", error);
      toast.error("Không thể tải danh sách tour");
    }
  };

  // Nạp danh sách lịch khởi hành của 1 tour theo tourCode (dùng chung cho chọn tour & mở Sửa)
  const loadDepartures = async (tourCode) => {
    if (!tourCode) return;
    setLoadingDepartures(true);
    try {
      const res = await axios.get(`/tours/${tourCode}`);
      const rawDeps = res.data?.departures || res.data?.data?.departures || [];
      // Chuẩn hoá field: API trả 'departureId', giao diện dùng 'departureID'
      const deps = rawDeps.map(d => ({ ...d, departureID: d.departureID ?? d.departureId }));
      setDepartures(deps);
    } catch (error) {
      console.error("Error fetching departures", error);
      toast.error("Lỗi tải lịch khởi hành");
    } finally {
      setLoadingDepartures(false);
    }
  };

  const handleTourChange = async (e) => {
    const tourId = e.target.value;
    setSelectedTourId(tourId);
    setDepartures([]);

    if (!tourId) return;

    // API chi tiết tour tra theo tourCode, nên lấy tourCode của tour đã chọn
    const tour = tours.find(t => String(t.tourID) === String(tourId));
    if (!tour || !tour.tourCode) {
      toast.error("Không tìm thấy mã tour");
      return;
    }

    await loadDepartures(tour.tourCode);
  };

  const handleDepartureSelect = (dep, currentTour) => {
    const depId = dep.departureID;
    const isSelected = formData.departureIds.includes(depId);

    // 1. Update IDs list
    setFormData(prev => {
      const currentIds = prev.departureIds || [];
      if (isSelected) {
        return { ...prev, departureIds: currentIds.filter(id => id !== depId) };
      } else {
        return { ...prev, departureIds: [...currentIds, depId] };
      }
    });

    // 2. Update Summary details list
    setSelectedDetails(prev => {
      if (isSelected) {
        return prev.filter(item => item.id !== depId);
      } else {
        if (prev.find(item => item.id === depId)) return prev;
        
        return [...prev, {
          id: depId,
          date: dep.departureDate,
          tourId: currentTour.tourID,
          tourCode: currentTour.tourCode,
          tourName: currentTour.tourName
        }];
      }
    });
  };

  const handleRemoveItem = (id) => {  
    setFormData(prev => ({
      ...prev,
      departureIds: prev.departureIds.filter(depId => depId !== id)
    }));
    setSelectedDetails(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.couponType === 'DEPARTURE' && formData.departureIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một lịch khởi hành!");
      return;
    }
    
    onSubmit(formData);
  };

  const groupedSelections = selectedDetails.reduce((acc, item) => {
    if (!acc[item.tourId]) {
      acc[item.tourId] = {
        tourCode: item.tourCode,
        tourName: item.tourName,
        items: []
      };
    }
    acc[item.tourId].items.push(item);
    acc[item.tourId].items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return acc;
  }, {});

  const currentTourDropdownInfo = tours.find(t => String(t.tourID) === String(selectedTourId));

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        
        <div className={styles.modalHeader}>
          <h2>{editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon Mới'}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          
          <div className={styles.formGroup}>
            <label>Mã Coupon <span style={{color:'red'}}>*</span></label>
            <input 
              type="text" 
              required 
              value={formData.couponCode} 
              onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })} 
              placeholder="Ví dụ: SUMMER2024" 
              disabled={!!editingCoupon} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              rows="2" 
              placeholder="Nhập mô tả..."
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label>Loại áp dụng <span style={{color:'red'}}>*</span></label>
              <select 
                value={formData.couponType} 
                onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                disabled={!!editingCoupon}
              >
                <option value="GLOBAL">Toàn cục (Tất cả tour)</option>
                <option value="DEPARTURE">Theo Tour cụ thể</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Giảm giá (VNĐ) <span style={{color:'red'}}>*</span></label>
              <input 
                type="number" 
                required 
                value={formData.discountAmount} 
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })} 
                placeholder="Ví dụ: 200000"
              />
            </div>
          </div>

          {/* KHU VỰC CHỌN TOUR & DEPARTURE */}
          {formData.couponType === 'DEPARTURE' && (
            <div className={styles.selectionContainer}>
              
              <div className={styles.formGroup}>
                <label>Chọn Tour để thêm lịch:</label>
                <select value={selectedTourId} onChange={handleTourChange}>
                  <option value="">-- Chọn Tour --</option>
                  {tours.map(tour => (
                    <option key={tour.tourID} value={tour.tourID}>
                      {tour.tourCode} - {tour.tourName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTourId && (
                <div className={styles.formGroup}>
                  <label>Lịch khởi hành của: <b style={{color:'#2563eb'}}>{currentTourDropdownInfo?.tourCode}</b></label>
                  
                  {loadingDepartures ? (
                    <div className={styles.loadingText}>Đang tải lịch khởi hành...</div>
                  ) : departures.length > 0 ? (
                    <div className={styles.departureList}>
                      {departures.map(dep => (
                        <label key={dep.departureID} className={styles.departureItem}>
                          <input 
                            type="checkbox" 
                            checked={formData.departureIds.includes(dep.departureID)}
                            onChange={() => handleDepartureSelect(dep, currentTourDropdownInfo)}
                          />
                          <div className={styles.depInfo}>
                            <span className={styles.depDate}>
                              <Calendar size={14} style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                              {new Date(dep.departureDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span className={styles.depSlots}>
                              (Còn trống: {dep.availableSlots} chỗ)
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <AlertCircle size={16} /> Tour này chưa có lịch khởi hành phù hợp.
                    </div>
                  )}
                </div>
              )}

              {/* SUMMARY: HIỂN THỊ TẤT CẢ CÁC TOUR ĐÃ CHỌN */}
              {selectedDetails.length > 0 && (
                <div className={styles.selectedSummary}>
                  <h4>
                    <CheckCircle size={18} color="#16a34a" /> 
                    Danh sách đã chọn ({selectedDetails.length})
                  </h4>
                  
                  {Object.keys(groupedSelections).map(tourId => {
                    const group = groupedSelections[tourId];
                    return (
                      <div key={tourId} className={styles.tourGroup}>
                        <div className={styles.tourGroupHeader}>
                          <span>🏷️ {group.tourCode} - {group.tourName}</span>
                          <span style={{fontSize:'0.75rem', color:'#64748b'}}>
                            {group.items.length} lịch
                          </span>
                        </div>
                        <div className={styles.tagContainer}>
                          {group.items.map(item => (
                            <div 
                              key={item.id} 
                              className={styles.tag} 
                              onClick={() => handleRemoveItem(item.id)}
                              title="Nhấn để xóa ngày này"
                            >
                              <Calendar size={12} />
                              {new Date(item.date).toLocaleDateString('vi-VN')}
                              <X size={12} className={styles.removeTag}/>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          )}

          <div className={styles.row2} style={{marginTop: '1.25rem'}}>
            <div className={styles.formGroup}>
              <label>Đơn tối thiểu</label>
              <input type="number" value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Giới hạn dùng</label>
              <input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày bắt đầu</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày kết thúc</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className={styles.notificationOption}>
            <label>
              <input 
                type="checkbox" 
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
              />
              <div className={styles.notifContent}>
                <strong><BellRing size={16} /> Gửi thông báo đến người dùng</strong>
                <span>
                  {formData.sendNotification 
                    ? "Hệ thống sẽ gửi thông báo đẩy (Notification) ngay sau khi lưu." 
                    : "Chỉ lưu coupon, không làm phiền người dùng."}
                </span>
              </div>
            </label>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Hủy bỏ</button>
            <button type="submit" className={styles.btnSubmit}>
              {editingCoupon ? 'Cập nhật' : 'Tạo Coupon'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default CouponModal;
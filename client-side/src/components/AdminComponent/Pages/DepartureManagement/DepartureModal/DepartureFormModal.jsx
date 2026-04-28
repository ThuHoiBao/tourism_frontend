import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Plane, Save, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './DepartureFormModal.module.scss';

const DepartureFormModal = ({ departure, locations, onClose, onSuccess }) => {
  console.log('locations ',  locations);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState([]);
  const [policies, setPolicies] = useState([]);

  // Passenger type mapping
  const PASSENGER_TYPES = {
    ADULT: { label: 'Người lớn', description: 'Từ 12 tuổi' },
    CHILD: { label: 'Trẻ em', description: 'Từ 5-11 tuổi' },
    INFANT: { label: 'Trẻ nhỏ', description: 'Dưới 5 tuổi' },
    SINGLE_SUPPLEMENT: { label: 'Phòng đơn', description: 'Phòng đơn' }
  };

  // Form data
  const [formData, setFormData] = useState({
    tourId: '',
    departureDate: '',
    availableSlots: '',
    status: true,
    tourGuideInfo: '',
    policyTemplateId: '',
    couponCode: ''
  });

  const [pricings, setPricings] = useState([
    { passengerType: 'ADULT', originalPrice: '', salePrice: '' },
    { passengerType: 'CHILD', originalPrice: '', salePrice: '' },
    { passengerType: 'INFANT', originalPrice: '', salePrice: '' },
    { passengerType: 'SINGLE_SUPPLEMENT', originalPrice: '', salePrice: '' }
  ]);

  const [outboundTransport, setOutboundTransport] = useState({
    type: 'OUTBOUND',
    vehicleType: 'PLANE',
    transportCode: '',
    vehicleName: '',
    startPoint: '',
    endPoint: '',
    departTime: '',
    arrivalTime: ''
  });

  const [inboundTransport, setInboundTransport] = useState({
    type: 'INBOUND',
    vehicleType: 'PLANE',
    transportCode: '',
    vehicleName: '',
    startPoint: '',
    endPoint: '',
    departTime: '',
    arrivalTime: ''
  });

  useEffect(() => {
    fetchTours();
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (departure) {
      console.log('Filling form with departure data:', departure);
      
      // Fill basic info
      setFormData({
        tourId: departure.tourId || '',
        departureDate: departure.departureDate ? departure.departureDate.slice(0, 16) : '',
        availableSlots: departure.availableSlots || '',
        status: departure.status !== undefined ? departure.status : true,
        tourGuideInfo: departure.tourGuideInfo || '',
        policyTemplateId: departure.policyTemplateId || '',
        couponCode: departure.couponCode || ''
      });

      // Fill pricings - merge with existing passenger types
      if (departure.pricings && departure.pricings.length > 0) {
        const defaultPricings = [
          { passengerType: 'ADULT', originalPrice: '', salePrice: '' },
          { passengerType: 'CHILD', originalPrice: '', salePrice: '' },
          { passengerType: 'INFANT', originalPrice: '', salePrice: '' },
          { passengerType: 'SINGLE_SUPPLEMENT', originalPrice: '', salePrice: '' }
        ];

        const mergedPricings = defaultPricings.map(defaultPricing => {
          const existingPricing = departure.pricings.find(
            p => p.passengerType === defaultPricing.passengerType
          );
          
          if (existingPricing) {
            return {
              passengerType: existingPricing.passengerType,
              originalPrice: existingPricing.originalPrice || '',
              salePrice: existingPricing.salePrice || ''
            };
          }
          
          return defaultPricing;
        });

        setPricings(mergedPricings);
      }

      // Fill outbound transport
      if (departure.outboundTransport) {
        setOutboundTransport({
          type: 'OUTBOUND',
          vehicleType: departure.outboundTransport.vehicleType || 'PLANE',
          transportCode: departure.outboundTransport.transportCode || '',
          vehicleName: departure.outboundTransport.vehicleName || '',
          startPoint: departure.outboundTransport.startPoint || '',
          endPoint: departure.outboundTransport.endPoint || '',
          departTime: departure.outboundTransport.departTime ? departure.outboundTransport.departTime.slice(0, 16) : '',
          arrivalTime: departure.outboundTransport.arrivalTime ? departure.outboundTransport.arrivalTime.slice(0, 16) : ''
        });
      }

      // Fill inbound transport
      if (departure.inboundTransport) {
        setInboundTransport({
          type: 'INBOUND',
          vehicleType: departure.inboundTransport.vehicleType || 'PLANE',
          transportCode: departure.inboundTransport.transportCode || '',
          vehicleName: departure.inboundTransport.vehicleName || '',
          startPoint: departure.inboundTransport.startPoint || '',
          endPoint: departure.inboundTransport.endPoint || '',
          departTime: departure.inboundTransport.departTime ? departure.inboundTransport.departTime.slice(0, 16) : '',
          arrivalTime: departure.inboundTransport.arrivalTime ? departure.inboundTransport.arrivalTime.slice(0, 16) : ''
        });
      }
    }
  }, [departure]);

  const fetchTours = async () => {
    try {
      const response = await axios.get('/admin/tours', {
        params: {
          page: 0,
          size: 1000 
        }
      });
      
      if (response.data.success) {
        const tourData = response.data.data?.content || response.data.data || [];
        setTours(tourData);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error('Không thể tải danh sách tour');
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get('/admin/policy-templates');
      console.log('Policy Template', response.data);
      setPolicies(response.data.content || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Không thể tải danh sách chính sách');
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and filter pricing - only include items with both prices filled
      const validPricings = pricings.filter(p => p.originalPrice && p.salePrice);
      
      for (const pricing of validPricings) {
        if (parseFloat(pricing.salePrice) > parseFloat(pricing.originalPrice)) {
          const typeInfo = PASSENGER_TYPES[pricing.passengerType];
          toast.error(`Giá bán của ${typeInfo.label} không được lớn hơn giá gốc!`);
          setLoading(false);
          return;
        }
      }

      // Format pricings to send only passengerType, originalPrice, salePrice
      const formattedPricings = validPricings.map(p => ({
        passengerType: p.passengerType,
        originalPrice: parseFloat(p.originalPrice),
        salePrice: parseFloat(p.salePrice)
      }));

   const formatDateTimeForBackend = (dateString) => {
      if (!dateString) return null;
      let formatted = dateString.replace(' ', 'T');
      if (formatted.split(':').length === 2) {
        formatted += ':00'; 
      }
      return formatted;
    };
      let processedOutbound = null;
      if (outboundTransport.transportCode) {
        processedOutbound = {
          ...outboundTransport,
          departTime: formatDateTimeForBackend(outboundTransport.departTime),
          arrivalTime: formatDateTimeForBackend(outboundTransport.arrivalTime)
        };
      }

      let processedInbound = null;
      if (inboundTransport.transportCode) {
        processedInbound = {
          ...inboundTransport,
          departTime: formatDateTimeForBackend(inboundTransport.departTime),
          arrivalTime: formatDateTimeForBackend(inboundTransport.arrivalTime)
        };
      }

      const payload = {
        ...formData,
        departureDate: formatDateTimeForBackend(formData.departureDate),
        tourId: formData.tourId ? parseInt(formData.tourId) : null,
        policyTemplateId: formData.policyTemplateId ? parseInt(formData.policyTemplateId) : null,
        availableSlots: parseInt(formData.availableSlots),
        pricings: formattedPricings,
        outboundTransport: processedOutbound, 
        inboundTransport: processedInbound    
      };

      console.log('Submitting payload:', payload);

      let response;
      if (departure) {
        response = await axios.put(`/admin/departures/${departure.departureID}`, payload);
      } else {
        response = await axios.post('/admin/departures', payload);
      }

      if (response.data.success) {
        toast.success(departure ? 'Cập nhật lịch khởi hành thành công!' : 'Tạo lịch khởi hành thành công!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingChange = (index, field, value) => {
    const newPricings = [...pricings];
    newPricings[index][field] = value;
    setPricings(newPricings);
  };

  const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || originalPrice === 0) return { amount: 0, percent: 0 };
    const amount = originalPrice - (salePrice || 0);
    const percent = ((amount / originalPrice) * 100).toFixed(1);
    return { amount, percent };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const goToTab = (direction) => {
    const tabs = ['basic', 'pricing', 'transport'];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < tabs.length) {
      setActiveTab(tabs[newIndex]);
    }
  };


  const renderPointInput = (transportType, field, value, onChange) => {
  const isPlane = transportType === 'PLANE';

  if (isPlane) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Chọn sân bay --</option>
        {locations.map(loc => (
          <option key={loc.locationID || loc.airportCode} value={loc.airportCode}>
            {loc.airportName} ({loc.airportCode})
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field === 'startPoint' ? "VD: Bến xe Miền Đông" : "VD: Điểm hẹn trung tâm"}
    />
  );
};

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>{departure ? 'Chỉnh Sửa Lịch Khởi Hành' : 'Tạo Lịch Khởi Hành Mới'}</h2>
            <p className={styles.subtitle}>
              {departure ? `ID: ${departure.departureID} - Cập nhật thông tin cho từng tab` : 'Điền đầy đủ thông tin cho lịch khởi hành'}
            </p>
          </div>
          <button onClick={onClose} className={styles.btnClose} type="button">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id: 'basic', label: 'Thông tin cơ bản', icon: Info },
            { id: 'pricing', label: 'Bảng giá', icon: DollarSign },
            { id: 'transport', label: 'Vận chuyển', icon: Plane }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.content}>
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className={styles.tabContent}>
                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label>
                      Tour <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.tourId}
                      onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn tour --</option>
                      {tours.map(tour => (
                        <option key={tour.tourID} value={tour.tourID}>
                          {tour.tourCode} - {tour.tourName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Ngày khởi hành <span className={styles.required}>*</span>
                    </label>
                 <input
                    type="datetime-local"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    required
                  />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Số chỗ trống <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.availableSlots}
                      onChange={(e) => setFormData({ ...formData, availableSlots: e.target.value })}
                      required
                      min="1"
                      placeholder="Nhập số chỗ"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chính sách</label>
                    <select
                      value={formData.policyTemplateId}
                      onChange={(e) => setFormData({ ...formData, policyTemplateId: e.target.value })}
                    >
                      <option value="">-- Chọn chính sách --</option>
                      {policies.map(policy => (
                        <option key={policy.policyTemplateID} value={policy.policyTemplateID}>
                          {policy.templateName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Thông tin hướng dẫn viên</label>
                  <textarea
                    value={formData.tourGuideInfo}
                    onChange={(e) => setFormData({ ...formData, tourGuideInfo: e.target.value })}
                    rows={4}
                    placeholder="Thông tin về hướng dẫn viên..."
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  />
                  <label htmlFor="status">Kích hoạt lịch khởi hành này</label>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className={styles.tabContent}>
                <div className={styles.alert}>
                  <strong>Lưu ý:</strong> Giá bán phải nhỏ hơn hoặc bằng giá gốc
                </div>

                <div className={styles.pricingList}>
                  {pricings.map((pricing, index) => {
                    const typeInfo = PASSENGER_TYPES[pricing.passengerType];
                    const discount = calculateDiscount(pricing.originalPrice, pricing.salePrice);
                    const isValid = !pricing.salePrice || !pricing.originalPrice || 
                                    parseFloat(pricing.salePrice) <= parseFloat(pricing.originalPrice);
                    
                    return (
                      <div key={pricing.passengerType} className={styles.pricingCard}>
                        <div className={styles.pricingHeader}>
                          <h4>{typeInfo.label}</h4>
                          <p>{typeInfo.description}</p>
                        </div>

                        <div className={styles.grid2}>
                          <div className={styles.formGroup}>
                            <label>Giá gốc (VNĐ)</label>
                            <input
                              type="number"
                              value={pricing.originalPrice}
                              onChange={(e) => handlePricingChange(index, 'originalPrice', e.target.value)}
                              placeholder="0"
                              min="0"
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>Giá bán (VNĐ)</label>
                            <input
                              type="number"
                              value={pricing.salePrice}
                              onChange={(e) => handlePricingChange(index, 'salePrice', e.target.value)}
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        </div>

                        {pricing.originalPrice && pricing.salePrice && (
                          <div className={`${styles.discountInfo} ${isValid ? styles.valid : styles.invalid}`}>
                            {isValid ? (
                              <>
                                Giảm: {formatPrice(discount.amount)} VNĐ ({discount.percent}%)
                              </>
                            ) : (
                              'Giá bán không được lớn hơn giá gốc!'
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transport Tab */}
            {activeTab === 'transport' && (
              <div className={styles.tabContent}>
                {/* Outbound */}
                <div className={styles.transportSection}>
                  <div className={styles.transportHeader}>
                    <Plane size={20} className={styles.iconOutbound} />
                    <h3>Vận chuyển chiều đi</h3>
                  </div>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label>Loại phương tiện</label>
                      <select
                        value={outboundTransport.vehicleType}
                        onChange={(e) => setOutboundTransport({ ...outboundTransport, vehicleType: e.target.value })}
                      >
                        <option value="PLANE">Máy bay</option>
                        <option value="BUS">Xe khách</option>
                        <option value="TRAIN">Tàu hỏa</option>
                        <option value="CAR">Xe du lịch</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mã chuyến</label>
                      <input
                        type="text"
                        value={outboundTransport.transportCode}
                        onChange={(e) => setOutboundTransport({ ...outboundTransport, transportCode: e.target.value })}
                        placeholder="VD: VN123"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tên phương tiện</label>
                      <input
                        type="text"
                        value={outboundTransport.vehicleName}
                        onChange={(e) => setOutboundTransport({ ...outboundTransport, vehicleName: e.target.value })}
                        placeholder="VD: Máy bay Boeing 787"
                      />
                    </div>

                   <div className={styles.formGroup}>
                      <label>Điểm đi</label>
                      {renderPointInput(
                        outboundTransport.vehicleType, 
                        'startPoint', 
                        outboundTransport.startPoint, 
                        (val) => setOutboundTransport({ ...outboundTransport, startPoint: val })
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Điểm đến</label>
                      {renderPointInput(
                        outboundTransport.vehicleType, 
                        'endPoint', 
                        outboundTransport.endPoint, 
                        (val) => setOutboundTransport({ ...outboundTransport, endPoint: val })
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Thời gian khởi hành</label>
                      <input
                        type="datetime-local"
                        value={outboundTransport.departTime}
                        onChange={(e) => setOutboundTransport({ ...outboundTransport, departTime: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Thời gian đến</label>
                      <input
                        type="datetime-local"
                        value={outboundTransport.arrivalTime}
                        onChange={(e) => setOutboundTransport({ ...outboundTransport, arrivalTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Inbound */}
                <div className={styles.transportSection}>
                  <div className={styles.transportHeader}>
                    <Plane size={20} className={styles.iconInbound} />
                    <h3>Vận chuyển chiều về</h3>
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label>Loại phương tiện</label>
                      <select
                        value={inboundTransport.vehicleType}
                        onChange={(e) => setInboundTransport({ ...inboundTransport, vehicleType: e.target.value })}
                      >
                        <option value="PLANE">Máy bay</option>
                        <option value="BUS">Xe khách</option>
                        <option value="TRAIN">Tàu hỏa</option>
                        <option value="CAR">Xe du lịch</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mã chuyến</label>
                      <input
                        type="text"
                        value={inboundTransport.transportCode}
                        onChange={(e) => setInboundTransport({ ...inboundTransport, transportCode: e.target.value })}
                        placeholder="VD: VN456"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tên phương tiện</label>
                      <input
                        type="text"
                        value={inboundTransport.vehicleName}
                        onChange={(e) => setInboundTransport({ ...inboundTransport, vehicleName: e.target.value })}
                        placeholder="VD: Máy bay Boeing 787"
                      />
                    </div>

                   <div className={styles.formGroup}>
                      <label>Điểm đi</label>
                      {renderPointInput(
                        inboundTransport.vehicleType, 
                        'startPoint', 
                        inboundTransport.startPoint, 
                        (val) => setInboundTransport({ ...inboundTransport, startPoint: val })
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Điểm đến</label>
                      {renderPointInput(
                        inboundTransport.vehicleType, 
                        'endPoint', 
                        inboundTransport.endPoint, 
                        (val) => setInboundTransport({ ...inboundTransport, endPoint: val })
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Thời gian khởi hành</label>
                      <input
                        type="datetime-local"
                        value={inboundTransport.departTime}
                        onChange={(e) => setInboundTransport({ ...inboundTransport, departTime: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Thời gian đến</label>
                      <input
                        type="datetime-local"
                        value={inboundTransport.arrivalTime}
                        onChange={(e) => setInboundTransport({ ...inboundTransport, arrivalTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.navButtons}>
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => goToTab('prev')}
                  className={styles.btnNav}
                >
                  <ChevronLeft size={18} />
                  Quay lại
                </button>
              )}
              
              {activeTab !== 'transport' && (
                <button
                  type="button"
                  onClick={() => goToTab('next')}
                  className={styles.btnNav}
                >
                  Tiếp theo
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={styles.btnCancel}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className={styles.btnSubmit}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {departure ? 'Cập nhật' : 'Tạo mới'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartureFormModal;
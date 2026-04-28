import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Image, Calendar, Loader, Check } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './TourForm.module.scss';
import GeneralInfoTab from './GeneralInfoTab';
import GalleryTab from './GalleryTab';
import ItineraryTab from './ItineraryTab';

const TourForm = ({ tourId, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentTourId, setCurrentTourId] = useState(tourId);
  
  const [formData, setFormData] = useState({
    tourName: '',
    tourCode: '',
    duration: '',
    transportation: '',
    startLocationId: '',
    endLocationId: '',
    attractions: '',
    meals: '',
    idealTime: '',
    tripTransportation: '',
    suitableCustomer: '',
    hotel: '',
    status: true
  });

  const [images, setImages] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [errors, setErrors] = useState({});

  const [savedTabs, setSavedTabs] = useState({
    general: false,
    gallery: false,
    itinerary: false
  });

  const sanitizeHTML = (html) => {
  if (!html) return '';
  
  let cleaned = html
    .replace(/(<br\s*\/?>){2,}/gi, '<br>')
    .replace(/^(<br\s*\/?>)+/gi, '')
    .replace(/(<br\s*\/?>)+$/gi, '')
    .replace(/(<br\s*\/?>)+(<\/(p|ul|ol|h[1-6]|div)>)/gi, '$2')
    .replace(/(<br\s*\/?>)+(<(p|ul|ol|h[1-6]|div))/gi, '$2')
    .replace(/\s+/g, ' ')
    .replace(/<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/\s*style="[^"]*"/gi, '')
    .trim();
  
  return cleaned;
};

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (currentTourId && locations.length > 0) {
      loadTourData();
    }
  }, [currentTourId, locations]);

  const loadLocations = async () => {
    try {
      const response = await axios.get('/admin/tours/locations');
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Không thể tải danh sách địa điểm');
    }
  };

  const loadTourData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/tours/${currentTourId}`);
      if (response.data.success) {
        const tour = response.data.data;
        
        setFormData({
          tourName: tour.tourName || '',
          tourCode: tour.tourCode || '',
          duration: tour.duration || '',
          transportation: tour.transportation || '',
          startLocationId: tour.startLocationId ? String(tour.startLocationId) : '',
          endLocationId: tour.endLocationId ? String(tour.endLocationId) : '',
          attractions: tour.attractions || '',
          meals: tour.meals || '',
          idealTime: tour.idealTime || '',
          tripTransportation: tour.tripTransportation || '',
          suitableCustomer: tour.suitableCustomer || '',
          hotel: tour.hotel || '',
          status: tour.status ?? true
        });

        setImages(tour.images || []);
        setMediaList(tour.mediaList || []);
        
        // FIX: Sort itinerary by dayNumber và đảm bảo không duplicate
        const sortedItinerary = (tour.itineraryDays || [])
          .sort((a, b) => a.dayNumber - b.dayNumber)
          // Remove duplicates based on itineraryDayID
          .filter((day, index, self) => 
            index === self.findIndex(d => d.itineraryDayID === day.itineraryDayID)
          );
        
        setItineraryDays(sortedItinerary);

        setSavedTabs({
          general: true,
          gallery: true,
          itinerary: true
        });
      }
    } catch (error) {
      console.error('Error loading tour:', error);
      toast.error('Không thể tải thông tin tour');
    } finally {
      setLoading(false);
    }
  };

  const validateGeneralInfo = () => {
    const newErrors = {};
    
    if (!formData.tourName.trim()) newErrors.tourName = 'Tên tour không được để trống';
    if (!formData.tourCode.trim()) newErrors.tourCode = 'Mã tour không được để trống';
    if (!formData.duration.trim()) newErrors.duration = 'Thời gian không được để trống';
    if (!formData.transportation.trim()) newErrors.transportation = 'Phương tiện không được để trống';
    if (!formData.startLocationId) newErrors.startLocationId = 'Vui lòng chọn điểm khởi hành';
    if (!formData.endLocationId) newErrors.endLocationId = 'Vui lòng chọn điểm đến';
    if (!formData.attractions.trim()) newErrors.attractions = 'Điểm tham quan không được để trống';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveGeneralInfo = async () => {
    if (!validateGeneralInfo()) {
      toast.error('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startLocationId: Number(formData.startLocationId),
        endLocationId: Number(formData.endLocationId)
      };

      let response;
      if (currentTourId) {
        response = await axios.put(`/admin/tours/${currentTourId}/general-info`, payload);
        toast.success('Cập nhật thông tin chung thành công!');
      } else {
        response = await axios.post('/admin/tours', {
          generalInfo: payload,
          images: [],
          mediaList: [],
          itineraryDays: []
        });
        
        if (response.data.data && response.data.data.tourID) {
          setCurrentTourId(response.data.data.tourID);
          toast.success('Tạo tour thành công!');
          setActiveTab('gallery'); 
        }
      }

      if (response.data.success) {
        setSavedTabs(prev => ({ ...prev, general: true }));
        if (currentTourId) {
          await loadTourData();
        }
      }
    } catch (error) {
      console.error('Error saving general info:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra!';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const uploadImageFile = async (tourId, file, isMain) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isMain', isMain);

    const response = await axios.post(`/admin/tours/${tourId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.data;
  };

  const uploadVideoFile = async (tourId, file, title, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || '');
    formData.append('description', description || '');

    const response = await axios.post(`/admin/tours/${tourId}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.data;
  };

  const handleSaveGallery = async () => {
    if (!currentTourId) {
      toast.warning('Vui lòng lưu thông tin chung trước!');
      setActiveTab('general');
      return;
    }

    setSaving(true);
    try {
      const uploadedImages = [];
      const uploadedMedia = [];

      for (const image of images) {
        if (image.file) {
          const result = await uploadImageFile(currentTourId, image.file, image.isMainImage);
          uploadedImages.push(result);
          toast.info(`Đã upload: ${image.file.name}`);
        } else if (image.imageURL) {
          uploadedImages.push({
            imageURL: image.imageURL,
            isMainImage: image.isMainImage
          });
        }
      }

      for (const media of mediaList) {
        if (media.file) {
          const result = await uploadVideoFile(
            currentTourId, 
            media.file, 
            media.title, 
            media.description
          );
          uploadedMedia.push(result);
          toast.info(`Đã upload: ${media.file.name}`);
        } else if (media.mediaUrl) {
          uploadedMedia.push({
            mediaUrl: media.mediaUrl,
            thumbnailUrl: media.thumbnailUrl,
            title: media.title,
            description: media.description,
            isPrimary: media.isPrimary
          });
        }
      }

      toast.success('Lưu hình ảnh & media thành công!');
      setSavedTabs(prev => ({ ...prev, gallery: true }));
      await loadTourData();
    } catch (error) {
      console.error('Error saving gallery:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra!';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItinerary = async () => {
  if (!currentTourId) {
    toast.warning('Vui lòng lưu thông tin chung trước!');
    setActiveTab('general');
    return;
  }

  const validDays = itineraryDays
    .filter(day => {
      const sanitized = sanitizeHTML(day.details);
      const plainText = sanitized.replace(/<[^>]*>/g, '').trim();
      return day.title?.trim() && day.meals?.trim() && plainText;
    })
    .map((day, index) => ({
      dayNumber: index + 1,
      title: day.title.trim(),
      meals: day.meals.trim(),
      details: sanitizeHTML(day.details) 
    }));

  if (validDays.length === 0 && itineraryDays.length > 0) {
    toast.error('Vui lòng điền đầy đủ thông tin cho các ngày!');
    return;
  }

  setSaving(true);
  try {
    await axios.put(`/admin/tours/${currentTourId}/itinerary`, validDays);

    toast.success('Lưu lịch trình thành công!');
    setSavedTabs(prev => ({ ...prev, itinerary: true }));
    
    await loadTourData();
  } catch (error) {
    console.error('Error saving itinerary:', error);
    const msg = error.response?.data?.message || 'Có lỗi xảy ra!';
    toast.error(msg);
  } finally {
    setSaving(false);
  }
};

  const getSaveHandler = () => {
    switch (activeTab) {
      case 'general': return handleSaveGeneralInfo;
      case 'gallery': return handleSaveGallery;
      case 'itinerary': return handleSaveItinerary;
      default: return null;
    }
  };

  const handleSaveCurrentTab = () => {
    const handler = getSaveHandler();
    if (handler) handler();
  };

  const handleClose = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Building2 },
    { id: 'gallery', label: 'Hình ảnh & Media', icon: Image },
    { id: 'itinerary', label: 'Lịch trình', icon: Calendar }
  ];

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.loadingContainer}>
          <Loader className={styles.spinner} size={48} />
          <p>Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{currentTourId ? 'Chỉnh sửa Tour' : 'Tạo Tour Mới'}</h2>
            <p style={{ color: '#fff' }}>{formData.tourCode || 'Chưa có mã tour'}</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button">
            <X size={24} />
          </button>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSaved = savedTabs[tab.id];
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <Icon size={20} />
                {tab.label}
                {isSaved && currentTourId && (
                  <Check size={16} className={styles.checkIcon} />
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'general' && (
            <GeneralInfoTab
              formData={formData}
              setFormData={setFormData}
              locations={locations}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryTab
              images={images}
              setImages={setImages}
              mediaList={mediaList}
              setMediaList={setMediaList}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryTab
              itineraryDays={itineraryDays}
              setItineraryDays={setItineraryDays}
            />
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={handleClose}
            disabled={saving}
          >
            {currentTourId ? 'Đóng' : 'Hủy'}
          </button>
          <button
            type="button"
            className={styles.btnSubmit}
            onClick={handleSaveCurrentTab}
            disabled={saving || (activeTab !== 'general' && !currentTourId)}
          >
            {saving ? (
              <>
                <Loader className={styles.spinner} size={18} />
                {activeTab === 'gallery' ? 'Đang upload...' : 'Đang lưu...'}
              </>
            ) : (
              <>
                <Save size={18} />
                {!currentTourId ? 'Tạo tour' : `Lưu ${tabs.find(t => t.id === activeTab)?.label}`}
              </>
            )}
          </button>
        </div>

        {currentTourId && (
          <div className={styles.saveStatus}>
            <p className={styles.saveStatusTitle}>Trạng thái lưu:</p>
            <div className={styles.saveStatusList}>
              {tabs.map(tab => (
                <div key={tab.id} className={styles.saveStatusItem}>
                  {savedTabs[tab.id] ? (
                    <Check size={16} className={styles.checkIconGreen} />
                  ) : (
                    <div className={styles.unsavedDot} />
                  )}
                  <span>{tab.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourForm;
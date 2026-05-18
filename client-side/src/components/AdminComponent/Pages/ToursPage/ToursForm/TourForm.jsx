import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Image, Calendar, Loader, Check } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './TourForm.module.scss';
import GeneralInfoTab from './GeneralInfoTab';
import GalleryTab from './GalleryTab';
import ItineraryTab from './ItineraryTab';

const TourForm = ({ tourId, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentTourId, setCurrentTourId] = useState(tourId);

  const [formData, setFormData] = useState({
    tourName: '', tourCode: '', duration: '', transportation: '',
    startLocationId: '', endLocationId: '', attractions: '',
    meals: '', idealTime: '', tripTransportation: '',
    suitableCustomer: '', hotel: '', status: true
  });

  const [images, setImages] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [errors, setErrors] = useState({});
  const [savedTabs, setSavedTabs] = useState({ general: false, gallery: false, itinerary: false });

  useEffect(() => { loadLocations(); }, []);

  useEffect(() => {
    if (currentTourId && locations.length > 0) loadTourData();
  }, [currentTourId, locations]);

  const loadLocations = async () => {
    try {
      const res = await axios.get('/admin/tours/locations');
      if (res.data.success) setLocations(res.data.data);
    } catch {
      toast.error('Không thể tải địa điểm');
    }
  };

  const loadTourData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/tours/${currentTourId}`);
      if (res.data.success) {
        const tour = res.data.data;
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
        const sorted = (tour.itineraryDays || [])
          .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
        setItineraryDays(sorted);
        setSavedTabs({ general: true, gallery: true, itinerary: true });
      }
    } catch {
      toast.error('Không thể tải thông tin tour');
    } finally {
      setLoading(false);
    }
  };

  const validateGeneral = () => {
    const e = {};
    if (!formData.tourName.trim()) e.tourName = 'Tên tour không được để trống';
    if (!formData.tourCode.trim()) e.tourCode = 'Mã tour không được để trống';
    if (!formData.duration.trim()) e.duration = 'Thời gian không được để trống';
    if (!formData.transportation.trim()) e.transportation = 'Phương tiện không được để trống';
    if (!formData.startLocationId) e.startLocationId = 'Chọn điểm khởi hành';
    if (!formData.endLocationId) e.endLocationId = 'Chọn điểm đến';
    if (!formData.attractions.trim()) e.attractions = 'Điểm tham quan không được để trống';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveGeneralInfo = async () => {
    if (!validateGeneral()) { toast.error('Vui lòng kiểm tra lại thông tin!'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        startLocationId: Number(formData.startLocationId),
        endLocationId: Number(formData.endLocationId)
      };

      let res;
      if (currentTourId) {
        res = await axios.put(`/admin/tours/${currentTourId}/general-info`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        res = await axios.post('/admin/tours', { generalInfo: payload, itineraryDays: [] });
        if (res.data.data?.tourID) {
          setCurrentTourId(res.data.data.tourID);
          toast.success('Tạo tour thành công!');
          setActiveTab('gallery');
        }
      }
      if (res.data.success) {
        setSavedTabs(p => ({ ...p, general: true }));
        if (currentTourId) await loadTourData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGallery = async () => {
    if (!currentTourId) { toast.warning('Lưu thông tin chung trước!'); setActiveTab('general'); return; }
    setSaving(true);
    try {
      for (const img of images) {
        if (img._file) {
          const fd = new FormData();
          fd.append('file', img._file);
          fd.append('isMain', img.isMainImage ? 'true' : 'false');
          await axios.post(`/admin/tours/${currentTourId}/upload-image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.info(`Đã upload: ${img._file.name}`);
        }
      }
      for (const media of mediaList) {
        if (media._file) {
          const fd = new FormData();
          fd.append('file', media._file);
          fd.append('mediaType', media.mediaType || 'video');
          await axios.post(`/admin/tours/${currentTourId}/upload-media`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.info(`Đã upload: ${media._file.name}`);
        }
      }
      toast.success('Lưu hình ảnh & media thành công!');
      setSavedTabs(p => ({ ...p, gallery: true }));
      await loadTourData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html
      .replace(/(<br\s*\/?>){2,}/gi, '<br>')
      .replace(/^(<br\s*\/?>)+/gi, '')
      .replace(/(<br\s*\/?>)+$/gi, '')
      .replace(/<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/\s*style="[^"]*"/gi, '')
      .trim();
  };

  const handleSaveItinerary = async () => {
    if (!currentTourId) { toast.warning('Lưu thông tin chung trước!'); setActiveTab('general'); return; }
    const validDays = itineraryDays
      .filter(d => {
        const plain = sanitizeHTML(d.details || '').replace(/<[^>]*>/g, '').trim();
        return d.title?.trim() && d.meals?.trim() && plain;
      })
      .map((d, i) => ({
        dayNumber: i + 1,
        title: d.title.trim(),
        meals: d.meals.trim(),
        details: sanitizeHTML(d.details)
      }));

    if (validDays.length === 0 && itineraryDays.length > 0) {
      toast.error('Vui lòng điền đầy đủ thông tin các ngày!');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`/admin/tours/${currentTourId}/itinerary`, validDays);
      toast.success('Lưu lịch trình thành công!');
      setSavedTabs(p => ({ ...p, itinerary: true }));
      await loadTourData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const getSaveHandler = () => {
    if (activeTab === 'general') return handleSaveGeneralInfo;
    if (activeTab === 'gallery') return handleSaveGallery;
    if (activeTab === 'itinerary') return handleSaveItinerary;
    return null;
  };

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Building2 },
    { id: 'gallery', label: 'Hình ảnh & Media', icon: Image },
    { id: 'itinerary', label: 'Lịch trình', icon: Calendar }
  ];

  if (loading) return (
    <div className={styles.modalOverlay}>
      <div className={styles.loadingBox}>
        <Loader className={styles.spinnerIcon} size={40} />
        <p>Đang tải thông tin tour...</p>
      </div>
    </div>
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{currentTourId ? 'Chỉnh sửa Tour' : 'Tạo Tour Mới'}</h2>
            <p>{formData.tourCode || 'Chưa có mã tour'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={22} />
          </button>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}>
                <Icon size={18} />
                {tab.label}
                {savedTabs[tab.id] && currentTourId && <Check size={14} className={styles.checkIcon} />}
              </button>
            );
          })}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'general' && (
            <GeneralInfoTab formData={formData} setFormData={setFormData}
              locations={locations} errors={errors} setErrors={setErrors} />
          )}
          {activeTab === 'gallery' && (
            <GalleryTab tourId={currentTourId} images={images} setImages={setImages}
              mediaList={mediaList} setMediaList={setMediaList} />
          )}
          {activeTab === 'itinerary' && (
            <ItineraryTab itineraryDays={itineraryDays} setItineraryDays={setItineraryDays} />
          )}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnCancel} onClick={onClose} disabled={saving}>
            {currentTourId ? 'Đóng' : 'Hủy'}
          </button>
          <button type="button" className={styles.btnSubmit}
            onClick={() => getSaveHandler()?.()}
            disabled={saving || (activeTab !== 'general' && !currentTourId)}>
            {saving ? (
              <><Loader className={styles.spinnerIcon} size={16} />
                {activeTab === 'gallery' ? 'Đang upload...' : 'Đang lưu...'}</>
            ) : (
              <><Save size={16} />
                {!currentTourId ? 'Tạo tour' : `Lưu ${tabs.find(t => t.id === activeTab)?.label}`}</>
            )}
          </button>
        </div>

        {currentTourId && (
          <div className={styles.saveStatus}>
            {tabs.map(tab => (
              <div key={tab.id} className={styles.saveStatusItem}>
                {savedTabs[tab.id]
                  ? <Check size={14} className={styles.checkGreen} />
                  : <div className={styles.dotGray} />}
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourForm;

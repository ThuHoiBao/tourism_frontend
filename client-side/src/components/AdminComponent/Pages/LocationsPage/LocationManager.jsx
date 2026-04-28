import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, X, Upload, Image as ImageIcon} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import './LocationManager.scss';

// Vietnam Airport Database
const AIRPORTS = {
  'hà nội': { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài' },
  'đà nẵng': { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng' },
  'hồ chí minh': { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất' },
  'nha trang': { code: 'CXR', name: 'Sân bay Quốc tế Cam Ranh' },
  'phú quốc': { code: 'PQC', name: 'Sân bay Quốc tế Phú Quốc' },
  'đà lạt': { code: 'DLI', name: 'Sân bay Liên Khương' },
  'cần thơ': { code: 'VCA', name: 'Sân bay Quốc tế Cần Thơ' },
  'huế': { code: 'HUI', name: 'Sân bay Quốc tế Phú Bài' },
  'hải phòng': { code: 'HPH', name: 'Sân bay Quốc tế Cát Bi' },
  'vinh': { code: 'VII', name: 'Sân bay Quốc tế Vinh' }
};

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    region: 'NORTH',
    description: '',
    airportCode: '',
    airportName: '',
    image: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch locations
  useEffect(() => {
    fetchLocations();
  }, [page, searchTerm, regionFilter]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/locations', {
        params: {
          page,
          size: 10,
          search: searchTerm,
          region: regionFilter,
          sortBy: 'updatedAt',
          sortDir: 'DESC'
        }
      });
      
      setLocations(response.data.content || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Không thể tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle name change - auto-fill
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    
    setFormData(prev => {
      const newData = { ...prev, name, slug };
      
      // Auto-fill airport
      if (!prev.airportCode || !prev.airportName) {
        const normalized = name.toLowerCase().trim();
        const airport = AIRPORTS[normalized];
        if (airport) {
          newData.airportCode = airport.code;
          newData.airportName = airport.name;
        }
      }
      
      return newData;
    });
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal handlers
  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      slug: '',
      region: 'NORTH',
      description: '',
      airportCode: '',
      airportName: '',
      image: ''
    });
    setImageFile(null);
    setImagePreview('');
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
    setImagePreview(location.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.region) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    setLoading(true);
    try {
      let locationId = editingLocation?.locationID;
      
      // Create or update location
      if (editingLocation) {
        await axios.put(`/admin/locations/${locationId}`, formData);
        toast.success('Cập nhật địa điểm thành công');
      } else {
        const response = await axios.post('/admin/locations', formData);
        locationId = response.data?.locationID || response.locationID;
        toast.success('Tạo địa điểm thành công');
      }
      
      // Upload image if exists
      if (imageFile && locationId) {
        const formDataImg = new FormData();
        formDataImg.append('file', imageFile);
        await axios.post(`/admin/locations/${locationId}/image`, formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowModal(false);
      fetchLocations();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Delete location
  const handleDelete = async (location) => {
    if (!window.confirm(`Xóa địa điểm "${location.name}"?`)) return;
    
    try {
      await axios.delete(`/admin/locations/${location.locationID}`);
      toast.success('Xóa địa điểm thành công');
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa địa điểm');
    }
  };

  // Get region badge
  const getRegionBadge = (region) => {
    const badges = {
      NORTH: { label: 'Miền Bắc', class: 'badge-north' },
      CENTRAL: { label: 'Miền Trung', class: 'badge-central' },
      SOUTH: { label: 'Miền Nam', class: 'badge-south' }
    };
    return badges[region] || { label: region, class: '' };
  };

  return (
    <div className="location-manager">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1>
            <MapPin size={28} />
            Quản lý Địa điểm
          </h1>
          <p>Quản lý tỉnh/thành phố và thông tin sân bay</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} />
          Thêm địa điểm
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>
        
        <div className="filter-group">
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setPage(0);
            }}
            className="filter-select"
          >
            <option value="">Tất cả khu vực</option>
            <option value="NORTH">Miền Bắc</option>
            <option value="CENTRAL">Miền Trung</option>
            <option value="SOUTH">Miền Nam</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Hình ảnh</th>
              <th style={{ width: '200px' }}>Tên địa điểm</th>
              <th style={{ width: '200px' }}>Khu vực</th>
              <th style={{ width: '300px' }}>Mô tả</th>
              <th style={{ width: '200px', textAlign: 'center' }}>Tours</th>
            
              <th style={{ width: '140px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.locationID}>
                  <td>
                    <img
                      src={location.image || 'https://placehold.co/60x60?text=No+Image'}
                      alt={location.name}
                      className="location-image"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/60x60?text=Error';
                      }}
                    />
                  </td>
                  <td>
                    <div className="location-name">{location.name}</div>
                    <div className="location-slug">{location.slug}</div>
                  </td>
                  <td>
                    <span className={`badge ${getRegionBadge(location.region).class}`}>
                      {getRegionBadge(location.region).label}
                    </span>
                  </td>
                  <td>
                    <div className="description-cell">
                      {location.description ? (
                        location.description.length > 80 
                          ? location.description.substring(0, 80) + '...' 
                          : location.description
                      ) : (
                        <span style={{ color: '#999' }}>Chưa có mô tả</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="tour-stats">
                      <div className="tour-stat">
                        <span style={{ marginLeft: '10px' }} className="tour-label">Đi:</span>
                        <span className="tour-count">{location.toursAsStartPoint || 0}</span>
                      </div>
                      <div className="tour-stat">
                        <span className="tour-label">Đến:</span>
                        <span className="tour-count">{location.toursAsEndPoint || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(location)}
                      title="Sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(location)}
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
       {totalPages > 1 && (
            <div className="pagination">
                <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="pagination-btn"
                title="Trang trước"
                >
                <FaChevronLeft />
                </button>

                <span className="pagination-info">
                Trang {page + 1} / {totalPages}
                <span className="total"> (Tổng {totalElements} địa điểm)</span>
                </span>

                <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="pagination-btn"
                title="Trang sau"
                >
                <FaChevronRight />
                </button>
            </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLocation ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Hình ảnh</label>
                <div className="upload-area">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="btn-change-image"
                        onClick={() => document.getElementById('image-input').click()}
                      >
                        Thay đổi ảnh
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-placeholder"
                      onClick={() => document.getElementById('image-input').click()}
                    >
                      <ImageIcon size={48} />
                      <p>Click để chọn ảnh</p>
                      <span>JPG, PNG - Tối đa 5MB</span>
                    </div>
                  )}
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Tên địa điểm <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Ví dụ: Đà Nẵng, Hà Nội..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Slug <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="da-nang, ha-noi..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Khu vực <span className="required">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                >
                  <option value="NORTH">Miền Bắc</option>
                  <option value="CENTRAL">Miền Trung</option>
                  <option value="SOUTH">Miền Nam</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn về địa điểm..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : editingLocation ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
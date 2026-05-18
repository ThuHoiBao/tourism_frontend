import React, { useEffect } from 'react';
import { Plus, Trash2, Star, Image, Video, Upload, Grid } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './TabStyles.module.scss';

const GalleryTab = ({ tourId, images, setImages, mediaList, setMediaList }) => {

  useEffect(() => {
    return () => {
      images.forEach(img => { if (img._previewUrl) URL.revokeObjectURL(img._previewUrl); });
      mediaList.forEach(m => { if (m._previewUrl) URL.revokeObjectURL(m._previewUrl); });
    };
  }, []);

  // ── IMAGES ──────────────────────────────────────────────────────────────

  const handleMultipleImageUpload = (files) => {
    const fileArray = Array.from(files);
    const newImages = [];
    fileArray.forEach((file, idx) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Kích thước quá lớn (tối đa 5MB)`);
        return;
      }
      newImages.push({
        _file: file,
        _previewUrl: URL.createObjectURL(file),
        imageUrl: '',
        isMainImage: images.length === 0 && idx === 0
      });
    });
    if (newImages.length > 0) {
      setImages([...images, ...newImages]);
      toast.success(`Đã thêm ${newImages.length} ảnh`);
    }
  };

  const handleSingleImageAdd = () => {
    setImages([...images, { _file: null, _previewUrl: null, imageUrl: '', isMainImage: images.length === 0 }]);
  };

  const handleSetMainImage = (index) => {
    setImages(images.map((img, i) => ({ ...img, isMainImage: i === index })));
  };

  const handleImageFileChange = (index, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Kích thước file quá lớn (tối đa 5MB)'); return; }
    const old = images[index];
    if (old._previewUrl) URL.revokeObjectURL(old._previewUrl);
    const updated = [...images];
    updated[index] = { ...old, _file: file, _previewUrl: URL.createObjectURL(file), imageUrl: '' };
    setImages(updated);
  };

  const handleRemoveImage = (index) => {
    const removed = images[index];
    if (removed._previewUrl) URL.revokeObjectURL(removed._previewUrl);
    const updated = images.filter((_, i) => i !== index);
    if (removed.isMainImage && updated.length > 0) updated[0].isMainImage = true;
    setImages(updated);
  };

  // ── MEDIA ────────────────────────────────────────────────────────────────

  const handleAddMedia = () => {
    setMediaList([...mediaList, { _file: null, _previewUrl: null, mediaUrl: '', mediaType: 'video' }]);
  };

  const handleMediaFileChange = (index, file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error('Kích thước file quá lớn (tối đa 100MB)'); return; }
    const old = mediaList[index];
    if (old._previewUrl) URL.revokeObjectURL(old._previewUrl);
    const updated = [...mediaList];
    updated[index] = { ...old, _file: file, _previewUrl: URL.createObjectURL(file), mediaUrl: '' };
    setMediaList(updated);
  };

  const handleRemoveMedia = (index) => {
    const removed = mediaList[index];
    if (removed._previewUrl) URL.revokeObjectURL(removed._previewUrl);
    setMediaList(mediaList.filter((_, i) => i !== index));
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.tabContainer}>

      {/* IMAGES */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Bộ sưu tập hình ảnh</h3>
          <div className={styles.headerActions}>
            <label className={styles.btnAdd} style={{ cursor: 'pointer' }}>
              <Grid size={16} />
              <span>Upload nhiều ảnh</span>
              <input type="file" accept="image/*" multiple
                onChange={e => handleMultipleImageUpload(e.target.files)}
                style={{ display: 'none' }} />
            </label>
            <button className={styles.btnAdd} type="button" onClick={handleSingleImageAdd}>
              <Plus size={16} /> Thêm ảnh
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className={styles.emptyState}>
            <Image size={48} />
            <p>Chưa có hình ảnh nào</p>
            <label className={styles.btnPrimary} style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Chọn ảnh
              <input type="file" accept="image/*" multiple
                onChange={e => handleMultipleImageUpload(e.target.files)}
                style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <div className={styles.imageGrid}>
            {images.map((image, index) => {
              const src = image._previewUrl || image.imageUrl;
              return (
                <div key={index} className={styles.imageCard}>
                  <div className={styles.imageCardHeader}>
                    <span className={styles.imageBadge}>#{index + 1}</span>
                    <div className={styles.imageActions}>
                      <button type="button"
                        className={`${styles.btnIcon} ${image.isMainImage ? styles.active : ''}`}
                        onClick={() => handleSetMainImage(index)}
                        title={image.isMainImage ? 'Ảnh chính' : 'Đặt làm ảnh chính'}>
                        <Star size={16} />
                      </button>
                      <button type="button" className={styles.btnIconDelete}
                        onClick={() => handleRemoveImage(index)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.imagePreviewWrapper}>
                    {src
                      ? <img src={src} alt={`Preview ${index + 1}`} className={styles.imagePreview}
                          onError={e => { e.target.style.display = 'none'; }} />
                      : <div className={styles.imagePlaceholder}><Image size={32} /></div>
                    }
                  </div>

                  <div className={styles.imageCardBody}>
                    {image._file
                      ? <p className={styles.infoText}>{image._file.name}</p>
                      : image.imageUrl
                        ? <p className={styles.infoText} style={{ fontSize: 11, wordBreak: 'break-all' }}>{image.imageUrl}</p>
                        : null
                    }
                    {!image.imageUrl && (
                      <label className={styles.btnAdd} style={{ cursor: 'pointer', marginTop: 8 }}>
                        <Upload size={14} /> {image._file ? 'Đổi ảnh' : 'Chọn ảnh'}
                        <input type="file" accept="image/*"
                          onChange={e => handleImageFileChange(index, e.target.files[0])}
                          style={{ display: 'none' }} />
                      </label>
                    )}
                    {image.isMainImage && (
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Ảnh chính</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MEDIA */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Media (Video)</h3>
          <button className={styles.btnAdd} type="button" onClick={handleAddMedia}>
            <Plus size={16} /> Thêm video
          </button>
        </div>

        {mediaList.length === 0 ? (
          <div className={styles.emptyState}>
            <Video size={48} />
            <p>Chưa có video nào</p>
            <button className={styles.btnPrimary} type="button" onClick={handleAddMedia}>
              Thêm video đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.itemList}>
            {mediaList.map((media, index) => (
              <div key={index} className={styles.itemCard}>
                <div className={styles.cardHeader}>
                  <h4>Video #{index + 1}</h4>
                  <button type="button" className={styles.btnDelete}
                    onClick={() => handleRemoveMedia(index)}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className={styles.grid2}>
                  <div>
                    {media._previewUrl || media.mediaUrl ? (
                      <div className={styles.previewBox}>
                        {media._previewUrl ? (
                          <video muted autoPlay loop playsInline style={{ width: '100%', borderRadius: 8 }}>
                            <source src={media._previewUrl} type={media._file?.type || 'video/mp4'} />
                          </video>
                        ) : (
                          <p className={styles.infoText} style={{ wordBreak: 'break-all' }}>{media.mediaUrl}</p>
                        )}
                      </div>
                    ) : (
                      <div className={styles.previewPlaceholder}>
                        <Video size={32} />
                        <p>Chọn file video để xem trước</p>
                      </div>
                    )}

                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label>
                        <Upload size={14} style={{ marginRight: 4 }} />
                        Tải video lên (tối đa 100MB)
                      </label>
                      <input type="file" accept="video/*"
                        onChange={e => handleMediaFileChange(index, e.target.files[0])} />
                      {media._file && <p className={styles.infoText}>Đã chọn: {media._file.name}</p>}
                    </div>
                  </div>

                  <div>
                    <div className={styles.formGroup}>
                      <label>Loại media</label>
                      <select value={media.mediaType || 'video'}
                        onChange={e => {
                          const updated = [...mediaList];
                          updated[index] = { ...media, mediaType: e.target.value };
                          setMediaList(updated);
                        }}>
                        <option value="video">Video</option>
                        <option value="360">Video 360°</option>
                        <option value="virtual_tour">Virtual Tour</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryTab;

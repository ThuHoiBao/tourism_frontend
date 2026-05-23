import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, Star, Image as ImageIcon, Video, Upload, UploadCloud,
  GripVertical, Eye, FileImage, FileVideo, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './TabStyles.module.scss';

const MAX_IMG_MB   = 5;
const MAX_VIDEO_MB = 100;

const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const GalleryTab = ({ tourId, images, setImages, mediaList, setMediaList }) => {
  // Drag state cho reorder ảnh
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  // Drag state cho drop zone upload
  const [dragOver, setDragOver] = useState(false);
  const dropZoneRef = useRef(null);
  // Preview overlay (lightbox-mini)
  const [previewSrc, setPreviewSrc] = useState(null);

  useEffect(() => () => {
    images.forEach(img => { if (img._previewUrl) URL.revokeObjectURL(img._previewUrl); });
    mediaList.forEach(m => { if (m._previewUrl) URL.revokeObjectURL(m._previewUrl); });
    // eslint-disable-next-line
  }, []);

  // ── IMAGES ──────────────────────────────────────────────────────────────
  const validateImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name}: Không phải file ảnh`);
      return false;
    }
    if (file.size > MAX_IMG_MB * 1024 * 1024) {
      toast.error(`${file.name}: Kích thước quá lớn (tối đa ${MAX_IMG_MB}MB)`);
      return false;
    }
    return true;
  };

  const addImageFiles = (files) => {
    const fileArr = Array.from(files);
    const newImages = [];
    fileArr.forEach((file, idx) => {
      if (!validateImageFile(file)) return;
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

  const handleSetMainImage = (index) => {
    setImages(images.map((img, i) => ({ ...img, isMainImage: i === index })));
  };

  const handleRemoveImage = (index) => {
    const removed = images[index];
    if (removed._previewUrl) URL.revokeObjectURL(removed._previewUrl);
    const updated = images.filter((_, i) => i !== index);
    if (removed.isMainImage && updated.length > 0) updated[0].isMainImage = true;
    setImages(updated);
  };

  const handleReplaceImage = (index, file) => {
    if (!file || !validateImageFile(file)) return;
    const old = images[index];
    if (old._previewUrl) URL.revokeObjectURL(old._previewUrl);
    const updated = [...images];
    updated[index] = { ...old, _file: file, _previewUrl: URL.createObjectURL(file), imageUrl: '' };
    setImages(updated);
  };

  // Drop zone events (toàn vùng)
  const onZoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };
  const onZoneDragLeave = (e) => {
    e.preventDefault();
    // Chỉ tắt khi rời khỏi container (không phải con bên trong)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };
  const onZoneDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (dragIdx !== null) return; // đang reorder, không upload
    const files = e.dataTransfer.files;
    if (files && files.length) addImageFiles(files);
  };

  // Reorder image cards
  const onImgDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onImgDragOver = (idx) => (e) => {
    if (dragIdx === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (overIdx !== idx) setOverIdx(idx);
  };
  const onImgDrop = (idx) => (e) => {
    if (dragIdx === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setImages(next);
    setDragIdx(null); setOverIdx(null);
  };
  const onImgDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // ── MEDIA ────────────────────────────────────────────────────────────────
  const validateVideoFile = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error(`${file.name}: Không phải file video`);
      return false;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`${file.name}: Kích thước quá lớn (tối đa ${MAX_VIDEO_MB}MB)`);
      return false;
    }
    return true;
  };

  const handleAddMedia = () => {
    setMediaList([...mediaList, { _file: null, _previewUrl: null, mediaUrl: '', mediaType: 'video' }]);
  };

  const handleMediaFileChange = (index, file) => {
    if (!file || !validateVideoFile(file)) return;
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

  // ── STATS ────────────────────────────────────────────────────────────────
  const newImgCount     = images.filter(i => i._file).length;
  const newVideoCount   = mediaList.filter(m => m._file).length;
  const hasMain         = images.some(i => i.isMainImage);

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.tabContainer}>

      {/* ── IMAGES SECTION ─────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.itinToolbar}>
          <div className={styles.itinTitle}>
            <h3>Bộ sưu tập hình ảnh</h3>
            <div className={styles.itinStats}>
              <span className={styles.statChip}>
                <FileImage size={12} /> {images.length} ảnh
              </span>
              {newImgCount > 0 && (
                <span className={`${styles.statChip} ${styles.statWarn}`}>
                  <UploadCloud size={12} /> {newImgCount} chờ upload
                </span>
              )}
              {!hasMain && images.length > 0 && (
                <span className={`${styles.statChip} ${styles.statWarn}`}>
                  <AlertCircle size={12} /> Chưa có ảnh chính
                </span>
              )}
            </div>
          </div>

          <div className={styles.itinActions}>
            <label className={styles.btnAdd} style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Chọn ảnh từ máy
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => addImageFiles(e.target.files)} />
            </label>
          </div>
        </div>

        {/* Drop zone — luôn hiển thị (kể cả khi có ảnh) để admin có thể kéo thêm */}
        <div
          ref={dropZoneRef}
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
          onDragOver={onZoneDragOver}
          onDragLeave={onZoneDragLeave}
          onDrop={onZoneDrop}
        >
          <UploadCloud size={images.length === 0 ? 36 : 22} />
          <div>
            <strong>Kéo & thả ảnh vào đây</strong> hoặc bấm nút "Chọn ảnh từ máy"
            <p className={styles.dropZoneHint}>
              Hỗ trợ JPG, PNG, WebP &mdash; tối đa {MAX_IMG_MB}MB / ảnh.
              Kéo ảnh trong danh sách để sắp xếp lại thứ tự.
            </p>
          </div>
        </div>

        {images.length > 0 && (
          <div className={styles.imageGrid}>
            {images.map((image, index) => {
              const src       = image._previewUrl || image.imageUrl;
              const isDragging = dragIdx === index;
              const isOver     = overIdx === index && dragIdx !== null && dragIdx !== index;

              return (
                <div
                  key={index}
                  className={`${styles.imageCard}
                    ${image.isMainImage ? styles.imageCardMain : ''}
                    ${isDragging ? styles.itinDragging : ''}
                    ${isOver ? styles.itinDropTarget : ''}`}
                  draggable
                  onDragStart={onImgDragStart(index)}
                  onDragOver={onImgDragOver(index)}
                  onDrop={onImgDrop(index)}
                  onDragEnd={onImgDragEnd}
                >
                  <div className={styles.imageCardHeader}>
                    <span className={styles.dragHandle} title="Kéo để sắp xếp">
                      <GripVertical size={14} />
                    </span>
                    <span className={styles.imageBadge}>#{index + 1}</span>
                    {image.isMainImage && (
                      <span className={styles.mainBadge}>
                        <Star size={11} /> Ảnh chính
                      </span>
                    )}
                  </div>

                  <div className={styles.imagePreviewWrapper}>
                    {src ? (
                      <>
                        <img
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className={styles.imagePreview}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          className={styles.previewZoomBtn}
                          onClick={() => setPreviewSrc(src)}
                          title="Xem ảnh lớn"
                        >
                          <Eye size={14} />
                        </button>
                      </>
                    ) : (
                      <div className={styles.imagePlaceholder}><ImageIcon size={28} /></div>
                    )}
                  </div>

                  <div className={styles.imageCardBody}>
                    {image._file && (
                      <p className={styles.fileMeta}>
                        <span className={styles.fileName} title={image._file.name}>
                          {image._file.name}
                        </span>
                        <span className={styles.fileSize}>{fmtSize(image._file.size)}</span>
                      </p>
                    )}

                    <div className={styles.imageActionRow}>
                      {!image.isMainImage && (
                        <button
                          type="button"
                          className={styles.btnGhostSm}
                          onClick={() => handleSetMainImage(index)}
                          title="Đặt làm ảnh chính"
                        >
                          <Star size={12} /> Ảnh chính
                        </button>
                      )}
                      <label className={styles.btnGhostSm} style={{ cursor: 'pointer' }}>
                        <Upload size={12} /> {image._file || image.imageUrl ? 'Đổi' : 'Chọn'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handleReplaceImage(index, e.target.files[0])} />
                      </label>
                      <button
                        type="button"
                        className={`${styles.btnGhostSm} ${styles.btnGhostDanger}`}
                        onClick={() => handleRemoveImage(index)}
                        title="Xóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MEDIA SECTION ──────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.itinToolbar}>
          <div className={styles.itinTitle}>
            <h3>Video & Media</h3>
            <div className={styles.itinStats}>
              <span className={styles.statChip}>
                <FileVideo size={12} /> {mediaList.length} video
              </span>
              {newVideoCount > 0 && (
                <span className={`${styles.statChip} ${styles.statWarn}`}>
                  <UploadCloud size={12} /> {newVideoCount} chờ upload
                </span>
              )}
            </div>
          </div>

          <div className={styles.itinActions}>
            <button className={styles.btnAdd} type="button" onClick={handleAddMedia}>
              <Plus size={15} /> Thêm video
            </button>
          </div>
        </div>

        {mediaList.length === 0 ? (
          <div className={styles.emptyState}>
            <Video size={40} />
            <p>Chưa có video nào. Thêm video giới thiệu để tour thêm sinh động.</p>
            <button className={styles.btnPrimary} type="button" onClick={handleAddMedia}>
              <Plus size={14} /> Thêm video đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.mediaList}>
            {mediaList.map((media, index) => (
              <div key={index} className={styles.mediaCard}>
                <div className={styles.mediaCardHead}>
                  <span className={styles.imageBadge}>Video #{index + 1}</span>
                  <button type="button" className={styles.btnIconDelete}
                    onClick={() => handleRemoveMedia(index)} title="Xóa video">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className={styles.mediaCardBody}>
                  <div className={styles.mediaPreview}>
                    {media._previewUrl ? (
                      <video muted autoPlay loop playsInline>
                        <source src={media._previewUrl} type={media._file?.type || 'video/mp4'} />
                      </video>
                    ) : media.mediaUrl ? (
                      <div className={styles.mediaUrlNote}>
                        <Video size={20} />
                        <span>{media.mediaUrl}</span>
                      </div>
                    ) : (
                      <div className={styles.previewPlaceholder}>
                        <Video size={28} />
                        <p>Chọn file video để xem trước</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.mediaCardForm}>
                    <div className={styles.formGroup}>
                      <label>Loại media</label>
                      <select
                        value={media.mediaType || 'video'}
                        onChange={e => {
                          const updated = [...mediaList];
                          updated[index] = { ...media, mediaType: e.target.value };
                          setMediaList(updated);
                        }}
                      >
                        <option value="video">Video chuẩn</option>
                        <option value="360">Video 360°</option>
                        <option value="virtual_tour">Virtual Tour</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        <Upload size={11} /> Tải file video lên (tối đa {MAX_VIDEO_MB}MB)
                      </label>
                      <input type="file" accept="video/*"
                        onChange={e => handleMediaFileChange(index, e.target.files[0])} />
                      {media._file && (
                        <p className={styles.fileMeta} style={{ marginTop: 6 }}>
                          <span className={styles.fileName}>{media._file.name}</span>
                          <span className={styles.fileSize}>{fmtSize(media._file.size)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PREVIEW LIGHTBOX MINI ──────────────────────────────────────── */}
      {previewSrc && (
        <div className={styles.lightbox} onClick={() => setPreviewSrc(null)}>
          <img src={previewSrc} alt="Xem ảnh" onClick={e => e.stopPropagation()} />
          <button className={styles.lightboxClose} onClick={() => setPreviewSrc(null)} type="button">
            <Trash2 size={0} style={{ display: 'none' }} />×
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryTab;

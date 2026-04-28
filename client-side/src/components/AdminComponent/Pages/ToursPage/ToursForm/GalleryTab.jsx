import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Image, Video, Link, Upload, Youtube, Grid } from 'lucide-react';
import styles from './TabStyles.module.scss';
import { toast } from 'react-toastify'; 

const getVideoEmbedInfo = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1);
      }
      if (videoId) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&fs=0&loop=1&playlist=${videoId}`
        };
      }
    }

    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').filter(Boolean).pop();
      if (videoId) {
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&loop=1`
        };
      }
    }

    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: 'direct',
        embedUrl: url
      };
    }

    return null;
  } catch (error) {
    console.error('Invalid video URL:', error);
    return null;
  }
};

const GalleryTab = ({ images, setImages, mediaList, setMediaList }) => {
    
    useEffect(() => {
        return () => {
            images.forEach(image => {
                if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
            });
            mediaList.forEach(media => {
                if (media.previewUrl) URL.revokeObjectURL(media.previewUrl);
            });
        };
    }, []);

    // ============================================
    // IMAGE HANDLERS - MULTI UPLOAD SUPPORT
    // ============================================

    const handleAddImage = () => {
        const newImage = {
            imageURL: '',
            isMainImage: images.length === 0,
            file: null,
            previewUrl: null
        };
        setImages([...images, newImage]);
    };

    const handleMultipleImageUpload = (files) => {
        const fileArray = Array.from(files);
        const newImages = [];

        fileArray.forEach((file, idx) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name}: Kích thước file quá lớn (tối đa 5MB)`);
                return;
            }

            newImages.push({
                imageURL: '',
                isMainImage: images.length === 0 && idx === 0, // First image is main if no images exist
                file: file,
                previewUrl: URL.createObjectURL(file)
            });
        });

        if (newImages.length > 0) {
            setImages([...images, ...newImages]);
            toast.success(`Đã thêm ${newImages.length} ảnh`);
        }
    };

    const handleImageChange = (index, field, value) => {
        const newImages = [...images];
        const currentImage = newImages[index];
        
        if (field === 'isMainImage') {
            if (value) {
                newImages.forEach((img, i) => { img.isMainImage = i === index; });
            } else {
                currentImage.isMainImage = false;
            }
        } 
        else if (field === 'file') {
            const file = value;
            
            if (!file) {
                currentImage.file = null;
                if (currentImage.previewUrl) URL.revokeObjectURL(currentImage.previewUrl);
                currentImage.previewUrl = null;
                setImages(newImages);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước file quá lớn (tối đa 5MB).");
                return;
            }
            
            if (currentImage.previewUrl) URL.revokeObjectURL(currentImage.previewUrl);
            
            currentImage.file = file;
            currentImage.imageURL = ''; 
            currentImage.previewUrl = URL.createObjectURL(file);
            
        } 
        else if (field === 'imageURL') {
            currentImage.imageURL = value;
            currentImage.file = null; 
            if (currentImage.previewUrl) URL.revokeObjectURL(currentImage.previewUrl);
            currentImage.previewUrl = null;
        } 
        else {
            currentImage[field] = value;
        }
        
        setImages(newImages);
    };

    const handleRemoveImage = (index) => {
        const removedImage = images[index];
        if (removedImage.previewUrl) URL.revokeObjectURL(removedImage.previewUrl);
        
        const newImages = images.filter((_, i) => i !== index);
        
        if (removedImage.isMainImage && newImages.length > 0) {
            newImages[0].isMainImage = true;
        }
        setImages(newImages);
    };

    // ============================================
    // MEDIA HANDLERS
    // ============================================

    const handleAddMedia = () => {
        const newMedia = {
            mediaUrl: '',
            thumbnailUrl: '',
            title: '',
            description: '',
            isPrimary: mediaList.length === 0,
            file: null,
            previewUrl: null
        };
        setMediaList([...mediaList, newMedia]);
    };

    const handleMediaChange = (index, field, value) => {
        const newMedia = [...mediaList];
        const currentMedia = newMedia[index];
        
        if (field === 'isPrimary' && value) {
            newMedia.forEach((m, i) => { m.isPrimary = i === index; });
        } 
        else if (field === 'file') {
            const file = value;
            
            if (!file) {
                currentMedia.file = null;
                if (currentMedia.previewUrl) URL.revokeObjectURL(currentMedia.previewUrl);
                currentMedia.previewUrl = null;
                setMediaList(newMedia);
                return;
            }

            if (file.size > 50 * 1024 * 1024) {
                toast.error("Kích thước file quá lớn (tối đa 50MB).");
                return;
            }
            
            if (currentMedia.previewUrl) URL.revokeObjectURL(currentMedia.previewUrl);
            
            currentMedia.file = file;
            currentMedia.mediaUrl = '';
            currentMedia.previewUrl = URL.createObjectURL(file);
        }
        else if (field === 'mediaUrl') {
            currentMedia.mediaUrl = value;
            currentMedia.file = null;
            if (currentMedia.previewUrl) URL.revokeObjectURL(currentMedia.previewUrl);
            currentMedia.previewUrl = null;
        }
        else {
            currentMedia[field] = value;
        }
        
        setMediaList(newMedia);
    };

    const handleRemoveMedia = (index) => {
        const removedMedia = mediaList[index];
        if (removedMedia.previewUrl) URL.revokeObjectURL(removedMedia.previewUrl);
        
        const newMedia = mediaList.filter((_, i) => i !== index);
        
        if (removedMedia.isPrimary && newMedia.length > 0) {
            newMedia[0].isPrimary = true;
        }
        setMediaList(newMedia);
    };

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    const renderImageInput = (image, index) => {
        const isUrlActive = image.imageURL || !image.file;
        const isFileActive = image.file;
        
        return (
            <div className={styles.imageInputGroup}>
                <div className={styles.formGroup}>
                    <label className={styles.labelWithIcon}>
                        <Link size={14} className={styles.inputIcon} />
                        URL hình ảnh
                    </label>
                    <input
                        type="text"
                        value={image.imageURL}
                        onChange={(e) => handleImageChange(index, 'imageURL', e.target.value)}
                        placeholder="Dán URL ảnh vào đây"
                        className={isFileActive ? styles.inputDisabled : ''}
                        disabled={isFileActive}
                    />
                </div>
                
                <p className={styles.separator}>HOẶC</p>

                <div className={styles.formGroup}>
                    <label className={styles.labelWithIcon}>
                        <Upload size={14} className={styles.inputIcon} />
                        Tải ảnh lên (Tối đa 5MB)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(index, 'file', e.target.files[0])}
                        className={isUrlActive && image.imageURL ? styles.inputDisabled : ''}
                        key={image.previewUrl || image.imageURL || "empty_image" + index} 
                        disabled={isUrlActive && image.imageURL}
                    />
                    {image.file && <p className={styles.infoText}>Đã chọn: {image.file.name}</p>}
                </div>
            </div>
        );
    };

    const getSourceUrl = (item) => item.previewUrl || item.imageURL || item.mediaUrl;
    
    const renderMediaInput = (media, index) => {
        const hasUrl = !!media.mediaUrl;
        const hasFile = !!media.file;
        
        return (
            <div className={styles.imageInputGroup}>
                <div className={styles.formGroup}>
                    <label className={styles.labelWithIcon}>
                        <Youtube size={14} className={styles.inputIcon} />
                        URL Video (Youtube, Vimeo, Direct URL)
                    </label>
                    <input
                        type="text"
                        value={media.mediaUrl}
                        onChange={(e) => handleMediaChange(index, 'mediaUrl', e.target.value)}
                        placeholder="VD: https://youtu.be/abc hoặc https://example.com/video.mp4"
                        className={hasFile ? styles.inputDisabled : ''}
                        disabled={hasFile}
                    />
                </div>
                
                <p className={styles.separator}>HOẶC</p>

                <div className={styles.formGroup}>
                    <label className={styles.labelWithIcon}>
                        <Upload size={14} className={styles.inputIcon} />
                        Tải Video lên (Tối đa 50MB)
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleMediaChange(index, 'file', e.target.files[0])}
                        className={hasUrl ? styles.inputDisabled : ''}
                        key={media.previewUrl || media.mediaUrl || "empty_media" + index}
                        disabled={hasUrl}
                    />
                    {media.file && <p className={styles.infoText}>Đã chọn: {media.file.name}</p>}
                </div>
            </div>
        );
    };

    const renderVideoPreview = (media) => {
        // Priority: uploaded file > URL
        if (media.previewUrl) {
            return (
                <div className={styles.videoWrapper}>
                    <video 
                        muted 
                        autoPlay 
                        loop 
                        playsInline 
                        className={styles.videoElement}
                    >
                        <source 
                            src={media.previewUrl} 
                            type={media.file ? media.file.type : 'video/mp4'} 
                        />
                        Trình duyệt của bạn không hỗ trợ video.
                    </video>
                </div>
            );
        }
        
        if (media.mediaUrl) {
            const videoInfo = getVideoEmbedInfo(media.mediaUrl);
            
            if (videoInfo) {
                if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') {
                    return (
                        <div className={styles.videoWrapper}>
                            <iframe
                                src={videoInfo.embedUrl}
                                title="Video player"
                                frameBorder="0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            ></iframe>
                        </div>
                    );
                } else if (videoInfo.type === 'direct') {
                    return (
                        <div className={styles.videoWrapper}>
                            <video 
                                muted 
                                autoPlay 
                                loop 
                                playsInline 
                                className={styles.videoElement}
                            >
                                <source src={videoInfo.embedUrl} type="video/mp4" />
                                <source src={videoInfo.embedUrl} type="video/webm" />
                                <source src={videoInfo.embedUrl} type="video/ogg" />
                                Trình duyệt của bạn không hỗ trợ video.
                            </video>
                        </div>
                    );
                }
            }
        }
        
        return (
            <div className={styles.previewPlaceholder}>
                <Video size={32} />
                <p>Nhập URL Youtube/Vimeo hoặc Upload file để xem trước</p>
            </div>
        );
    };

    return (
        <div className={styles.tabContainer}>
            {/* IMAGES SECTION */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Bộ sưu tập Hình ảnh</h3>
                    <div className={styles.headerActions}>
                        <label className={styles.btnAdd}>
                            <Grid size={18} />
                            <span>Upload nhiều ảnh</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleMultipleImageUpload(e.target.files)}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button className={styles.btnAdd} type="button" onClick={handleAddImage}>
                            <Plus size={18} />
                            Thêm ảnh
                        </button>
                    </div>
                </div>

                {images.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Image size={48} />
                        <p>Chưa có hình ảnh nào</p>
                        <div className={styles.emptyActions}>
                            <label className={styles.btnPrimary}>
                                <Grid size={18} />
                                Upload nhiều ảnh
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleMultipleImageUpload(e.target.files)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <button className={styles.btnSecondary} type="button" onClick={handleAddImage}>
                                <Plus size={18} />
                                Thêm từng ảnh
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.imageGrid}>
                        {images.map((image, index) => {
                            const sourceUrl = getSourceUrl(image);
                            return (
                                <div key={index} className={styles.imageCard}>
                                    <div className={styles.imageCardHeader}>
                                        <span className={styles.imageBadge}>#{index + 1}</span>
                                        <div className={styles.imageActions}>
                                            <button 
                                                type="button"
                                                className={`${styles.btnIcon} ${image.isMainImage ? styles.active : ''}`}
                                                onClick={() => handleImageChange(index, 'isMainImage', !image.isMainImage)}
                                                title={image.isMainImage ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                                            >
                                                <Star size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.btnIconDelete}
                                                onClick={() => handleRemoveImage(index)}
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.imagePreviewWrapper}>
                                        {sourceUrl ? (
                                            <img 
                                                src={sourceUrl} 
                                                alt={`Preview ${index + 1}`} 
                                                onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd"/%3E%3C/svg%3E'} 
                                                className={styles.imagePreview}
                                            />
                                        ) : (
                                            <div className={styles.imagePlaceholder}>
                                                <Image size={32} />
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.imageCardBody}>
                                        {renderImageInput(image, index)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MEDIA SECTION (VIDEO) */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Media (Video)</h3>
                    <button className={styles.btnAdd} type="button" onClick={handleAddMedia}>
                        <Plus size={18} />
                        Thêm video
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
                        {mediaList.map((media, index) => {
                            return (
                                <div key={index} className={styles.itemCard}>
                                    <div className={styles.cardHeader}>
                                        <h4>Video #{index + 1}</h4>
                                        <div className={styles.itemActions}>
                                            <button 
                                                type="button"
                                                className={`${styles.btnAction} ${media.isPrimary ? styles.starred : ''}`}
                                                onClick={() => handleMediaChange(index, 'isPrimary', !media.isPrimary)}
                                                title={media.isPrimary ? 'Video chính' : 'Đặt làm video chính'}
                                            >
                                                <Star size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.btnDelete}
                                                onClick={() => handleRemoveMedia(index)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.grid2}>
                                        <div>
                                            {renderMediaInput(media, index)}
                                            
                                            <div className={styles.formGroup}>
                                                <label>Thumbnail URL (Tùy chọn)</label>
                                                <input
                                                    type="text"
                                                    value={media.thumbnailUrl}
                                                    onChange={(e) => handleMediaChange(index, 'thumbnailUrl', e.target.value)}
                                                    placeholder="URL ảnh đại diện video"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Tiêu đề</label>
                                                <input
                                                    type="text"
                                                    value={media.title}
                                                    onChange={(e) => handleMediaChange(index, 'title', e.target.value)}
                                                    placeholder="Tiêu đề video"
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Mô tả</label>
                                                <input
                                                    type="text"
                                                    value={media.description}
                                                    onChange={(e) => handleMediaChange(index, 'description', e.target.value)}
                                                    placeholder="Mô tả ngắn về video"
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.previewBox}>
                                            {renderVideoPreview(media)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GalleryTab;
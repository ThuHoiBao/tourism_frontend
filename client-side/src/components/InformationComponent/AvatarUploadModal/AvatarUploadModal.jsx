import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';
import styles from './AvatarUploadModal.module.scss'; 
import { updateUserApi } from '../../../services/user/user.ts'; 

const DEFAULT_AVATAR = "https://th.bing.com/th/id/OIP.KMh7jiRqiGInQryreHc-UwHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3";

const AvatarUploadModal = ({ user, onClose, onUpdateSuccess }) => {
    const userData = user?.data || user;
    const userID = userData?.id || userData?.userID || userData?.userId;
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(userData?.avatar || DEFAULT_AVATAR); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        console.log('=== AVATAR MODAL DEBUG ===');
        console.log('Raw user prop:', user);
        console.log('userData:', userData);
        console.log('userID:', userID);
        console.log('==========================');
    }, [user, userData, userID]);

    if (!userData) {
        return null;
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn file ảnh (jpg, png, gif, ...)');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setError('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUpdate = async () => {
        if (!selectedFile) {
            setError("Vui lòng chọn ảnh đại diện mới.");
            return;
        }

        if (!userID) {
            console.error('❌ UserID is undefined!');
            console.error('user prop:', user);
            console.error('userData:', userData);
            setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);
            
            console.log('📤 Uploading avatar for userID:', userID);
            console.log('📁 File:', selectedFile.name, selectedFile.type, selectedFile.size);
            
            const response = await updateUserApi(userID, formData);

            console.log('✅ Avatar uploaded successfully:', response);

            if (onUpdateSuccess) {
                onUpdateSuccess({
                    avatar: response.avatar || response.data?.avatar
                });
            }
            
            onClose();
            
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error("❌ Lỗi cập nhật avatar:", error);
            console.error("Error response:", error.response?.data);
            
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error
                || "Lỗi khi cập nhật Avatar. Vui lòng thử lại.";
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                
                <FaTimes className={styles.closeIcon} onClick={onClose} />

                <h3 className={styles.modalTitle}>Cập nhật Ảnh đại diện</h3>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                <div className={styles.avatarPreviewContainer}>
                    <img src={previewUrl} alt="Avatar Preview" className={styles.avatarPreview} />
                    {loading && <div className={styles.loader}>Đang tải...</div>}
                </div>

                {selectedFile && (
                    <div className={styles.fileInfo}>
                        <span className={styles.fileName}>📁 {selectedFile.name}</span>
                        <span className={styles.fileSize}>
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*"
                />

                <div className={styles.buttonGroup}>
                    <button 
                        className={styles.selectButton} 
                        onClick={handleUploadClick}
                        disabled={loading}
                    >
                        <FaCamera className={styles.buttonIcon} /> Chọn ảnh đại diện
                    </button>
                    
                    <button 
                        className={styles.updateButton} 
                        onClick={handleUpdate}
                        disabled={loading || !selectedFile}
                    >
                        {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarUploadModal;
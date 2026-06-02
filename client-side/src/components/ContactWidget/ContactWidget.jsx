import React, { useEffect, useRef, useState } from 'react';
import { FaPhone, FaFacebookF, FaFacebookMessenger, FaTimes } from 'react-icons/fa';
import styles from './ContactWidget.module.scss';

/**
 * Floating contact widget — góc dưới trái mọi trang user.
 * Click nút phone → bung 3 channel: Messenger, Facebook, Zalo.
 * KHÔNG render trong layout /admin (App.tsx tách route).
 */
const ContactWidget = () => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Đóng khi click ngoài
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    // ESC → đóng
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const channels = [
        {
            key: 'messenger',
            label: 'Chat Messenger',
            href: 'https://www.facebook.com/profile.php?id=61590489687138',
            bg: 'linear-gradient(135deg, #00B2FF, #006AFF)',
            icon: <FaFacebookMessenger />,
        },
        {
            key: 'facebook',
            label: 'Facebook',
            href: 'https://www.facebook.com/profile.php?id=61590489687138',
            bg: '#1877F2',
            icon: <FaFacebookF />,
        },
        {
            key: 'zalo',
            label: 'Zalo',
            href: 'https://zalo.me/0859716818',
            bg: '#0068FF',
            // Logo Zalo dạng text — không có sẵn icon trong lucide/react-icons
            icon: <span className={styles.zaloText}>Zalo</span>,
        },
    ];

    return (
        <div ref={wrapRef} className={styles.contactWidget}>
            {open && (
                <div className={styles.channels}>
                    {channels.map((c) => (
                        <a
                            key={c.key}
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.channelBtn}
                            style={{ background: c.bg }}
                            title={c.label}
                            aria-label={c.label}
                        >
                            {c.icon}
                        </a>
                    ))}
                    <button
                        className={styles.closeBtn}
                        onClick={() => setOpen(false)}
                        title="Đóng"
                        aria-label="Đóng"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <button
                className={`${styles.fab} ${open ? styles.fabActive : ''}`}
                onClick={() => setOpen((o) => !o)}
                title="Liên hệ"
                aria-label="Liên hệ với chúng tôi"
            >
                <FaPhone />
                <span className={styles.fabPulse} />
            </button>
        </div>
    );
};

export default ContactWidget;

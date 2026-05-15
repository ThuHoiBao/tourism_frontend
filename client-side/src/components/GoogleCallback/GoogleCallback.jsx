import React, {useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import { useAuth } from '../../context/AuthContext';


const GOOGLE_REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const {loginWithGoogleCode} = useAuth();
    const called = useRef(false);  // // tránh gọi 2 lần do React StrictMode

    useEffect(() => {
        if(called.current) return;
        called.current = true;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if(error || !code){
            console.error('Google callback error:', error);           
            navigate('/login?error=google_failed', { replace: true });
            return;
        }

        loginWithGoogleCode(code, GOOGLE_REDIRECT_URI)
            .then((result) => {
                const userRole = result.user?.role;
                if(userRole === 'ADMIN') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    window.location.replace('/');
                }
            })
            .catch((err) => {
                console.error('Google login failed:', err);
                navigate('/login?error=google_failed', { replace: true });
            });
    }, []);

    return (
         <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
            fontFamily: 'system-ui, sans-serif',
        }}><div style={{
                width: '48px',
                height: '48px',
                border: '3px solid #fed7aa',
                borderTopColor: '#d97706',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '1rem', color: '#92400e', fontWeight: 500 }}>
                Đang xử lý đăng nhập Google...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
};

export default GoogleCallback;

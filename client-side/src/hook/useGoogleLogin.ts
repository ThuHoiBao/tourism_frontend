const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8180';
const KEYCLOAK_REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'tourism';
const KEYCLOAK_CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'tourism-app';
const GOOGLE_REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

interface UseGoogleLoginReturn {
    initiateGoogleLogin: () => void;
    GOOGLE_REDIRECT_URI: string;
}

export const useGoogleLogin = (): UseGoogleLoginReturn => {
    
    const initiateGoogleLogin = (): void => {
        const params = new URLSearchParams({
            client_id: KEYCLOAK_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            kc_idp_hint: 'google',
        });

        const authUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params.toString()}`;
        console.log('[Google Login] Redirecting to:', authUrl);
        console.log('[Google Login] ENV vars:', { KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, GOOGLE_REDIRECT_URI });
        window.location.href = authUrl;
    };

    return { initiateGoogleLogin, GOOGLE_REDIRECT_URI };
};

const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '');

export const resolveWebSocketBaseUrl = () => {
    const explicitWsUrl = trimTrailingSlash(process.env.REACT_APP_WS_URL);
    if (explicitWsUrl) return explicitWsUrl;

    const apiUrl = trimTrailingSlash(process.env.REACT_APP_API_URL);
    if (apiUrl) return apiUrl;

    return 'http://localhost:8086';
};

export const resolveWebSocketUrl = () => `${resolveWebSocketBaseUrl()}/ws`;

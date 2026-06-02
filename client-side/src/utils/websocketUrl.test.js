import { resolveWebSocketBaseUrl, resolveWebSocketUrl } from './websocketUrl';

describe('websocketUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.REACT_APP_WS_URL;
        delete process.env.REACT_APP_API_URL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('uses direct notification service by default', () => {
        expect(resolveWebSocketBaseUrl()).toBe('http://localhost:8086');
        expect(resolveWebSocketUrl()).toBe('http://localhost:8086/ws');
    });

    it('uses REACT_APP_API_URL when configured', () => {
        process.env.REACT_APP_API_URL = 'http://localhost:8080/';

        expect(resolveWebSocketUrl()).toBe('http://localhost:8080/ws');
    });

    it('prefers REACT_APP_WS_URL over API URL', () => {
        process.env.REACT_APP_API_URL = 'http://localhost:8080';
        process.env.REACT_APP_WS_URL = 'http://localhost:8086/';

        expect(resolveWebSocketUrl()).toBe('http://localhost:8086/ws');
    });
});

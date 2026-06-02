import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CoinWithdrawalsPage from './CoinWithdrawalsPage';
import {
    getCoinWithdrawalDetailApi,
    retryCoinWithdrawalApi,
    searchCoinWithdrawalsAdminApi,
    confirmManualPayoutApi,
    checkSepayTransactionApi,
} from '../../../../services/coinWithdrawal/coinWithdrawal.ts';

jest.mock('../../../../services/coinWithdrawal/coinWithdrawal.ts', () => ({
    getCoinWithdrawalDetailApi: jest.fn(),
    retryCoinWithdrawalApi: jest.fn(),
    searchCoinWithdrawalsAdminApi: jest.fn(),
    confirmManualPayoutApi: jest.fn(),
    checkSepayTransactionApi: jest.fn(),
}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Shared fixtures
const MANUAL_ROW = {
    id: 10,
    referenceCode: 'WD1MANUAL001',
    userId: 30,
    coinAmount: 20,
    moneyAmount: 20000,
    bank: 'TCB',
    accountNumberMasked: '****4567',
    accountName: 'TRAN VAN B',
    status: 'MANUAL',
    errorSource: 'SEPAY',
    retryCount: 0,
    createdAt: '2026-05-30T10:00:00',
    updatedAt: '2026-05-30T10:01:00',
    note: 'SePay khong ho tro API',
};

const FAILED_ROW = {
    id: 9,
    referenceCode: 'WDADMIN1',
    userId: 25,
    coinAmount: 15,
    moneyAmount: 15000,
    bank: 'VCB',
    accountNumberMasked: '******7890',
    accountName: 'NGUYEN VAN A',
    status: 'FAILED',
    errorSource: 'SEPAY',
    retryCount: 1,
    createdAt: '2026-05-30T10:00:00',
    updatedAt: '2026-05-30T10:02:00',
};

describe('CoinWithdrawalsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders admin rows from the search API', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);

        expect(await screen.findByText('WDADMIN1')).toBeInTheDocument();
        expect(document.querySelector('h1').textContent).toContain('Qu\u1ea3n l\u00fd r\u00fat \u0111i\u1ec3m th\u01b0\u1edfng');
    });

    it('shows the confirm-manual button only for MANUAL rows', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        expect(screen.getByTitle('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng')).toBeInTheDocument();
    });

    it('opens confirm modal with QR section and step UI when confirm button clicked', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        fireEvent.click(screen.getByTitle('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng'));

        expect(await screen.findByText('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng')).toBeInTheDocument();
        expect(screen.getByText('Qu\u00e9t \u0111\u1ec3 chuy\u1ec3n kho\u1ea3n')).toBeInTheDocument();
        // Step labels
        expect(screen.getByText(/ki\u1ec3m tra giao d\u1ecbch tr\u00ean SePay/i)).toBeInTheDocument();
        // Confirm button should be disabled initially (no SePay check, no transferRef)
        expect(screen.getByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i })).toBeDisabled();
    });

    it('enables confirm button after SePay verification', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        checkSepayTransactionApi.mockResolvedValue({
            verified: true,
            transactionReference: 'SEPAY_REF_001',
            message: 'Tim thay giao dich phu hop tren SePay: SEPAY_REF_001',
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');
        fireEvent.click(screen.getByTitle('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng'));

        fireEvent.click(await screen.findByRole('button', { name: /ki\u1ec3m tra sepay/i }));

        await waitFor(() => {
            expect(checkSepayTransactionApi).toHaveBeenCalledWith(10);
        });
        // After SePay found, confirm button should be enabled
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i })).not.toBeDisabled();
        });
    });

    it('enables confirm button when transferRef is manually entered', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');
        fireEvent.click(screen.getByTitle('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng'));

        await screen.findByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i });
        expect(screen.getByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i })).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText(/FT24/i), { target: { value: 'MANUAL_REF_001' } });
        expect(screen.getByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i })).not.toBeDisabled();
    });

    it('calls confirmManualPayoutApi with transferRef after manual entry', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        confirmManualPayoutApi.mockResolvedValue({ ...MANUAL_ROW, status: 'COMPLETED', transferRef: 'FT001' });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        fireEvent.click(screen.getByTitle('X\u00e1c nh\u1eadn chuy\u1ec3n kho\u1ea3n th\u1ee7 c\u00f4ng'));
        await screen.findByText('Qu\u00e9t \u0111\u1ec3 chuy\u1ec3n kho\u1ea3n');

        // Enter transferRef to enable confirm
        fireEvent.change(screen.getByPlaceholderText(/FT24/i), { target: { value: 'FT001' } });
        fireEvent.click(screen.getByRole('button', { name: /x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n/i }));

        await waitFor(() => {
            expect(confirmManualPayoutApi).toHaveBeenCalledWith(10, expect.objectContaining({ transferRef: 'FT001' }));
        });
    });

    it('opens the detail modal for a selected withdrawal', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        getCoinWithdrawalDetailApi.mockResolvedValue({
            ...FAILED_ROW,
            operationKey: 'WDADMIN1_WITHDRAW',
            transferRef: null,
            note: 'Timeout from provider',
        });

        render(<CoinWithdrawalsPage />);

        await screen.findByText('WDADMIN1');
        fireEvent.click(screen.getByTitle('Xem chi ti\u1ebft'));

        await waitFor(() => {
            expect(getCoinWithdrawalDetailApi).toHaveBeenCalledWith(9);
        });
        expect(await screen.findByText('Timeout from provider')).toBeInTheDocument();
    });

    it('shows retry button for FAILED rows and calls retry API', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        retryCoinWithdrawalApi.mockResolvedValue(undefined);

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WDADMIN1');

        const retryBtn = screen.getByTitle('Retry giao d\u1ecbch');
        fireEvent.click(retryBtn);

        await waitFor(() => {
            expect(retryCoinWithdrawalApi).toHaveBeenCalledWith(9);
        });
    });
});


jest.mock('../../../../services/coinWithdrawal/coinWithdrawal.ts', () => ({
    getCoinWithdrawalDetailApi: jest.fn(),
    retryCoinWithdrawalApi: jest.fn(),
    searchCoinWithdrawalsAdminApi: jest.fn(),
    confirmManualPayoutApi: jest.fn(),
}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Shared fixtures
const MANUAL_ROW = {
    id: 10,
    referenceCode: 'WD1MANUAL001',
    userId: 30,
    coinAmount: 20,
    moneyAmount: 20000,
    bank: 'TCB',
    accountNumberMasked: '****4567',
    accountName: 'TRAN VAN B',
    status: 'MANUAL',
    errorSource: 'SEPAY',
    retryCount: 0,
    createdAt: '2026-05-30T10:00:00',
    updatedAt: '2026-05-30T10:01:00',
    note: 'SePay khong ho tro API',
};

const FAILED_ROW = {
    id: 9,
    referenceCode: 'WDADMIN1',
    userId: 25,
    coinAmount: 15,
    moneyAmount: 15000,
    bank: 'VCB',
    accountNumberMasked: '******7890',
    accountName: 'NGUYEN VAN A',
    status: 'FAILED',
    errorSource: 'SEPAY',
    retryCount: 1,
    createdAt: '2026-05-30T10:00:00',
    updatedAt: '2026-05-30T10:02:00',
};

describe('CoinWithdrawalsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders admin rows from the search API', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);

        expect(await screen.findByText('WDADMIN1')).toBeInTheDocument();
        // h1 has an SVG icon + text node â€” check via textContent
        expect(document.querySelector('h1').textContent).toContain('Quáº£n lÃ½ rÃºt Ä‘iá»ƒm thÆ°á»Ÿng');
    });

    it('shows the confirm-manual button only for MANUAL rows', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        // Should show confirm icon button (title="XÃ¡c nháº­n chuyá»ƒn khoáº£n thá»§ cÃ´ng")
        expect(screen.getByTitle('XÃ¡c nháº­n chuyá»ƒn khoáº£n thá»§ cÃ´ng')).toBeInTheDocument();
    });

    it('opens confirm modal with QR section when confirm button clicked', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        fireEvent.click(screen.getByTitle('XÃ¡c nháº­n chuyá»ƒn khoáº£n thá»§ cÃ´ng'));

        // Modal should appear with referenceCode
        expect(await screen.findByText('XÃ¡c nháº­n chuyá»ƒn khoáº£n thá»§ cÃ´ng')).toBeInTheDocument();
        expect(screen.getByText('QuÃ©t Ä‘á»ƒ chuyá»ƒn khoáº£n')).toBeInTheDocument();
    });

    it('calls confirmManualPayoutApi on confirm and refreshes list', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [MANUAL_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        confirmManualPayoutApi.mockResolvedValue({ ...MANUAL_ROW, status: 'COMPLETED', transferRef: 'FT001' });

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WD1MANUAL001');

        fireEvent.click(screen.getByTitle('XÃ¡c nháº­n chuyá»ƒn khoáº£n thá»§ cÃ´ng'));
        await screen.findByText('QuÃ©t Ä‘á»ƒ chuyá»ƒn khoáº£n');

        const confirmBtn = screen.getByRole('button', { name: /XÃ¡c nháº­n Ä‘Ã£ chuyá»ƒn/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(confirmManualPayoutApi).toHaveBeenCalledWith(10, expect.any(Object));
        });
    });

    it('opens the detail modal for a selected withdrawal', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        getCoinWithdrawalDetailApi.mockResolvedValue({
            ...FAILED_ROW,
            operationKey: 'WDADMIN1_WITHDRAW',
            transferRef: null,
            note: 'Timeout from provider',
        });

        render(<CoinWithdrawalsPage />);

        await screen.findByText('WDADMIN1');
        // Eye icon button has title="Xem chi tiáº¿t"
        fireEvent.click(screen.getByTitle('Xem chi tiáº¿t'));

        await waitFor(() => {
            expect(getCoinWithdrawalDetailApi).toHaveBeenCalledWith(9);
        });
        expect(await screen.findByText('Timeout from provider')).toBeInTheDocument();
    });

    it('shows retry button for FAILED rows and calls retry API', async () => {
        searchCoinWithdrawalsAdminApi.mockResolvedValue({
            content: [FAILED_ROW],
            totalPages: 1,
            totalElements: 1,
        });
        retryCoinWithdrawalApi.mockResolvedValue(undefined);

        render(<CoinWithdrawalsPage />);
        await screen.findByText('WDADMIN1');

        // Retry icon button has title="Retry giao dá»‹ch"
        const retryBtn = screen.getByTitle('Retry giao dá»‹ch');
        fireEvent.click(retryBtn);

        await waitFor(() => {
            expect(retryCoinWithdrawalApi).toHaveBeenCalledWith(9);
        });
    });
});

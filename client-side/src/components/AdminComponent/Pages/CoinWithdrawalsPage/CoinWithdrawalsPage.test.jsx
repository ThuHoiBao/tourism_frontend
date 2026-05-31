import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CoinWithdrawalsPage from './CoinWithdrawalsPage';
import {
    getCoinWithdrawalDetailApi,
    retryCoinWithdrawalApi,
    searchCoinWithdrawalsAdminApi,
    confirmManualPayoutApi,
} from '../../../../services/coinWithdrawal/coinWithdrawal.ts';

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

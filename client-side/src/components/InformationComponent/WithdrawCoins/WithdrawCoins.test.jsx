import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WithdrawCoins from './WithdrawCoins';
import {
    createCoinWithdrawalApi,
    getMyCoinWithdrawalsApi,
} from '../../../services/coinWithdrawal/coinWithdrawal.ts';

jest.mock('../../../services/coinWithdrawal/coinWithdrawal.ts', () => ({
    createCoinWithdrawalApi: jest.fn(),
    getMyCoinWithdrawalsApi: jest.fn(),
}));

jest.mock('../TransactionList/TransactionListItem/RefundInfoModal/RefundInfoModal.jsx', () => ({
    BANK_LIST: [
        { code: 'VCB', name: 'Vietcombank', shortName: 'VCB', bin: '970436', logo: '' },
        { code: 'TCB', name: 'Techcombank', shortName: 'TCB', bin: '970407', logo: '' },
    ],
}));

jest.mock('../../../hook/useWebSocket', () => jest.fn());

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const renderWithRouter = (ui) => render(ui);

describe('WithdrawCoins', () => {
    const user = { id: 12, fullName: 'Test User', coinBalance: 30 };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders withdrawal history returned by the API', async () => {
        getMyCoinWithdrawalsApi.mockResolvedValue([
            {
                id: 1,
                referenceCode: 'WD12AAA',
                coinAmount: 10,
                moneyAmount: 10000,
                bank: 'VCB',
                accountNumberMasked: '******7890',
                accountName: 'TEST USER',
                status: 'COMPLETED',
                createdAt: '2026-05-30T10:00:00',
            },
        ]);

        renderWithRouter(<WithdrawCoins user={user} />);

        expect(await screen.findByText('WD12AAA')).toBeInTheDocument();
        expect(screen.getByText('Rút điểm về tài khoản ngân hàng')).toBeInTheDocument();
    });

    it('renders navigation header buttons', async () => {
        getMyCoinWithdrawalsApi.mockResolvedValue([]);
        renderWithRouter(<WithdrawCoins user={user} />);

        expect(await screen.findByText(/lịch sử giao dịch/i)).toBeInTheDocument();
        expect(screen.getByText(/rút tiền về ngân hàng/i)).toBeInTheDocument();
    });

    it('shows 24-hour wait message on submit', async () => {
        const { toast } = require('react-toastify');
        getMyCoinWithdrawalsApi.mockResolvedValue([]);
        createCoinWithdrawalApi.mockResolvedValue({ id: 2, referenceCode: 'WD12NEW' });

        renderWithRouter(<WithdrawCoins user={user} />);

        fireEvent.change(screen.getByPlaceholderText('Nhập số điểm'), { target: { value: '8' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập số tài khoản'), { target: { value: '1234567890' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập tên chủ tài khoản'), { target: { value: 'NGUYEN VAN A' } });

        fireEvent.click(screen.getByRole('button', { name: /chọn ngân hàng/i }));
        fireEvent.click(await screen.findByRole('button', { name: /vietcombank/i }));
        fireEvent.click(screen.getByRole('button', { name: /tạo yêu cầu rút điểm/i }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('24 giờ'),
            );
        });
    });

    it('submits a new withdrawal request from the inline form', async () => {
        getMyCoinWithdrawalsApi.mockResolvedValue([]);
        createCoinWithdrawalApi.mockResolvedValue({ id: 2, referenceCode: 'WD12NEW' });

        renderWithRouter(<WithdrawCoins user={user} />);

        fireEvent.change(screen.getByPlaceholderText('Nhập số điểm'), { target: { value: '8' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập số tài khoản'), { target: { value: '1234567890' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập tên chủ tài khoản'), { target: { value: 'NGUYEN VAN A' } });

        fireEvent.click(screen.getByRole('button', { name: /chọn ngân hàng/i }));
        fireEvent.click(await screen.findByRole('button', { name: /vietcombank/i }));
        fireEvent.click(screen.getByRole('button', { name: /tạo yêu cầu rút điểm/i }));

        await waitFor(() => {
            expect(createCoinWithdrawalApi).toHaveBeenCalledWith({
                userId: 12,
                coinAmount: 8,
                bank: 'VCB',
                accountNumber: '1234567890',
                accountName: 'NGUYEN VAN A',
            });
        });
    });

    it('keeps submit enabled when a manual withdrawal is already waiting', async () => {
        getMyCoinWithdrawalsApi.mockResolvedValue([
            {
                id: 3,
                referenceCode: 'WD12WAIT',
                coinAmount: 5,
                moneyAmount: 5000,
                bank: 'VCB',
                accountNumberMasked: '1234567890',
                accountName: 'TEST USER',
                status: 'MANUAL',
                createdAt: '2026-06-01T10:00:00',
            },
        ]);

        renderWithRouter(<WithdrawCoins user={user} />);

        expect(await screen.findByText('WD12WAIT')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /tạo yêu cầu rút điểm/i })).toBeEnabled();
    });
});

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
        { code: 'VCB', name: 'Vietcombank' },
        { code: 'TCB', name: 'Techcombank' },
    ],
}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

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
                note: 'Chuyen khoan thanh cong',
                createdAt: '2026-05-30T10:00:00',
            },
        ]);

        render(<WithdrawCoins user={user} />);

        expect(await screen.findByText('WD12AAA')).toBeInTheDocument();
        expect(screen.getByText('Rút điểm về tài khoản ngân hàng')).toBeInTheDocument();
        expect(screen.getByText('Chuyen khoan thanh cong')).toBeInTheDocument();
    });

    it('submits a new withdrawal request from the inline form', async () => {
        getMyCoinWithdrawalsApi.mockResolvedValue([]);
        createCoinWithdrawalApi.mockResolvedValue({ id: 2, referenceCode: 'WD12NEW' });

        render(<WithdrawCoins user={user} />);

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
});
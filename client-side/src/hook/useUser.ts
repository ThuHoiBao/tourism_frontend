// src/hook/useUser.ts

import { useState, useEffect } from 'react';
import { UserRequestDTO } from '../dto/requestDTO/UserRequestDTO.ts';
import { getUserByIdApi } from '../services/user/user.ts';

// Định nghĩa kiểu dữ liệu cho giá trị trả về của Custom Hook
interface UserHook {
    user: UserRequestDTO | null;
    loading: boolean;
    error: string | null;
    setUser: React.Dispatch<React.SetStateAction<UserRequestDTO | null>>;
}

/**
 * Custom Hook để tải và quản lý trạng thái của user.
 * @param userID - ID của user (bắt buộc)
 * @returns {UserHook} { user, loading, error }
 */
const useUser = (userID: number): UserHook => {
    const [user, setUser] = useState<UserRequestDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                setError(null);
                const userData: UserRequestDTO = await getUserByIdApi(userID);
                setUser(userData);
            } catch (err) {
                console.error("Lỗi khi tải thông tin user:", err);
                setError("Không thể tải thông tin user.");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userID]);

    return { user, loading, error, setUser };
};

export default useUser;


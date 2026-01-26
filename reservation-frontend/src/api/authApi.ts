import apiClient from "./client";
import type {User, LoginRequest, RegisterRequest} from "../types"

export const authApi = {
    login: async (data: LoginRequest): Promise<User> => {
        const response = await apiClient.post<User>("/auth/login", data);
        return response.data;
    },

    signup: async (data: RegisterRequest): Promise<{ message: string}> => {
        const response = await apiClient.post<{ message: string}>("/auth/register", data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post("/auth/logout")
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await apiClient.get<User>("/auth/me");
            return response.data;
        } catch(error) {
            console.error("ユーザー情報の取得に失敗:", error)
            return null;
        }
    },

    googleLogin: (): void => {
        window.location.href = "/oauth2/authorization/google";
    },
};
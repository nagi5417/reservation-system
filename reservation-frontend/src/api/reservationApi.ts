import apiClient from "./client";
import type { Reservation, ReservationRequest } from "../types";

export const reservationApi = {
    create: async (data: ReservationRequest): Promise<Reservation> => {
        const response = await apiClient.post<Reservation>(`/reservations`, data);
        return response.data;
    },

    getMy: async (): Promise<Reservation[]> => {
        const response = await apiClient.get<Reservation[]>(`/reservations/my`);
        return response.data;
    },

    getAll: async (): Promise<Reservation[]> => {
        const response = await apiClient.get<Reservation[]>(`/reservations`);
        return response.data;
    },

    cancel: async (id: number): Promise<void> => {
        await apiClient.delete(`/reservations/${id}`);
    }
}
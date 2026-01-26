import apiClient from './client';
import type { Slot, SlotRequest } from '../types';

export const slotApi = {
  getAll: async (params?: {
    from?: string;
    to?: string;
    menuId?: number;
  }): Promise<Slot[]> => {
    const response = await apiClient.get<Slot[]>('/slots', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Slot> => {
    const response = await apiClient.get<Slot>(`/slots/${id}`);
    return response.data;
  },

  create: async (data: SlotRequest): Promise<Slot> => {
    const response = await apiClient.post<Slot>('/slots', data);
    return response.data;
  },

  update: async (id: number, data: SlotRequest): Promise<Slot> => {
    const response = await apiClient.put<Slot>(`/slots/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/slots/${id}`);
  },
};

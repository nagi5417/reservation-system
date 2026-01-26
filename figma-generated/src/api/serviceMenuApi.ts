import apiClient from './client';
import type { ServiceMenu, ServiceMenuRequest } from '../types';

export const serviceMenuApi = {
  getAll: async (): Promise<ServiceMenu[]> => {
    const response = await apiClient.get<ServiceMenu[]>('/service-menus');
    return response.data;
  },

  getById: async (id: number): Promise<ServiceMenu> => {
    const response = await apiClient.get<ServiceMenu>(`/service-menus/${id}`);
    return response.data;
  },

  create: async (data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.post<ServiceMenu>('/service-menus', data);
    return response.data;
  },

  update: async (id: number, data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.put<ServiceMenu>(`/service-menus/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-menus/${id}`);
  },
};

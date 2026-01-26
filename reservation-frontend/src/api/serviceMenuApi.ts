import apiClient from './client';
import type { ServiceMenu, ServiceMenuRequest } from '../types';

export const serviceMenuApi = {
  // Get all service menus
  getAll: async (): Promise<ServiceMenu[]> => {
    const response = await apiClient.get<ServiceMenu[]>('/service-menus');
    return response.data;
  },

  // Get service menu by ID
  getById: async (id: number): Promise<ServiceMenu> => {
    const response = await apiClient.get<ServiceMenu>(`/service-menus/${id}`);
    return response.data;
  },

  // Create service menu
  create: async (data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.post<ServiceMenu>('/service-menus', data);
    return response.data;
  },

  // Update service menu
  update: async (id: number, data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.put<ServiceMenu>(`/service-menus/${id}`, data);
    return response.data;
  },

  // Delete service menu
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-menus/${id}`);
  },
};

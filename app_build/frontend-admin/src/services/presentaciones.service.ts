import { api } from '../api/axios';
import type { Presentacion } from '../types/models';

export const presentacionService = {
  getAll: async (params?: any) => {
    const response = await api.get<Presentacion[]>('/presentaciones/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Presentacion>(`/presentaciones/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Presentacion>) => {
    const response = await api.post<Presentacion>('/presentaciones/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Presentacion>) => {
    const response = await api.put<Presentacion>(`/presentaciones/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/presentaciones/${id}/`);
  },
};

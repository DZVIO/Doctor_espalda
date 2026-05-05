import { api } from '../api/axios';
import type { Tratamiento } from '../types/models';

export const tratamientoService = {
  getAll: async (params?: any) => {
    const response = await api.get<Tratamiento[]>('/tratamientos/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Tratamiento>(`/tratamientos/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Tratamiento>) => {
    const response = await api.post<Tratamiento>('/tratamientos/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Tratamiento>) => {
    const response = await api.put<Tratamiento>(`/tratamientos/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/tratamientos/${id}/`);
  },
};

import { api } from '../api/axios';
import type { Agendamiento } from '../types/models';

export const agendamientoService = {
  getAll: async (params?: any) => {
    const response = await api.get<Agendamiento[]>('/agendamientos/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Agendamiento>(`/agendamientos/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Agendamiento>) => {
    const response = await api.post<Agendamiento>('/agendamientos/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Agendamiento>) => {
    const response = await api.put<Agendamiento>(`/agendamientos/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/agendamientos/${id}/`);
  },
};

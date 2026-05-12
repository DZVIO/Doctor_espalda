import { api } from '../api/axios';
import type { Marca } from '../types/models';

export const marcaService = {
  getAll: async (params?: any) => {
    const response = await api.get<Marca[]>('/marcas/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Marca>(`/marcas/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Marca>) => {
    const response = await api.post<Marca>('/marcas/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Marca>) => {
    const response = await api.put<Marca>(`/marcas/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/marcas/${id}/`);
  },
};

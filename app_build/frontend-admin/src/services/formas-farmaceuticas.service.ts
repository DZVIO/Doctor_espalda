import { api } from '../api/axios';
import type { FormaFarmaceutica } from '../types/models';

export const formaFarmaceuticaService = {
  getAll: async (params?: any) => {
    const response = await api.get<FormaFarmaceutica[]>('/formas-farmaceuticas/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<FormaFarmaceutica>(`/formas-farmaceuticas/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FormaFarmaceutica>) => {
    const response = await api.post<FormaFarmaceutica>('/formas-farmaceuticas/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FormaFarmaceutica>) => {
    const response = await api.put<FormaFarmaceutica>(`/formas-farmaceuticas/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/formas-farmaceuticas/${id}/`);
  },
};

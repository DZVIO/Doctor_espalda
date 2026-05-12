import { api } from '../api/axios';
import type { UnidadMedida } from '../types/models';

export const unidadMedidaService = {
  getAll: async (params?: any) => {
    const response = await api.get<UnidadMedida[]>('/unidades-medida/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<UnidadMedida>(`/unidades-medida/${id}/`);
    return response.data;
  },
  create: async (data: Partial<UnidadMedida>) => {
    const response = await api.post<UnidadMedida>('/unidades-medida/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<UnidadMedida>) => {
    const response = await api.put<UnidadMedida>(`/unidades-medida/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/unidades-medida/${id}/`);
  },
};

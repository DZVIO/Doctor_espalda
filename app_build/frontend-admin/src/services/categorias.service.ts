import { api } from '../api/axios';
import type { Categoria } from '../types/models';

const BASE_URL = '/categorias/';

export const categoriaService = {
  getAll: async (params?: Record<string, any>) => {
    const response = await api.get<Categoria[]>(BASE_URL, { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Categoria>(`${BASE_URL}${id}/`);
    return response.data;
  },

  create: async (data: Partial<Categoria>) => {
    const response = await api.post<Categoria>(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Categoria>) => {
    const response = await api.put<Categoria>(`${BASE_URL}${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${BASE_URL}${id}/`);
    return response.data;
  }
};

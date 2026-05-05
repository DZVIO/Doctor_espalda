import { api } from '../api/axios';
import type { Medicamento } from '../types/models';

export const medicamentoService = {
  getAll: async (params?: any) => {
    const response = await api.get<Medicamento[]>('/medicamentos/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Medicamento>(`/medicamentos/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Medicamento>) => {
    const response = await api.post<Medicamento>('/medicamentos/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Medicamento>) => {
    const response = await api.put<Medicamento>(`/medicamentos/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/medicamentos/${id}/`);
  },
};

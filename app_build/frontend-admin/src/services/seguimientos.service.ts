import { api } from '../api/axios';
import type { Seguimiento } from '../types/models';

export const seguimientoService = {
  getAll: async (params?: any) => {
    const response = await api.get<Seguimiento[]>('/seguimientos/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Seguimiento>(`/seguimientos/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Seguimiento>) => {
    const response = await api.post<Seguimiento>('/seguimientos/', data);
    return response.data;
  },
  addDetalle: async (seguimientoId: number, data: any) => {
    const response = await api.post(`/seguimientos/${seguimientoId}/detalles/`, data);
    return response.data;
  },
  removeDetalle: async (seguimientoId: number, detalleId: number) => {
    const response = await api.delete(`/seguimientos/${seguimientoId}/detalles/${detalleId}/`);
    return response.data;
  },
};

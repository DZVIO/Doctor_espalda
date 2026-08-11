import { api } from '../api/axios';
import type { Sesion } from '../types/models';

export const sesionService = {
  getAll: async (params?: any) => {
    const response = await api.get<Sesion[]>('/sesiones/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Sesion>(`/sesiones/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Sesion>) => {
    const response = await api.post<Sesion>('/sesiones/', data);
    return response.data;
  },
  addDetalle: async (sesionId: number, data: any) => {
    const response = await api.post(`/sesiones/${sesionId}/detalles/`, data);
    return response.data;
  },
  updateDetalle: async (sesionId: number, detalleId: number, data: any) => {
    const response = await api.put(`/sesiones/${sesionId}/detalles/${detalleId}/`, data);
    return response.data;
  },
  removeDetalle: async (sesionId: number, detalleId: number) => {
    const response = await api.delete(`/sesiones/${sesionId}/detalles/${detalleId}/`);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/sesiones/${id}/`);
    return response.data;
  },
};

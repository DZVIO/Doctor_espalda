import { api } from '../api/axios';
import type { Paciente } from '../types/models';

export const pacienteService = {
  getAll: async (params?: any) => {
    const response = await api.get<Paciente[]>('/pacientes/', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Paciente>(`/pacientes/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Paciente>) => {
    const response = await api.post<Paciente>('/pacientes/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Paciente>) => {
    const response = await api.put<Paciente>(`/pacientes/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/pacientes/${id}/`);
  },
};

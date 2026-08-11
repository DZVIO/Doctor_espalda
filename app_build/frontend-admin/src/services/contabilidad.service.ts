import { api } from '../api/axios';
import type { Pago, MetricasFinancieras } from '../types/models';

export const contabilidadService = {
  getAll: async (params?: any) => {
    const response = await api.get<Pago[]>('/contabilidad/pagos/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Pago>(`/contabilidad/pagos/${id}/`);
    return response.data;
  },
  
  confirmar: async (id: number, data: { metodo_pago: string; monto_pagado: number; observaciones?: string }) => {
    const response = await api.patch<Pago>(`/contabilidad/pagos/${id}/confirmar/`, data);
    return response.data;
  },
  
  pagarCompleto: async (id: number, data: { metodo_pago: string }) => {
    const response = await api.patch<Pago>(`/contabilidad/pagos/${id}/pagar_completo/`, data);
    return response.data;
  },
  
  getMetricas: async () => {
    const response = await api.get<MetricasFinancieras>('/contabilidad/metricas/');
    return response.data;
  }
};

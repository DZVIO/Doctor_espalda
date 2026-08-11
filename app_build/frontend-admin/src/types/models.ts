export interface ApiError {
  error: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface Administrador {
  id: number;
  usuario: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  created_at: string;
  updated_at: string;
}

export interface FormaFarmaceutica {
  id: number;
  forma: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface UnidadMedida {
  id: number;
  unidad: string;
  abreviatura: string;
  tipo: 'masa' | 'volumen' | 'unidad' | 'otro';
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Marca {
  id: number;
  marca: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  categoria: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Presentacion {
  id: number;
  forma_farmaceutica: number;
  forma_farmaceutica_detalle?: FormaFarmaceutica;
  concentracion: string;
  unidad_medida: number;
  unidad_medida_detalle?: UnidadMedida;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion: string;
  marca: number | null;
  marca_detalle?: Marca;
  categoria: number | null;
  categoria_detalle?: Categoria;
  presentacion: number | null;
  presentacion_detalle?: Presentacion;
  stock: number;
  precio: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Tratamiento {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  numero: string;
  region?: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface SesionMini {
  id: number;
  fecha: string;
  total: string;
  tratamientos: { nombre: string; precio: string }[];
  medicamentos: { nombre: string; precio: string; cantidad: number }[];
}

export interface Agendamiento {
  id: number;
  fecha: string;
  hora_ingreso: string;
  hora_salida: string;
  id_paciente: number;
  paciente_nombre?: string;
  sesiones?: SesionMini[];
  created_at: string;
  updated_at: string;
}

export interface DetalleSesion {
  id?: number;
  id_sesion?: number;
  id_tratamiento?: number | null;
  id_medicamento?: number | null;
  cantidad: number;
  tratamiento_detalle?: { id: number; nombre: string; precio: string };
  medicamento_detalle?: { id: number; nombre: string; precio: string };
  created_at?: string;
  updated_at?: string;
}

export interface Sesion {
  id?: number;
  fecha: string;
  hora: string;
  total?: string;
  id_paciente: number;
  id_agendamiento?: number | null;
  detalles?: DetalleSesion[];
  estado_pago?: 'pendiente' | 'pagado' | 'parcial' | 'sin_pago';
  saldo_pendiente?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Pago {
  id: number;
  id_sesion: number;
  sesion: {
    id: number;
    fecha: string;
    hora: string;
    total: string;
    id_paciente: {
      id: number;
      nombre: string;
      apellido: string;
      cedula: string;
    };
    detalles: {
      id: number;
      tratamiento_nombre: string | null;
      medicamento_nombre: string | null;
      cantidad: number;
    }[];
  };
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | null;
  estado_pago: 'pendiente' | 'pagado' | 'parcial';
  monto_pagado: string;
  saldo_pendiente: string;
  fecha_pago: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricasFinancieras {
  total_ingresos_hoy: number;
  total_ingresos_semana: number;
  total_ingresos_mes: number;
  total_pendiente: number;
  cantidad_pendientes: number;
  ingresos_por_dia: { fecha: string; total: number }[];
  distribucion_metodo_pago: { metodo_pago: string; cantidad: number; total: number }[];
}

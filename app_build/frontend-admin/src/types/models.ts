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

export interface Presentacion {
  id: number;
  forma_farmaceutica: number;
  forma_farmaceutica_detalle?: FormaFarmaceutica;
  cantidad: string;
  concentracion: string | null;
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
  presentacion: number | null;
  presentacion_detalle?: Presentacion;
  cantidad: number;
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

export interface SeguimientoMini {
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
  seguimientos?: SeguimientoMini[];
  created_at: string;
  updated_at: string;
}

export interface DetalleSeguimiento {
  id?: number;
  id_venta?: number;
  id_tratamiento?: number | null;
  id_medicamento?: number | null;
  cantidad: number;
  tratamiento_detalle?: { id: number; nombre: string; precio: string };
  medicamento_detalle?: { id: number; nombre: string; precio: string };
  created_at?: string;
  updated_at?: string;
}

export interface Seguimiento {
  id?: number;
  fecha: string;
  hora: string;
  total?: string;
  id_paciente: number;
  id_agendamiento?: number | null;
  detalles?: DetalleSeguimiento[];
  created_at?: string;
  updated_at?: string;
}

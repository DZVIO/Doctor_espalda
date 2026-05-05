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

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion: string;
  presentacion: string;
  unidad_medida: string;
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
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Agendamiento {
  id: number;
  fecha: string;
  hora_ingreso: string;
  hora_salida: string;
  id_paciente: number;
  paciente_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface Seguimiento {
  id: number;
  fecha: string;
  hora: string;
  precio: string;
  id_paciente: number;
  id_tratamiento: number;
  id_medicamento: number | null;
  created_at: string;
  updated_at: string;
}

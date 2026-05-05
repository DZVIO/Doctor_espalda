import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { seguimientoService } from '../../services/seguimientos.service';
import { pacienteService } from '../../services/pacientes.service';
import { tratamientoService } from '../../services/tratamientos.service';
import { medicamentoService } from '../../services/medicamentos.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Paciente, Tratamiento, Medicamento, Seguimiento } from '../../types/models';

export const SeguimientoForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPacienteId = location.state?.pacienteId || '';

  const [formData, setFormData] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    precio: '0.00',
    id_paciente: initialPacienteId ? parseInt(initialPacienteId) : '',
    id_tratamiento: '',
    id_medicamento: null,
  });

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const { loading: saving, error, request } = useApi();
  const { request: fetchPacientes } = useApi();
  const { request: fetchTratamientos } = useApi();
  const { request: fetchMedicamentos } = useApi();

  useEffect(() => {
    fetchPacientes(pacienteService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setPacientes(data),
    });
    fetchTratamientos(tratamientoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setTratamientos(data),
    });
    fetchMedicamentos(medicamentoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setMedicamentos(data),
    });
  }, [fetchPacientes, fetchTratamientos, fetchMedicamentos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'id_tratamiento') {
      const selectedTrat = tratamientos.find(t => t.id === parseInt(value));
      setFormData((prev: any) => ({ 
        ...prev, 
        [name]: value ? parseInt(value) : '',
        precio: selectedTrat ? selectedTrat.precio : prev.precio 
      }));
    } else if (name === 'id_paciente' || name === 'id_medicamento') {
      setFormData((prev: any) => ({ 
        ...prev, 
        [name]: value ? parseInt(value) : null 
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await request(seguimientoService.create(formData as Seguimiento), {
      successMessage: 'Seguimiento registrado y stock actualizado',
      onSuccess: () => navigate(`/pacientes/${formData.id_paciente}`),
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Seguimiento</h1>
        <p className="text-sm text-gray-500">Este registro es inmutable y descuenta stock automáticamente.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <FormField label="Paciente *" id="id_paciente">
            <select
              name="id_paciente"
              id="id_paciente"
              value={formData.id_paciente}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              required
            >
              <option value="">Seleccione un paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tratamiento Aplicado *" id="id_tratamiento">
              <select
                name="id_tratamiento"
                id="id_tratamiento"
                value={formData.id_tratamiento}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
              >
                <option value="">Seleccione un tratamiento</option>
                {tratamientos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} (${t.precio})</option>
                ))}
              </select>
            </FormField>

            <FormField label="Medicamento Entregado (Opcional)" id="id_medicamento">
              <select
                name="id_medicamento"
                id="id_medicamento"
                value={formData.id_medicamento || ''}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="">Ninguno</option>
                {medicamentos.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.cantidad <= 0}>
                    {m.nombre} ({m.cantidad} disponibles)
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Fecha" id="fecha">
              <input
                type="date"
                name="fecha"
                id="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </FormField>

            <FormField label="Hora" id="hora">
              <input
                type="time"
                name="hora"
                id="hora"
                value={formData.hora}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </FormField>

            <FormField label="Precio Cobrado *" id="precio">
              <input
                type="number"
                step="0.01"
                name="precio"
                id="precio"
                value={formData.precio}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <LoadingButton type="submit" loading={saving}>
              Registrar Seguimiento
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

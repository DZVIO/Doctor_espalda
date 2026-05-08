import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { agendamientoService } from '../../services/agendamientos.service';
import { pacienteService } from '../../services/pacientes.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Agendamiento, Paciente } from '../../types/models';

export const CitaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  
  const initialPacienteId = location.state?.pacienteId || '';

  const [formData, setFormData] = useState<Partial<Agendamiento>>({
    fecha: new Date().toISOString().split('T')[0],
    hora_ingreso: '',
    hora_salida: '',
    id_paciente: initialPacienteId,
  });

  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const { loading: saving, error, request } = useApi();
  const { loading: fetching, request: fetchRequest } = useApi();
  const { request: fetchPacientes } = useApi();

  useEffect(() => {
    fetchPacientes(pacienteService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setPacientes(data),
    });

    if (isEdit && id) {
      fetchRequest(agendamientoService.getById(parseInt(id)), {
        onSuccess: (data) => setFormData(data),
      });
    }
  }, [isEdit, id, fetchRequest, fetchPacientes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiCall = isEdit 
      ? agendamientoService.update(parseInt(id!), formData)
      : agendamientoService.create(formData);

    await request(apiCall, {
      successMessage: `Cita ${isEdit ? 'actualizada' : 'agendada'} correctamente`,
      onSuccess: () => navigate('/citas'),
    });
  };

  if (fetching) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Cita' : 'Nueva Cita'}
          </h1>
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
                disabled={isEdit}
              >
                <option value="">Seleccione un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} ({p.cedula})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Fecha *" id="fecha">
              <input
                type="date"
                name="fecha"
                id="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Hora de Ingreso *" id="hora_ingreso">
                <input
                  type="time"
                  name="hora_ingreso"
                  id="hora_ingreso"
                  value={formData.hora_ingreso}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </FormField>

              <FormField label="Hora de Salida *" id="hora_salida">
                <input
                  type="time"
                  name="hora_salida"
                  id="hora_salida"
                  value={formData.hora_salida}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </FormField>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/citas')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <LoadingButton type="submit" loading={saving}>
                {isEdit ? 'Guardar Cambios' : 'Agendar Cita'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

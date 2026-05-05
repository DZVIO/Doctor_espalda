import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pacienteService } from '../../services/pacientes.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Paciente } from '../../types/models';

export const PacienteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Paciente>>({
    nombre: '',
    apellido: '',
    cedula: '',
    correo: '',
    numero: '',
    estado: 'activo',
  });

  const { loading: saving, error, request } = useApi();
  const { loading: fetching, request: fetchRequest } = useApi();

  useEffect(() => {
    if (isEdit && id) {
      fetchRequest(pacienteService.getById(parseInt(id)), {
        onSuccess: (data) => setFormData(data),
      });
    }
  }, [isEdit, id, fetchRequest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiCall = isEdit 
      ? pacienteService.update(parseInt(id!), formData)
      : pacienteService.create(formData);

    await request(apiCall, {
      successMessage: `Paciente ${isEdit ? 'actualizado' : 'creado'} correctamente`,
      onSuccess: () => navigate('/pacientes'),
    });
  };

  if (fetching) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre *" id="nombre">
              <input
                type="text"
                name="nombre"
                id="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </FormField>

            <FormField label="Apellido *" id="apellido">
              <input
                type="text"
                name="apellido"
                id="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </FormField>
          </div>

          <FormField label="Cédula *" id="cedula">
            <input
              type="text"
              name="cedula"
              id="cedula"
              value={formData.cedula}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </FormField>

          <FormField label="Correo Electrónico" id="correo">
            <input
              type="email"
              name="correo"
              id="correo"
              value={formData.correo || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </FormField>

          <FormField label="Teléfono" id="numero">
            <input
              type="text"
              name="numero"
              id="numero"
              value={formData.numero || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </FormField>

          <FormField label="Estado" id="estado">
            <select
              name="estado"
              id="estado"
              value={formData.estado}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </FormField>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/pacientes')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <LoadingButton type="submit" loading={saving}>
              {isEdit ? 'Guardar Cambios' : 'Crear Paciente'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

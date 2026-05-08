import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tratamientoService } from '../../services/tratamientos.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Tratamiento } from '../../types/models';

export const TratamientoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Tratamiento>>({
    nombre: '',
    descripcion: '',
    precio: '0.00',
    estado: 'activo',
  });

  const { loading: saving, error, request } = useApi();
  const { loading: fetching, request: fetchRequest } = useApi();

  useEffect(() => {
    if (isEdit && id) {
      fetchRequest(tratamientoService.getById(parseInt(id)), {
        onSuccess: (data) => setFormData(data),
      });
    }
  }, [isEdit, id, fetchRequest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiCall = isEdit 
      ? tratamientoService.update(parseInt(id!), formData)
      : tratamientoService.create(formData);

    await request(apiCall, {
      successMessage: `Tratamiento ${isEdit ? 'actualizado' : 'creado'} correctamente`,
      onSuccess: () => navigate('/tratamientos'),
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
            {isEdit ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
          </h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

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

            <FormField label="Descripción" id="descripcion">
              <textarea
                name="descripcion"
                id="descripcion"
                value={formData.descripcion || ''}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </FormField>

            <FormField label="Precio *" id="precio">
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

            <FormField label="Estado" id="estado">
              <select
                name="estado"
                id="estado"
                value={formData.estado}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </FormField>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/tratamientos')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <LoadingButton type="submit" loading={saving}>
                {isEdit ? 'Guardar Cambios' : 'Crear Tratamiento'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

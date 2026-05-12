import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { medicamentoService } from '../../services/medicamentos.service';
import { marcaService } from '../../services/marcas.service';
import { presentacionService } from '../../services/presentaciones.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Medicamento, Marca, Presentacion } from '../../types/models';

export const MedicamentoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Medicamento>>({
    nombre: '',
    descripcion: '',
    marca: null,
    presentacion: null,
    cantidad: 0,
    precio: '0.00',
    estado: 'activo',
  });

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);

  const { loading: saving, error, setError, request } = useApi();
  const { loading: fetching, request: fetchRequest } = useApi();
  const { request: lookupRequest } = useApi();

  useEffect(() => {
    lookupRequest(marcaService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setMarcas(data),
    });
    lookupRequest(presentacionService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setPresentaciones(data),
    });

    if (isEdit && id) {
      fetchRequest(medicamentoService.getById(parseInt(id)), {
        onSuccess: (data) => setFormData(data),
      });
    }
  }, [isEdit, id, fetchRequest, lookupRequest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Handle integer parsing for foreign keys
    if (name === 'marca' || name === 'presentacion') {
        const val = value ? parseInt(value) : null;
        setFormData((prev) => ({ ...prev, [name]: val }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    const dataToSend = {
      ...formData,
      marca: formData.marca || null,
      presentacion: formData.presentacion || null,
    };

    const apiCall = isEdit 
      ? medicamentoService.update(parseInt(id!), dataToSend)
      : medicamentoService.create(dataToSend);

    await request(apiCall, {
      successMessage: `Medicamento ${isEdit ? 'actualizado' : 'creado'} correctamente`,
      onSuccess: () => navigate('/inventario'),
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
            {isEdit ? 'Editar Medicamento' : 'Nuevo Medicamento'}
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
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Marca" id="marca">
                <select
                  name="marca"
                  id="marca"
                  value={formData.marca || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                  <option value="">Seleccione una marca</option>
                  {marcas.map(m => (
                    <option key={m.id} value={m.id}>{m.marca}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Presentación" id="presentacion">
                <select
                  name="presentacion"
                  id="presentacion"
                  value={formData.presentacion || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                  <option value="">Seleccione una presentación</option>
                  {presentaciones.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.forma_farmaceutica_detalle?.forma} · {p.cantidad} · {p.unidad_medida_detalle?.abreviatura}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Cantidad en Stock" id="cantidad">
                <input
                  type="number"
                  name="cantidad"
                  id="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
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
            </div>

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
                onClick={() => navigate('/inventario')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <LoadingButton type="submit" loading={saving}>
                {isEdit ? 'Guardar Cambios' : 'Crear Medicamento'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

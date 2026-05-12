import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { presentacionService } from '../../services/presentaciones.service';
import { formaFarmaceuticaService } from '../../services/formas-farmaceuticas.service';
import { unidadMedidaService } from '../../services/unidades-medida.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Presentacion, FormaFarmaceutica, UnidadMedida } from '../../types/models';

export const PresentacionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Presentacion>>({
    forma_farmaceutica: 0,
    cantidad: '',
    concentracion: '',
    unidad_medida: 0,
    estado: 'activo',
  });

  const [formas, setFormas] = useState<FormaFarmaceutica[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  const { loading: saving, error, request } = useApi();
  const { loading: fetching, request: fetchRequest } = useApi();
  const { request: lookupRequest } = useApi();

  useEffect(() => {
    // Load lookup data
    lookupRequest(formaFarmaceuticaService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setFormas(data),
    });
    lookupRequest(unidadMedidaService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setUnidades(data),
    });

    if (isEdit && id) {
      fetchRequest(presentacionService.getById(parseInt(id)), {
        onSuccess: (data) => setFormData(data),
      });
    }
  }, [isEdit, id, fetchRequest, lookupRequest]);

  // Set default values if new
  useEffect(() => {
    if (!isEdit && formas.length > 0 && formData.forma_farmaceutica === 0) {
      setFormData(prev => ({ ...prev, forma_farmaceutica: formas[0].id }));
    }
    if (!isEdit && unidades.length > 0 && formData.unidad_medida === 0) {
      setFormData(prev => ({ ...prev, unidad_medida: unidades[0].id }));
    }
  }, [isEdit, formas, unidades, formData.forma_farmaceutica, formData.unidad_medida]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = (name === 'forma_farmaceutica' || name === 'unidad_medida') ? parseInt(value) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.forma_farmaceutica === 0 || formData.unidad_medida === 0) {
        return;
    }

    const dataToSend = {
      ...formData,
      concentracion: formData.concentracion || null,
    };

    const apiCall = isEdit 
      ? presentacionService.update(parseInt(id!), dataToSend)
      : presentacionService.create(dataToSend);

    await request(apiCall, {
      successMessage: `Presentación ${isEdit ? 'actualizada' : 'creada'} correctamente`,
      onSuccess: () => navigate('/inventario/presentaciones'),
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
            {isEdit ? 'Editar Presentación' : 'Nueva Presentación'}
          </h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <FormField label="Forma Farmacéutica *" id="forma_farmaceutica">
              <select
                name="forma_farmaceutica"
                id="forma_farmaceutica"
                value={formData.forma_farmaceutica}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
              >
                <option value={0} disabled>Seleccione una opción</option>
                {formas.map(f => (
                  <option key={f.id} value={f.id}>{f.forma}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Cantidad *" id="cantidad">
                <input
                  type="number"
                  step="0.01"
                  name="cantidad"
                  id="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                  placeholder="Ej: 500"
                />
              </FormField>

              <FormField label="Unidad de Medida *" id="unidad_medida">
                <select
                  name="unidad_medida"
                  id="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  required
                >
                  <option value={0} disabled>Seleccione</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.abreviatura} - {u.unidad}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Concentración (Opcional)" id="concentracion">
              <input
                type="text"
                name="concentracion"
                id="concentracion"
                value={formData.concentracion || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: 500mg/5ml"
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
                onClick={() => navigate('/inventario/presentaciones')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <LoadingButton type="submit" loading={saving}>
                {isEdit ? 'Guardar Cambios' : 'Crear Presentación'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

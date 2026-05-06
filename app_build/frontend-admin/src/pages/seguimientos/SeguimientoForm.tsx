import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { seguimientoService } from '../../services/seguimientos.service';
import { pacienteService } from '../../services/pacientes.service';
import { tratamientoService } from '../../services/tratamientos.service';
import { medicamentoService } from '../../services/medicamentos.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { useApi } from '../../hooks/useApi';
import type { Paciente, Tratamiento, Medicamento } from '../../types/models';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type FormValues = {
  fecha: string;
  hora: string;
  tratamientos: { id_tratamiento: number }[];
  medicamentos: { id_medicamento: number, cantidad: number }[];
};

export const SeguimientoForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPacienteId = location.state?.pacienteId || '';

  const { register, control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      tratamientos: [],
      medicamentos: []
    }
  });

  const { fields: tratFields, append: appendTrat, remove: removeTrat } = useFieldArray({
    control,
    name: 'tratamientos'
  });

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control,
    name: 'medicamentos'
  });

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [tratamientosDisponibles, setTratamientosDisponibles] = useState<Tratamiento[]>([]);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState<Medicamento[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { loading: loadingPaciente, request: fetchPaciente } = useApi();
  const { loading: loadingTrat, request: fetchTratamientos } = useApi();
  const { loading: loadingMed, request: fetchMedicamentos } = useApi();

  useEffect(() => {
    if (initialPacienteId) {
      fetchPaciente(pacienteService.getById(parseInt(initialPacienteId)), {
        onSuccess: (data) => setPaciente(data),
      });
    } else {
      navigate('/pacientes');
    }

    fetchTratamientos(tratamientoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setTratamientosDisponibles(data),
    });
    fetchMedicamentos(medicamentoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setMedicamentosDisponibles(data),
    });
  }, [initialPacienteId, fetchPaciente, fetchTratamientos, fetchMedicamentos, navigate]);

  // Watch to calculate total
  const watchTrats = watch('tratamientos');
  const watchMeds = watch('medicamentos');

  const [total, setTotal] = useState('0.00');

  useEffect(() => {
    let sum = 0;
    watchTrats.forEach(t => {
      if (t.id_tratamiento) {
        const trat = tratamientosDisponibles.find(x => x.id === Number(t.id_tratamiento));
        if (trat) sum += parseFloat(trat.precio);
      }
    });

    watchMeds.forEach(m => {
      if (m.id_medicamento && m.cantidad) {
        const med = medicamentosDisponibles.find(x => x.id === Number(m.id_medicamento));
        if (med) sum += (parseFloat(med.precio) * Number(m.cantidad));
      }
    });

    setTotal(sum.toFixed(2));
  }, [watchTrats, watchMeds, tratamientosDisponibles, medicamentosDisponibles]);

  const [tratSeleccionado, setTratSeleccionado] = useState('');
  const [medSeleccionado, setMedSeleccionado] = useState('');

  const agregarTratamiento = () => {
    if (!tratSeleccionado) return;
    if (tratFields.some(t => t.id_tratamiento === Number(tratSeleccionado))) {
      toast.error('Este tratamiento ya fue agregado.');
      return;
    }
    appendTrat({ id_tratamiento: Number(tratSeleccionado) });
    setTratSeleccionado('');
  };

  const agregarMedicamento = () => {
    if (!medSeleccionado) return;
    if (medFields.some(m => m.id_medicamento === Number(medSeleccionado))) {
      toast.error('Este medicamento ya fue agregado.');
      return;
    }
    appendMed({ id_medicamento: Number(medSeleccionado), cantidad: 1 });
    setMedSeleccionado('');
  };

  const onSubmit = async (data: FormValues) => {
    if (data.tratamientos.length === 0 && data.medicamentos.length === 0) {
      setSaveError("Debe agregar al menos un tratamiento o medicamento.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Crear Seguimiento
      const seguimientoPayload = {
        fecha: data.fecha,
        hora: data.hora,
        id_paciente: paciente!.id,
      };
      const segCreado = await seguimientoService.create(seguimientoPayload);
      const segId = segCreado.id!;

      // 2. Crear Tratamientos
      for (const t of data.tratamientos) {
        await seguimientoService.addDetalle(segId, { id_tratamiento: t.id_tratamiento });
      }

      // 3. Crear Medicamentos
      for (const m of data.medicamentos) {
        await seguimientoService.addDetalle(segId, { id_medicamento: m.id_medicamento, cantidad: m.cantidad });
      }

      toast.success('Seguimiento registrado exitosamente.');
      navigate(`/pacientes/${paciente!.id}`);

    } catch (err: any) {
      console.error(err);
      setSaveError(err.response?.data?.error || err.message || "Error al guardar el seguimiento.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPaciente || loadingTrat || loadingMed) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse flex space-x-4">
        <div className="flex-1 space-y-6 py-1">
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Seguimiento</h1>
        <p className="text-sm text-gray-500">Agregue tratamientos y medicamentos de forma independiente.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {saveError}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Paciente</label>
              <input
                type="text"
                value={`${paciente?.nombre} ${paciente?.apellido}`}
                className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm p-2 text-gray-700 sm:text-sm"
                readOnly
              />
            </div>
            <div>
              <FormField label="Fecha *" id="fecha">
                <input
                  type="date"
                  {...register('fecha', { required: 'Fecha requerida' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </FormField>
            </div>
            <div>
              <FormField label="Hora *" id="hora">
                <input
                  type="time"
                  {...register('hora', { required: 'Hora requerida' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Sección Tratamientos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tratamientos</h2>
          
          {tratFields.length > 0 && (
            <div className="mb-4 space-y-2">
              {tratFields.map((field, index) => {
                const tr = tratamientosDisponibles.find(x => x.id === Number(watchTrats[index]?.id_tratamiento));
                return (
                  <div key={field.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">{tr?.nombre}</span>
                      <span className="ml-4 text-sm text-gray-500">${tr?.precio}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTrat(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={tratSeleccionado}
              onChange={(e) => setTratSeleccionado(e.target.value)}
              className="block w-full md:w-1/2 border-gray-300 rounded-md border focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
            >
              <option value="">Seleccione un tratamiento...</option>
              {tratamientosDisponibles.map(t => (
                <option key={t.id} value={t.id}>{t.nombre} - ${t.precio}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={agregarTratamiento}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar
            </button>
          </div>
        </div>

        {/* Sección Medicamentos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medicamentos Entregados</h2>
          
          {medFields.length > 0 && (
            <div className="mb-4 space-y-2">
              {medFields.map((field, index) => {
                const mId = watchMeds[index]?.id_medicamento;
                const mQty = watchMeds[index]?.cantidad;
                const med = medicamentosDisponibles.find(x => x.id === Number(mId));
                const subtotal = med ? (parseFloat(med.precio) * Number(mQty)).toFixed(2) : '0.00';

                return (
                  <div key={field.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200 gap-4">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{med?.nombre}</span>
                      <span className="ml-4 text-sm text-gray-500">${med?.precio} c/u</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Cant:</label>
                      <input
                        type="number"
                        min="1"
                        max={med?.cantidad}
                        {...register(`medicamentos.${index}.cantidad` as const, { required: true, min: 1 })}
                        className="w-20 border border-gray-300 rounded-md p-1 text-center"
                      />
                    </div>
                    <div className="w-24 text-right font-medium text-gray-900">
                      ${subtotal}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMed(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={medSeleccionado}
              onChange={(e) => setMedSeleccionado(e.target.value)}
              className="block w-full md:w-1/2 border-gray-300 rounded-md border focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
            >
              <option value="">Seleccione un medicamento...</option>
              {medicamentosDisponibles.filter(m => m.cantidad > 0).map(m => (
                <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.cantidad}) - ${m.precio}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={agregarMedicamento}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar
            </button>
          </div>
        </div>

        {/* Resumen Final */}
        <div className="bg-gray-800 shadow rounded-lg p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Total a Cobrar</h3>
            <p className="text-gray-400 text-sm">Calculado automáticamente</p>
          </div>
          <div className="text-3xl font-bold">
            ${total}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <LoadingButton type="submit" loading={isSaving}>
            Confirmar y Guardar Seguimiento
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { seguimientoService } from '../../services/seguimientos.service';
import { pacienteService } from '../../services/pacientes.service';
import { tratamientoService } from '../../services/tratamientos.service';
import { medicamentoService } from '../../services/medicamentos.service';
import { FormField } from '../../components/ui/FormField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useApi } from '../../hooks/useApi';
import type { Paciente, Tratamiento, Medicamento } from '../../types/models';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/** Row shape for treatments added to the form */
interface FilaTratamiento {
  id_tratamiento: number;
  nombre: string;
  precio: number;
}

/** Row shape for medications added to the form */
interface FilaMedicamento {
  id_medicamento: number;
  nombre: string;
  precio_unitario: number;
  stock_disponible: number;
  cantidad: number;
}

type FormValues = {
  fecha: string;
  hora: string;
};

export const SeguimientoForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPacienteId = location.state?.pacienteId || '';
  const citaId = location.state?.citaId || null;
  const citaFecha = location.state?.citaFecha || '';
  const citaHora = location.state?.citaHora || '';

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      fecha: citaFecha || new Date().toISOString().split('T')[0],
      hora: citaHora || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    }
  });

  // Ensure form resets if location state changes (though rare in this flow, it's safer)
  useEffect(() => {
    if (citaFecha || citaHora) {
      reset({
        fecha: citaFecha || new Date().toISOString().split('T')[0],
        hora: citaHora || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      });
    }
  }, [citaFecha, citaHora, reset]);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [tratamientosDisponibles, setTratamientosDisponibles] = useState<Tratamiento[]>([]);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState<Medicamento[]>([]);

  // Row lists — own React state for immediate reactivity
  const [filasTratamiento, setFilasTratamiento] = useState<FilaTratamiento[]>([]);
  const [filasMedicamento, setFilasMedicamento] = useState<FilaMedicamento[]>([]);

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

  // ── Derived total — pure calculation, no own state ──
  const total = useMemo(() => {
    const tratSum = filasTratamiento.reduce((sum, f) => sum + f.precio, 0);
    const medSum = filasMedicamento.reduce(
      (sum, f) => sum + (f.precio_unitario * f.cantidad), 0
    );
    const result = tratSum + medSum;
    return isNaN(result) ? '0.00' : result.toFixed(2);
  }, [filasTratamiento, filasMedicamento]);

  // ── Selectors for dropdowns ──
  const [tratSeleccionado, setTratSeleccionado] = useState<number | null>(null);
  const [medSeleccionado, setMedSeleccionado] = useState<number | null>(null);

  // Derive searchable options, disabling already-added items
  const tratamientoOptions = useMemo(() => {
    return tratamientosDisponibles.map(t => ({
      id: t.id,
      label: t.nombre,
      sublabel: `$${t.precio}`,
      disabled: filasTratamiento.some(f => f.id_tratamiento === t.id),
    }));
  }, [tratamientosDisponibles, filasTratamiento]);

  const medicamentoOptions = useMemo(() => {
    return medicamentosDisponibles
      .filter(m => m.cantidad > 0)
      .map(m => ({
        id: m.id,
        label: m.nombre,
        sublabel: `$${m.precio}  (Stock: ${m.cantidad})`,
        disabled: filasMedicamento.some(f => f.id_medicamento === m.id),
      }));
  }, [medicamentosDisponibles, filasMedicamento]);

  const agregarTratamiento = () => {
    if (!tratSeleccionado) return;
    const id = tratSeleccionado;
    if (filasTratamiento.some(f => f.id_tratamiento === id)) {
      toast.error('Este tratamiento ya fue agregado.');
      return;
    }
    const trat = tratamientosDisponibles.find(t => t.id === id);
    if (!trat) return;
    setFilasTratamiento(prev => [
      ...prev,
      {
        id_tratamiento: trat.id,
        nombre: trat.nombre,
        precio: parseFloat(trat.precio),
      }
    ]);
    setTratSeleccionado(null);
  };

  const quitarTratamiento = (index: number) => {
    setFilasTratamiento(prev => prev.filter((_, i) => i !== index));
  };

  const agregarMedicamento = () => {
    if (!medSeleccionado) return;
    const id = medSeleccionado;
    if (filasMedicamento.some(f => f.id_medicamento === id)) {
      toast.error('Este medicamento ya fue agregado.');
      return;
    }
    const med = medicamentosDisponibles.find(m => m.id === id);
    if (!med) return;
    setFilasMedicamento(prev => [
      ...prev,
      {
        id_medicamento: med.id,
        nombre: med.nombre,
        precio_unitario: parseFloat(med.precio),
        stock_disponible: med.cantidad,
        cantidad: 1,
      }
    ]);
    setMedSeleccionado(null);
  };

  const quitarMedicamento = (index: number) => {
    setFilasMedicamento(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handles quantity onChange for a medication row.
   * Converts to int, clamps to [1, stock_disponible], updates state immediately.
   */
  const handleCantidadChange = (index: number, rawValue: string) => {
    setFilasMedicamento(prev => {
      const next = [...prev];
      const fila = { ...next[index] };

      let parsed = parseInt(rawValue, 10);

      if (isNaN(parsed) || parsed < 1) {
        parsed = 1;
      }

      if (parsed > fila.stock_disponible) {
        parsed = fila.stock_disponible;
      }

      fila.cantidad = parsed;
      next[index] = fila;
      return next;
    });
  };

  const onSubmit = async (data: FormValues) => {
    if (filasTratamiento.length === 0 && filasMedicamento.length === 0) {
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
        id_agendamiento: citaId,
      };
      const segCreado = await seguimientoService.create(seguimientoPayload);
      const segId = segCreado.id!;

      // 2. Crear detalles de Tratamientos
      for (const f of filasTratamiento) {
        await seguimientoService.addDetalle(segId, { id_tratamiento: f.id_tratamiento });
      }

      // 3. Crear detalles de Medicamentos
      for (const f of filasMedicamento) {
        await seguimientoService.addDetalle(segId, { id_medicamento: f.id_medicamento, cantidad: f.cantidad });
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Seguimiento</h1>
        <p className="text-sm text-gray-500">Agregue tratamientos y medicamentos de forma independiente.</p>
        
        {citaId && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Cita Asociada</h3>
              <p className="mt-1 text-sm text-blue-600">
                Este seguimiento quedará vinculado automáticamente a la cita del <strong>{citaFecha}</strong> a las <strong>{citaHora}</strong>.
              </p>
            </div>
          </div>
        )}
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
                  readOnly={!!citaFecha}
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    citaFecha ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed font-medium' : 'bg-white border-gray-300'
                  }`}
                />
              </FormField>
            </div>
            <div>
              <FormField label="Hora *" id="hora">
                <input
                  type="time"
                  {...register('hora', { required: 'Hora requerida' })}
                  readOnly={!!citaHora}
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    citaHora ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed font-medium' : 'bg-white border-gray-300'
                  }`}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Sección Tratamientos ── */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tratamientos</h2>

          {filasTratamiento.length > 0 && (
            <div className="mb-4 space-y-2">
              {filasTratamiento.map((fila, index) => (
                <div key={fila.id_tratamiento} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                    <span className="font-medium text-gray-900">{fila.nombre}</span>
                    <span className="ml-4 text-sm text-gray-500">${fila.precio.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarTratamiento(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <SearchableSelect
              options={tratamientoOptions}
              value={tratSeleccionado}
              onChange={(id) => setTratSeleccionado(id || null)}
              placeholder="Buscar tratamiento por nombre, ID o precio..."
              emptyMessage="No hay tratamientos que coincidan"
              className="w-full md:w-1/2"
            />
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

        {/* ── Sección Medicamentos ── */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medicamentos Entregados</h2>

          {filasMedicamento.length > 0 && (
            <div className="mb-4 space-y-2">
              {filasMedicamento.map((fila, index) => {
                const subtotal = (fila.precio_unitario * fila.cantidad).toFixed(2);

                return (
                  <div key={fila.id_medicamento} className="flex flex-col bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{fila.nombre}</span>
                        <span className="ml-4 text-sm text-gray-500">${fila.precio_unitario.toFixed(2)} c/u</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Cant:</label>
                        <input
                          type="number"
                          min={1}
                          max={fila.stock_disponible}
                          value={fila.cantidad}
                          onChange={(e) => handleCantidadChange(index, e.target.value)}
                          className="w-20 border border-gray-300 rounded-md p-1 text-center"
                        />
                      </div>
                      <div className="w-24 text-right font-medium text-gray-900">
                        ${subtotal}
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarMedicamento(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Stock warning */}
                    {fila.cantidad >= fila.stock_disponible && (
                      <p className="text-xs text-amber-600 mt-1">
                        Stock disponible: {fila.stock_disponible} unidades.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <SearchableSelect
              options={medicamentoOptions}
              value={medSeleccionado}
              onChange={(id) => setMedSeleccionado(id || null)}
              placeholder="Buscar medicamento por nombre, ID o precio..."
              emptyMessage="No hay medicamentos que coincidan"
              className="w-full md:w-1/2"
            />
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

        {/* ── Resumen Final ── */}
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
  </div>
  );
};

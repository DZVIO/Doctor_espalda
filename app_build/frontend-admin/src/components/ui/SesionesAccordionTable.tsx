import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useApi } from '../../hooks/useApi';
import { tratamientoService } from '../../services/tratamientos.service';
import { medicamentoService } from '../../services/medicamentos.service';
import { sesionService } from '../../services/sesiones.service';
import { SearchableSelect } from './SearchableSelect';
import { formatDate } from '../../utils/dateUtils';
import type { Sesion, DetalleSesion, Tratamiento, Medicamento } from '../../types/models';

interface Props {
  sesiones: Sesion[];
  onRefresh: () => void;
  forceExpandId?: { id: number, signal: number } | null;
}

export const SesionesAccordionTable: React.FC<Props> = ({ sesiones, onRefresh, forceExpandId }) => {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { request } = useApi();

  const sortedSesiones = useMemo(() => {
    // Backend data is assumed to be in descending order by default
    if (sortOrder === 'desc') return sesiones;
    return [...sesiones].reverse();
  }, [sesiones, sortOrder]);

  useEffect(() => {
    // Load active treatments and medications for the selects
    request(tratamientoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setTratamientos(data),
      onError: () => {}
    });
    request(medicamentoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setMedicamentos(data),
      onError: () => {}
    });
  }, [request]);

  if (!sesiones || sesiones.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 italic">
        No hay historial de sesiones registradas
      </div>
    );
  }

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  Fecha
                  <button
                    onClick={toggleSort}
                    className="p-1 hover:bg-gray-200 rounded transition-colors focus:outline-none"
                    title={sortOrder === 'desc' ? 'Ver más antiguas primero' : 'Ver más recientes primero'}
                  >
                    {sortOrder === 'desc' ? (
                      <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tratamientos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Medicamentos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSesiones.map((ses) => (
              <SesionRow 
                key={ses.id} 
                sesion={ses} 
                tratamientosList={tratamientos}
                medicamentosList={medicamentos}
                onRefresh={onRefresh} 
                forceExpandSignal={forceExpandId?.id === ses.id ? forceExpandId?.signal : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface RowProps {
  sesion: Sesion;
  tratamientosList: Tratamiento[];
  medicamentosList: Medicamento[];
  onRefresh: () => void;
  forceExpandSignal?: number;
}

const SesionRow: React.FC<RowProps> = ({ sesion, tratamientosList, medicamentosList, onRefresh, forceExpandSignal }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { request, loading } = useApi();
  const rowRef = React.useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (forceExpandSignal !== undefined) {
      setExpanded(prev => !prev);
      
      // If we are expanding, scroll to it
      if (!expanded) {
        setTimeout(() => {
          rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [forceExpandSignal]);
  
  // Local state for editing details
  const [editTratamientos, setEditTratamientos] = useState<Partial<DetalleSesion>[]>([]);
  const [editMedicamentos, setEditMedicamentos] = useState<Partial<DetalleSesion>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tratamientos = sesion.detalles?.filter(d => d.id_tratamiento) || [];
  const medicamentos = sesion.detalles?.filter(d => d.id_medicamento) || [];

  const totalMedicamentos = medicamentos.reduce((sum, m) => sum + (m.cantidad || 0), 0);

  const handleExpand = () => {
    if (!isEditing) {
      setExpanded(!expanded);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    setIsEditing(true);
    setErrorMsg(null);
    // Clone current details to edit state
    setEditTratamientos(tratamientos.map(d => ({ ...d })));
    setEditMedicamentos(medicamentos.map(d => ({ ...d })));
  };

  const handleDeleteSesion = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sesion.id) return;
    
    if (window.confirm('¿Está seguro de eliminar toda la sesión? Esto restaurará el stock de los medicamentos.')) {
      await request(sesionService.delete(sesion.id), {
        successMessage: 'Sesión eliminada',
        onSuccess: onRefresh
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleSaveEdit = async () => {
    if (!sesion.id) return;
    setErrorMsg(null);
    
    try {
      const allEdits = [...editTratamientos, ...editMedicamentos];
      
      // Filter out completely empty rows
      const validEdits = allEdits.filter(d => d.id_tratamiento || d.id_medicamento);
      
      // First, find what to delete
      const currentIds = (sesion.detalles || []).map(d => d.id).filter(id => id);
      const newIds = validEdits.map(d => d.id).filter(id => id);
      const toDelete = currentIds.filter(id => !newIds.includes(id));
      
      // Prevent deleting the only detail if new ones aren't being added
      if (validEdits.length === 0) {
        setErrorMsg('Una sesión no puede quedar sin tratamientos ni medicamentos.');
        return;
      }

      // Execute deletes
      for (const id of toDelete) {
        if (id) await sesionService.removeDetalle(sesion.id, id);
      }

      // Execute updates and creates
      for (const det of validEdits) {
        if (det.id) {
          // Update
          const original = sesion.detalles?.find(d => d.id === det.id);
          if (
            original && 
            (original.id_tratamiento !== det.id_tratamiento || 
             original.id_medicamento !== det.id_medicamento || 
             original.cantidad !== det.cantidad)
          ) {
            await sesionService.updateDetalle(sesion.id, det.id, {
              id_tratamiento: det.id_tratamiento,
              id_medicamento: det.id_medicamento,
              cantidad: det.cantidad
            });
          }
        } else {
          // Create
          await sesionService.addDetalle(sesion.id, {
            id_tratamiento: det.id_tratamiento,
            id_medicamento: det.id_medicamento,
            cantidad: det.cantidad || 1
          });
        }
      }

      setIsEditing(false);
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar los cambios.');
    }
  };

  const updateTratamiento = (index: number, val: number) => {
    const newArr = [...editTratamientos];
    newArr[index] = { ...newArr[index], id_tratamiento: val || undefined };
    setEditTratamientos(newArr);
  };

  const removeTratamiento = (index: number) => {
    const newArr = [...editTratamientos];
    newArr.splice(index, 1);
    setEditTratamientos(newArr);
  };

  const updateMedicamento = (index: number, field: 'id_medicamento' | 'cantidad', val: number) => {
    const newArr = [...editMedicamentos];
    newArr[index] = { ...newArr[index], [field]: val || undefined };
    setEditMedicamentos(newArr);
  };

  const removeMedicamento = (index: number) => {
    const newArr = [...editMedicamentos];
    newArr.splice(index, 1);
    setEditMedicamentos(newArr);
  };

  return (
    <>
      {/* Main Row */}
      <tr 
        ref={rowRef}
        className={`hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/50' : ''} ${!isEditing ? 'cursor-pointer' : ''}`}
        onClick={handleExpand}
      >
        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
          {expanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
          {formatDate(sesion.fecha)} <span className="text-gray-500 text-xs ml-2">{sesion.hora}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {tratamientos.length}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {totalMedicamentos}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
          <div className="flex items-center space-x-2">
            <span>${sesion.total || '0.00'}</span>
            {(() => {
              switch (sesion.estado_pago) {
                case 'pagado':
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                      Pagado
                    </span>
                  );
                case 'parcial':
                  const pending = sesion.saldo_pendiente ? parseFloat(sesion.saldo_pendiente) : 0;
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title={`Saldo pendiente: $${pending.toFixed(2)}`}>
                      Parcial: ${pending.toFixed(0)}
                    </span>
                  );
                case 'pendiente':
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Pendiente
                    </span>
                  );
                default:
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      Sin pago
                    </span>
                  );
              }
            })()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={handleEditClick}
            disabled={isEditing}
            className={`text-blue-600 hover:text-blue-900 mr-4 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Editar Sesión"
          >
            <PencilIcon className="h-5 w-5 inline" />
          </button>
          <button
            onClick={handleDeleteSesion}
            disabled={isEditing}
            className={`text-red-600 hover:text-red-900 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Eliminar Sesión"
          >
            <TrashIcon className="h-5 w-5 inline" />
          </button>
        </td>
      </tr>

      {/* Expanded Content */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0 border-b border-gray-200 bg-gray-50 shadow-inner">
            <div className="px-8 py-6">
              
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tratamientos Sub-section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4">
                    Tratamientos Aplicados
                  </h4>
                  {isEditing ? (
                    <div className="space-y-3">
                      {editTratamientos.map((det, idx) => (
                        <div key={`edit-t-${idx}`} className="flex items-center gap-2">
                          <SearchableSelect
                            options={tratamientosList.map(t => {
                              const isSelectedByAnother = editTratamientos.some(
                                et => et.id_tratamiento === t.id && et.id_tratamiento !== det.id_tratamiento
                              );
                              return {
                                id: t.id,
                                label: t.nombre,
                                sublabel: `$${t.precio}`,
                                disabled: isSelectedByAnother,
                              };
                            })}
                            value={det.id_tratamiento ?? null}
                            onChange={(id) => updateTratamiento(idx, id)}
                            placeholder="Buscar tratamiento..."
                            emptyMessage="Sin resultados"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeTratamiento(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                            title="Eliminar Tratamiento"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditTratamientos([...editTratamientos, { cantidad: 1 }])}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" /> Agregar Tratamiento
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {tratamientos.length > 0 ? tratamientos.map((t, i) => (
                        <li key={i} className="flex justify-between items-center text-sm bg-white p-3 rounded shadow-sm border border-gray-100">
                          <span className="font-medium text-gray-800">{t.tratamiento_detalle?.nombre}</span>
                          <span className="text-gray-600 font-medium">${t.tratamiento_detalle?.precio}</span>
                        </li>
                      )) : (
                        <li className="text-sm text-gray-500 italic">Ningún tratamiento en esta sesión.</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Medicamentos Sub-section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4">
                    Medicamentos Recetados
                  </h4>
                  {isEditing ? (
                    <div className="space-y-3">
                      {editMedicamentos.map((det, idx) => (
                        <div key={`edit-m-${idx}`} className="flex items-center gap-2">
                          <SearchableSelect
                            options={medicamentosList.map(m => {
                              const isSelectedByAnother = editMedicamentos.some(
                                em => em.id_medicamento === m.id && em.id_medicamento !== det.id_medicamento
                              );
                              return {
                                id: m.id,
                                label: m.nombre,
                                sublabel: `$${m.precio}  (Stock: ${m.stock})`,
                                disabled: isSelectedByAnother,
                              };
                            })}
                            value={det.id_medicamento ?? null}
                            onChange={(id) => updateMedicamento(idx, 'id_medicamento', id)}
                            placeholder="Buscar medicamento..."
                            emptyMessage="Sin resultados"
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="1"
                            value={det.cantidad || 1}
                            onChange={(e) => updateMedicamento(idx, 'cantidad', parseInt(e.target.value))}
                            className="w-20 block pl-3 pr-2 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white"
                            placeholder="Cant."
                          />
                          <button
                            type="button"
                            onClick={() => removeMedicamento(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                            title="Eliminar Medicamento"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditMedicamentos([...editMedicamentos, { cantidad: 1 }])}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" /> Agregar Medicamento
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {medicamentos.length > 0 ? medicamentos.map((m, i) => (
                        <li key={i} className="flex justify-between items-center text-sm bg-white p-3 rounded shadow-sm border border-gray-100">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{m.medicamento_detalle?.nombre}</span>
                            <span className="text-xs text-gray-500">{m.cantidad} unidades a ${m.medicamento_detalle?.precio} c/u</span>
                          </div>
                          <span className="text-gray-900 font-semibold">
                            ${(parseFloat(m.medicamento_detalle?.precio || '0') * m.cantidad).toFixed(2)}
                          </span>
                        </li>
                      )) : (
                        <li className="text-sm text-gray-500 italic">Ningún medicamento recetado.</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="mt-6 pt-4 border-t border-gray-300 flex justify-end gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

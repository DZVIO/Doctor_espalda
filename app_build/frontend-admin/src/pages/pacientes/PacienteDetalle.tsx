import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../../services/pacientes.service';
import { seguimientoService } from '../../services/seguimientos.service';
import { agendamientoService } from '../../services/agendamientos.service';
import type { Paciente, Seguimiento, Agendamiento } from '../../types/models';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { SeguimientosAccordionTable } from '../../components/ui/SeguimientosAccordionTable';
import type { Column } from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export const PacienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [citas, setCitas] = useState<Agendamiento[]>([]);
  const [expandedSeguimientoId, setExpandedSeguimientoId] = useState<{ id: number, signal: number } | null>(null);

  const { loading: fetchingPac, request: fetchPacRequest } = useApi();
  const { request: fetchSegRequest } = useApi();
  const { loading: fetchingCitas, request: fetchCitasRequest } = useApi();

  const fetchAllData = useCallback(() => {
    if (!id) return;
    const pacId = parseInt(id);

    fetchPacRequest(pacienteService.getById(pacId), {
      onSuccess: (data) => setPaciente(data),
    });

    fetchSegRequest(seguimientoService.getAll({ id_paciente: pacId }), {
      onSuccess: (data) => setSeguimientos(data),
    });

    fetchCitasRequest(agendamientoService.getAll({ id_paciente: pacId }), {
      onSuccess: (data) => setCitas(data),
    });
  }, [id, fetchPacRequest, fetchSegRequest, fetchCitasRequest]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // const segColumns: Column<Seguimiento & { id: number }>[] = [
  //   { header: 'Fecha', accessor: 'fecha' },
  //   { header: 'Hora', accessor: 'hora' },
  //   { header: 'Detalles', accessor: (s) => s.detalles?.length ? `${s.detalles.length} ítems` : 'Ninguno' },
  //   { header: 'Total', accessor: (s) => `$${s.total || '0.00'}` },
  // ];

  const citaColumns: Column<Agendamiento>[] = [
    { header: 'Fecha', accessor: (cita) => formatDate(cita.fecha), sortable: true },
    { header: 'Entrada', accessor: 'hora_ingreso' },
    { header: 'Salida', accessor: 'hora_salida' },
    {
      header: 'Seguimiento',
      accessor: (cita) => {
        if (!cita.seguimientos || cita.seguimientos.length === 0) {
          return (
            <button
              onClick={() => navigate('/seguimientos/nuevo', { state: { pacienteId: paciente?.id, citaId: cita.id, citaFecha: cita.fecha, citaHora: cita.hora_ingreso } })}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium text-xs transition-colors border border-blue-200"
              title="Registrar nuevo seguimiento para esta cita"
            >
              + Seguimiento
            </button>
          );
        }
        return (
          <div className="flex flex-wrap items-center">
            {cita.seguimientos.map(s => (
              <SeguimientoChip key={s.id} s={s} onClick={() => setExpandedSeguimientoId({ id: s.id, signal: Date.now() })} />
            ))}
            <AddSeguimientoButton 
              onClick={() => navigate('/seguimientos/nuevo', { state: { pacienteId: paciente?.id, citaId: cita.id, citaFecha: cita.fecha, citaHora: cita.hora_ingreso } })}
            />
          </div>
        );
      }
    }
  ];

  if (fetchingPac && !paciente) {
    return <div className="p-6 text-center">Cargando datos del paciente...</div>;
  }

  if (!paciente) {
    return <div className="p-6 text-center text-red-600">Paciente no encontrado</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="flex-shrink-0 flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <UserIcon className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{paciente.nombre} {paciente.apellido}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge status={paciente.estado} />
              <span className="text-sm text-gray-500">Miembro desde {formatDate(paciente.created_at)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          Editar Perfil
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-auto md:overflow-hidden">
        {/* Info Card */}
        <div className="flex-shrink-0 md:w-1/3 bg-white p-6 shadow rounded-lg border border-gray-200 self-start">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <IdentificationIcon className="h-5 w-5 mr-2 text-gray-400" />
            Información de Contacto
          </h2>
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <IdentificationIcon className="h-5 w-5 mr-3" />
              <span>Cédula: {paciente.cedula}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <EnvelopeIcon className="h-5 w-5 mr-3" />
              <span>{paciente.correo || 'No registrado'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <PhoneIcon className="h-5 w-5 mr-3" />
              <span className="flex-1">{paciente.numero || 'No registrado'}</span>
              {paciente.numero && (
                <a
                  href={`https://wa.me/${paciente.region || '57'}${paciente.numero.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center px-2 py-1 border border-green-200 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100"
                  title="Enviar WhatsApp"
                >
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* History Tables */}
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-[200px] md:min-h-0 flex flex-col bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <HistoryIcon className="h-5 w-5 mr-2 text-gray-400" />
                Historial de Tratamientos (Seguimientos)
              </h2>
              <button
                onClick={() => navigate('/seguimientos/nuevo', { state: { pacienteId: paciente.id } })}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Registrar Seguimiento
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SeguimientosAccordionTable 
                seguimientos={seguimientos} 
                onRefresh={fetchAllData} 
                forceExpandId={expandedSeguimientoId}
              />
            </div>
          </div>

          <div className="flex-1 min-h-[200px] md:min-h-0 flex flex-col bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                Citas Agendadas
              </h2>
              <button
                onClick={() => navigate('/citas/nuevo', { state: { pacienteId: paciente.id } })}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Agendar Cita
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <DataTable
                columns={citaColumns}
                data={citas}
                loading={fetchingCitas}
                emptyMessage="No hay citas agendadas"
                fillHeight
                unstyled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddSeguimientoButton = ({ onClick }: { onClick: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + window.scrollY - 32, // Position above
        left: rect.left + window.scrollX + rect.width / 2
      });
      setShowTooltip(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-bold text-sm transition-colors border border-blue-200 mb-1"
      >
        +
      </button>

      {showTooltip && createPortal(
        <div 
          className="absolute bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-[9999] pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          Agregar seguimiento
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>,
        document.body
      )}
    </>
  );
};

// Placeholder for HistoryIcon if not in heroicons
const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const SeguimientoChip = ({ s, onClick }: { s: any, onClick: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const chipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  const tratamientosCount = s.tratamientos?.length || 0;
  const tratamientosText = tratamientosCount === 1 ? '1 tratamiento' : `${tratamientosCount} tratamientos`;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (chipRef.current) {
        const rect = chipRef.current.getBoundingClientRect();
        
        // Calculate center position horizontally
        let left = rect.left + window.scrollX + rect.width / 2;
        const tooltipWidth = 256; // 64 * 4px
        
        // Adjust if near screen edges
        if (left - tooltipWidth / 2 < 10 + window.scrollX) {
          left = tooltipWidth / 2 + 10 + window.scrollX;
        } else if (left + tooltipWidth / 2 > window.innerWidth + window.scrollX - 10) {
          left = window.innerWidth + window.scrollX - tooltipWidth / 2 - 10;
        }

        // Calculate absolute top position directly
        const alturaEstimadaDelTooltip = 160;
        const top = rect.top + window.scrollY - alturaEstimadaDelTooltip - 8;

        setTooltipPos({ top, left });
        setShowTooltip(true);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={chipRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block mr-2 mb-1"
    >
      <button
        onClick={onClick}
        className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full border border-green-200 transition-colors text-xs font-medium"
      >
        <CheckCircleIcon className="h-4 w-4 text-green-600" />
        <span>{tratamientosText} &middot; ${s.total}</span>
      </button>

      {showTooltip && createPortal(
        <div 
          className="absolute bg-gray-900 text-white text-xs rounded-lg p-3 z-[9999] shadow-xl pointer-events-none w-64 transform -translate-x-1/2 transition-opacity duration-200"
          style={{ 
            top: tooltipPos.top, 
            left: tooltipPos.left,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          <div className="font-semibold text-sm border-b border-gray-700 pb-1 mb-2">
            Seguimiento #{s.id} — {formatDate(s.fecha)}
          </div>
          
          {s.tratamientos && s.tratamientos.length > 0 && (
            <div className="mb-2">
              <span className="text-gray-400 font-medium block mb-1">Tratamientos:</span>
              <ul className="space-y-1">
                {s.tratamientos.map((t: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span>{t.nombre}</span>
                    <span>${t.precio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.medicamentos && s.medicamentos.length > 0 && (
            <div className="mb-2">
              <span className="text-gray-400 font-medium block mb-1">Medicamentos:</span>
              <ul className="space-y-1">
                {s.medicamentos.map((m: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate w-3/4">{m.cantidad}x {m.nombre}</span>
                    <span>${m.precio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-gray-700 flex justify-between font-bold text-sm">
            <span>Total:</span>
            <span className="text-green-400">${s.total}</span>
          </div>

          {/* Arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
            style={{ 
              left: `calc(50% + ${((chipRef.current?.getBoundingClientRect().left || 0) + window.scrollX + (chipRef.current?.getBoundingClientRect().width || 0) / 2) - tooltipPos.left}px)` 
            }}
          ></div>
        </div>,
        document.body
      )}
    </div>
  );
};

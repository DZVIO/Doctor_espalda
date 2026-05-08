import React, { useState, useEffect, useCallback } from 'react';
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
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export const PacienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [citas, setCitas] = useState<Agendamiento[]>([]);

  const { loading: fetchingPac, request: fetchPacRequest } = useApi();
  const { loading: fetchingSeg, request: fetchSegRequest } = useApi();
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

  const segColumns: Column<Seguimiento & { id: number }>[] = [
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Hora', accessor: 'hora' },
    { header: 'Detalles', accessor: (s) => s.detalles?.length ? `${s.detalles.length} ítems` : 'Ninguno' },
    { header: 'Total', accessor: (s) => `$${s.total || '0.00'}` },
  ];

  const citaColumns: Column<Agendamiento>[] = [
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Entrada', accessor: 'hora_ingreso' },
    { header: 'Salida', accessor: 'hora_salida' },
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
              <span className="text-sm text-gray-500">Miembro desde {new Date(paciente.created_at).toLocaleDateString()}</span>
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
                  href={`https://wa.me/57${paciente.numero.replace(/\D/g, '')}`}
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

// Placeholder for HistoryIcon if not in heroicons
const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

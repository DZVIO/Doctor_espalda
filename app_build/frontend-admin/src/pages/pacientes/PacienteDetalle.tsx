import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../../services/pacientes.service';
import { seguimientoService } from '../../services/seguimientos.service';
import { agendamientoService } from '../../services/agendamientos.service';
import type { Paciente, Seguimiento, Agendamiento } from '../../types/models';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
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

  const segColumns: Column<Seguimiento>[] = [
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Hora', accessor: 'hora' },
    { header: 'Tratamiento', accessor: 'id_tratamiento' }, // In a real app we'd fetch treatment names or include them in API
    { header: 'Precio', accessor: (s) => `$${s.precio}` },
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-white p-6 shadow rounded-lg border border-gray-200">
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
              <span>{paciente.numero || 'No registrado'}</span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
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
            <DataTable
              columns={segColumns}
              data={seguimientos}
              loading={fetchingSeg}
              emptyMessage="No hay historial de seguimientos registrados"
            />
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
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
            <DataTable
              columns={citaColumns}
              data={citas}
              loading={fetchingCitas}
              emptyMessage="No hay citas agendadas"
            />
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

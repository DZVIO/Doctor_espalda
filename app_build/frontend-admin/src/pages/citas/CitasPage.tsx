import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { agendamientoService } from '../../services/agendamientos.service';
import type { Agendamiento } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';

export const CitasPage: React.FC = () => {
  const [citas, setCitas] = useState<Agendamiento[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Agendamiento | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchCitas = useCallback(async () => {
    const params: any = {};
    if (dateFilter) params.fecha = dateFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(agendamientoService.getAll(params), {
      onSuccess: (data) => setCitas(data),
    });
  }, [request, dateFilter, searchTerm]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const handleDelete = async () => {
    if (!selectedCita) return;
    
    await deleteRequest(agendamientoService.delete(selectedCita.id), {
      successMessage: 'Cita cancelada correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchCitas();
      },
    });
  };

  const columns: Column<Agendamiento>[] = [
    { header: 'Fecha', accessor: (cita) => formatDate(cita.fecha), sortable: true },
    { header: 'Entrada', accessor: 'hora_ingreso', sortable: true },
    { header: 'Salida', accessor: 'hora_salida', sortable: true },
    { 
      header: 'Paciente', 
      accessor: (cita) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{cita.paciente_nombre || 'N/A'}</span>
          <span className="text-xs text-gray-500">ID: {cita.id_paciente}</span>
        </div>
      ) 
    },
    {
      header: 'Acciones',
      accessor: (cita) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/citas/${cita.id}/editar`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCita(cita);
              setIsDeleteModalOpen(true);
            }}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="flex-shrink-0 flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Citas</h1>
        <button
          onClick={() => navigate('/citas/nuevo')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nueva Cita
        </button>
      </div>

      <div className="flex-shrink-0 bg-white p-4 rounded-lg shadow mb-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar paciente:</label>
          <input
            type="text"
            id="search"
            placeholder="Nombre, cédula, etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="date" className="text-sm font-medium text-gray-700">Filtrar por fecha:</label>
          <input
            type="date"
            id="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          />
        </div>

        {(dateFilter || searchTerm) && (
          <button 
            onClick={() => { setDateFilter(''); setSearchTerm(''); }} 
            className="text-sm text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={citas}
          loading={loading}
          fillHeight
        />
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Cancelar Cita"
        confirmText="Confirmar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

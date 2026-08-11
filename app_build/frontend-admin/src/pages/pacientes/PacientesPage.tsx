import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { pacienteService } from '../../services/pacientes.service';
import type { Paciente } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';

export const PacientesPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchPacientes = useCallback(async () => {
    const params: any = {};
    if (statusFilter) params.estado = statusFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(pacienteService.getAll(params), {
      onSuccess: (data) => setPacientes(data),
    });
  }, [request, statusFilter, searchTerm]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const handleDelete = async () => {
    if (!selectedPac) return;
    
    await deleteRequest(pacienteService.delete(selectedPac.id), {
      successMessage: 'Paciente eliminado correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchPacientes();
      },
    });
  };

  const columns: Column<Paciente>[] = [
    { header: 'Cédula', accessor: 'cedula' },
    { header: 'Nombre', accessor: (p) => `${p.nombre} ${p.apellido}` },
    { header: 'Registro', accessor: (p) => formatDate(p.created_at), sortable: true },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Teléfono', accessor: 'numero' },
    { header: 'Estado', accessor: (p) => <Badge status={p.estado} /> },
    {
      header: 'Acciones',
      accessor: (p) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/pacientes/${p.id}/editar`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPac(p);
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
        <h1 className="text-2xl font-bold text-gray-900">Listado de Pacientes</h1>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nuevo Paciente
        </button>
      </div>

      <div className="flex-shrink-0 bg-white p-4 rounded-lg shadow mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <SearchInput onSearch={setSearchTerm} placeholder="Nombre, apellido o cédula..." />
        
        <div className="flex items-center space-x-4">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={pacientes}
          loading={loading}
          onRowClick={(p) => navigate(`/pacientes/${p.id}`)}
          fillHeight
        />
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Paciente"
        confirmText="Eliminar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas eliminar al paciente <span className="font-bold">{selectedPac?.nombre} {selectedPac?.apellido}</span>? 
          Esta acción es irreversible y solo se permite si no tiene citas o sesiones asociadas.
        </p>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { tratamientoService } from '../../services/tratamientos.service';
import type { Tratamiento } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';

export const TratamientosPage: React.FC = () => {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTrat, setSelectedTrat] = useState<Tratamiento | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchTratamientos = useCallback(async () => {
    const params: any = {};
    if (statusFilter) params.estado = statusFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(tratamientoService.getAll(params), {
      onSuccess: (data) => setTratamientos(data),
    });
  }, [request, statusFilter, searchTerm]);

  useEffect(() => {
    fetchTratamientos();
  }, [fetchTratamientos]);

  const handleDelete = async () => {
    if (!selectedTrat) return;
    
    await deleteRequest(tratamientoService.delete(selectedTrat.id), {
      successMessage: 'Tratamiento eliminado correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchTratamientos();
      },
    });
  };

  const columns: Column<Tratamiento>[] = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Descripción', accessor: 'descripcion', className: 'max-w-xs truncate' },
    { header: 'Precio', accessor: (trat) => `$${trat.precio}` },
    { header: 'Estado', accessor: (trat) => <Badge status={trat.estado} /> },
    {
      header: 'Acciones',
      accessor: (trat) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tratamientos/${trat.id}/editar`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTrat(trat);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Tratamientos</h1>
        <button
          onClick={() => navigate('/tratamientos/nuevo')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nuevo Tratamiento
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <SearchInput onSearch={setSearchTerm} placeholder="Buscar por nombre..." />
        
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

      <DataTable
        columns={columns}
        data={tratamientos}
        loading={loading}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Tratamiento"
        confirmText="Eliminar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas eliminar el tratamiento <span className="font-bold">{selectedTrat?.nombre}</span>? 
          Esta acción no se puede deshacer si tiene seguimientos asociados.
        </p>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { unidadMedidaService } from '../../services/unidades-medida.service';
import type { UnidadMedida } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';

export const UnidadesMedidaPage: React.FC = () => {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMedida | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchUnidades = useCallback(async () => {
    const params: any = {};
    if (statusFilter) params.estado = statusFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(unidadMedidaService.getAll(params), {
      onSuccess: (data) => setUnidades(data),
    });
  }, [request, statusFilter, searchTerm]);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);



  const handleDelete = async () => {
    if (!selectedUnidad) return;
    
    await deleteRequest(unidadMedidaService.delete(selectedUnidad.id), {
      successMessage: 'Unidad de Medida eliminada correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchUnidades();
      },
    });
  };

  const handleAdd = () => {
    navigate('/inventario/unidades-medida/nuevo');
  };

  const handleEdit = (unidad: UnidadMedida) => {
    navigate(`/inventario/unidades-medida/${unidad.id}/editar`);
  };

  const columns: Column<UnidadMedida>[] = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Unidad', accessor: 'unidad', sortable: true },
    { header: 'Abreviatura', accessor: 'abreviatura' },
    { header: 'Tipo', accessor: (u) => <span className="capitalize">{u.tipo}</span>, sortable: true },
    { header: 'Estado', accessor: (u) => <Badge status={u.estado} /> },
    {
      header: 'Acciones',
      accessor: (u) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(u)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setSelectedUnidad(u);
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
        <h1 className="text-2xl font-bold text-gray-900">Unidades de Medida</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nueva Unidad
        </button>
      </div>

      <div className="flex-shrink-0 bg-white p-4 rounded-lg shadow mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <SearchInput onSearch={setSearchTerm} placeholder="Buscar unidad o abreviatura..." />
        
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
          data={unidades}
          loading={loading}
          fillHeight
        />
      </div>



      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Unidad de Medida"
        confirmText="Eliminar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas eliminar la unidad <span className="font-bold">{selectedUnidad?.unidad}</span>? 
          Esta acción es irreversible y solo se permite si no tiene presentaciones asociadas.
        </p>
      </Modal>
    </div>
  );
};

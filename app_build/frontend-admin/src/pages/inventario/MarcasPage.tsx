import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { marcaService } from '../../services/marcas.service';
import type { Marca } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';

export const MarcasPage: React.FC = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchMarcas = useCallback(async () => {
    const params: any = {};
    if (statusFilter) params.estado = statusFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(marcaService.getAll(params), {
      onSuccess: (data) => setMarcas(data),
    });
  }, [request, statusFilter, searchTerm]);

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);



  const handleDelete = async () => {
    if (!selectedMarca) return;
    
    await deleteRequest(marcaService.delete(selectedMarca.id), {
      successMessage: 'Marca eliminada correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchMarcas();
      },
    });
  };

  const handleAdd = () => {
    navigate('/inventario/marcas/nuevo');
  };

  const handleEdit = (marca: Marca) => {
    navigate(`/inventario/marcas/${marca.id}/editar`);
  };

  const columns: Column<Marca>[] = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Marca', accessor: 'marca', sortable: true },
    { header: 'Estado', accessor: (m) => <Badge status={m.estado} /> },
    {
      header: 'Acciones',
      accessor: (m) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(m)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setSelectedMarca(m);
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
        <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nueva Marca
        </button>
      </div>

      <div className="flex-shrink-0 bg-white p-4 rounded-lg shadow mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <SearchInput onSearch={setSearchTerm} placeholder="Buscar marca..." />
        
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
          data={marcas}
          loading={loading}
          fillHeight
        />
      </div>



      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Marca"
        confirmText="Eliminar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas eliminar la marca <span className="font-bold">{selectedMarca?.marca}</span>? 
          Esta acción es irreversible y solo se permite si no tiene medicamentos asociados.
        </p>
      </Modal>
    </div>
  );
};

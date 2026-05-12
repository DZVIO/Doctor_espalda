import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { medicamentoService } from '../../services/medicamentos.service';
import type { Medicamento } from '../../types/models';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';

export const InventarioPage: React.FC = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicamento | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { loading, request } = useApi();
  const { loading: deleting, request: deleteRequest } = useApi();

  const fetchMedicamentos = useCallback(async () => {
    const params: any = {};
    if (statusFilter) params.estado = statusFilter;
    if (searchTerm) params.search = searchTerm;
    
    request(medicamentoService.getAll(params), {
      onSuccess: (data) => setMedicamentos(data),
    });
  }, [request, statusFilter, searchTerm]);

  useEffect(() => {
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const handleDelete = async () => {
    if (!selectedMed) return;
    
    await deleteRequest(medicamentoService.delete(selectedMed.id), {
      successMessage: 'Medicamento eliminado correctamente',
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        fetchMedicamentos();
      },
    });
  };

  const columns: Column<Medicamento>[] = [
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    { header: 'Marca', accessor: (med) => med.marca_detalle?.marca || '-' },
    { 
      header: 'Presentación', 
      accessor: (med) => {
        const p = med.presentacion_detalle;
        if (!p) return '-';
        return `${p.forma_farmaceutica_detalle?.forma} · ${p.cantidad} · ${p.unidad_medida_detalle?.abreviatura}`;
      }
    },
    { header: 'Cantidad', accessor: 'cantidad' },
    { header: 'Precio', accessor: (med) => `$${med.precio}` },
    { header: 'Estado', accessor: (med) => <Badge status={med.estado} /> },
    {
      header: 'Acciones',
      accessor: (med) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/inventario/${med.id}/editar`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMed(med);
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
        <h1 className="text-2xl font-bold text-gray-900">Inventario de Medicamentos</h1>
        <button
          onClick={() => navigate('/inventario/nuevo')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nuevo Medicamento
        </button>
      </div>

      <div className="flex-shrink-0 bg-white p-4 rounded-lg shadow mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
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

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={medicamentos}
          loading={loading}
          fillHeight
        />
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Medicamento"
        confirmText="Eliminar"
        confirmVariant="danger"
        loading={deleting}
      >
        <p className="text-sm text-gray-500">
          ¿Estás seguro de que deseas eliminar el medicamento <span className="font-bold">{selectedMed?.nombre}</span>? 
          Esta acción no se puede deshacer si no tiene seguimientos asociados.
        </p>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

import { useApi } from '../../hooks/useApi';
import { contabilidadService } from '../../services/contabilidad.service';
import type { Pago, MetricasFinancieras } from '../../types/models';
import { PaymentModal } from '../../components/ui/PaymentModal';

export const ContabilidadPage: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [metricas, setMetricas] = useState<MetricasFinancieras | null>(null);

  // Search and Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'pendiente' | 'parcial' | 'pagado'>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Payment Modal State
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  const { loading: loadingList, request: requestList } = useApi();
  const { loading: loadingMetricas, request: requestMetricas } = useApi();

  const fetchMetricas = () => {
    requestMetricas(contabilidadService.getMetricas(), {
      onSuccess: (data) => setMetricas(data),
    });
  };

  const fetchPagos = () => {
    const params: any = {};
    if (estadoFilter !== 'todos') {
      params.estado_pago = estadoFilter;
    }
    if (search.trim()) {
      params.search = search;
    }
    if (fechaDesde) {
      params.fecha_pago_desde = fechaDesde;
    }
    if (fechaHasta) {
      params.fecha_pago_hasta = fechaHasta;
    }

    requestList(contabilidadService.getAll(params), {
      onSuccess: (data) => {
        // Sort descending by date (fecha_pago or created_at if not paid)
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.sesion.fecha + 'T' + a.sesion.hora).getTime();
          const dateB = new Date(b.sesion.fecha + 'T' + b.sesion.hora).getTime();
          return dateB - dateA;
        });
        setPagos(sorted);
      },
    });
  };

  // Fetch metrics on mount, and payments on filter change
  useEffect(() => {
    fetchMetricas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter, fechaDesde, fechaHasta]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPagos();
  };

  const openPaymentModal = (pago: Pago) => {
    setSelectedPago(pago);
  };

  const closePaymentModal = () => {
    setSelectedPago(null);
  };

  // SVG Chart Helper Data
  const chartData = useMemo(() => {
    if (!metricas || !metricas.ingresos_por_dia || metricas.ingresos_por_dia.length === 0) {
      return [];
    }
    return metricas.ingresos_por_dia;
  }, [metricas]);

  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const maxVal = Math.max(...chartData.map(d => d.total));
    return maxVal > 0 ? maxVal * 1.15 : 100; // 15% padding above highest bar
  }, [chartData]);

  // Method Distribution percentages
  const distributionPercentages = useMemo(() => {
    if (!metricas || !metricas.distribucion_metodo_pago) return {};
    const totalValue = metricas.distribucion_metodo_pago.reduce((acc, curr) => acc + curr.total, 0);
    if (totalValue === 0) return {};

    const percentages: Record<string, { pct: number; total: number; qty: number }> = {};
    metricas.distribucion_metodo_pago.forEach(item => {
      percentages[item.metodo_pago] = {
        pct: (item.total / totalValue) * 100,
        total: item.total,
        qty: item.cantidad
      };
    });
    return percentages;
  }, [metricas]);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <BanknotesIcon className="h-5 w-5 text-emerald-500" />;
      case 'tarjeta': return <CreditCardIcon className="h-5 w-5 text-indigo-500" />;
      case 'transferencia': return <ArrowPathIcon className="h-5 w-5 text-sky-500" />;
      default: return <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pagado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
            Pagado
          </span>
        );
      case 'parcial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <ClockIcon className="w-3.5 h-3.5 mr-1" />
            Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <ExclamationCircleIcon className="w-3.5 h-3.5 mr-1" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full space-y-8 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contabilidad y Cobros</h1>
          <p className="text-gray-500 text-sm mt-1">Manejo de cobros, registro de facturación de pacientes y reporte de métricas financieras de la clínica.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span>Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Ingresos Hoy</span>
            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              <BanknotesIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {metricas ? formatCurrency(metricas.total_ingresos_hoy) : '$0'}
            </h3>
            <span className="text-emerald-600 text-xs font-semibold flex items-center mt-1">
              • Recaudado en el día
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Esta Semana</span>
            <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
              <ArrowPathIcon className="h-6 w-6 text-sky-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {metricas ? formatCurrency(metricas.total_ingresos_semana) : '$0'}
            </h3>
            <span className="text-sky-600 text-xs font-semibold flex items-center mt-1">
              • Últimos 7 días
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Este Mes</span>
            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
              <CreditCardIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {metricas ? formatCurrency(metricas.total_ingresos_mes) : '$0'}
            </h3>
            <span className="text-indigo-600 text-xs font-semibold flex items-center mt-1">
              • Mes actual
            </span>
          </div>
        </div>

        {/* Pending Balance with urgency indicator */}
        <div className={`rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${metricas && metricas.total_pendiente > 500000
            ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-200 ring-opacity-50'
            : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pendiente por Cobrar</span>
            <div className={`p-2 rounded-lg border ${metricas && metricas.total_pendiente > 500000
                ? 'bg-rose-100 border-rose-300'
                : 'bg-amber-50 border-amber-100'
              }`}>
              <ExclamationCircleIcon className={`h-6 w-6 ${metricas && metricas.total_pendiente > 500000 ? 'text-rose-600' : 'text-amber-600'
                }`} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black tracking-tight ${metricas && metricas.total_pendiente > 500000 ? 'text-rose-700' : 'text-gray-900'
              }`}>
              {metricas ? formatCurrency(metricas.total_pendiente) : '$0'}
            </h3>
            {metricas && metricas.total_pendiente > 500000 ? (
              <span className="text-rose-700 text-xs font-extrabold flex items-center mt-1 animate-pulse">
                ⚠️ ¡Acción urgente recomendada!
              </span>
            ) : (
              <span className="text-amber-600 text-xs font-semibold flex items-center mt-1">
                • Cuentas en pendiente/parcial
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Evolución de Ingresos (Últimos 30 días)</h2>
            <p className="text-xs text-gray-500 mt-1">Ingresos recaudados día a día.</p>
          </div>

          <div className="h-64 mt-6 w-full flex items-end">
            {loadingMetricas ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ArrowPathIcon className="w-8 h-8 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No hay datos de ingresos en el período.
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="220" x2="600" y2="220" stroke="#e5e7eb" strokeWidth="1" />

                {/* Bars */}
                {chartData.map((item, idx) => {
                  const width = (600 / 30) - 4; // Width of each bar
                  const height = (item.total / maxChartValue) * 180;
                  const x = idx * (600 / 30) + 2;
                  const y = 220 - height;
                  return (
                    <g key={item.fecha} className="group">
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="url(#chart-gradient)"
                        rx="2"
                        className="transition-all duration-300 hover:fill-indigo-600 cursor-pointer"
                      />
                      <title>{`Día: ${item.fecha}\nTotal: ${formatCurrency(item.total)}`}</title>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 border-t border-gray-100 pt-2 px-1">
            <span>Hace 30 días</span>
            <span>Hoy</span>
          </div>
        </div>

        {/* Method Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Distribución por Método de Pago</h2>
            <p className="text-xs text-gray-500 mt-1">Porcentaje de ingresos recaudados por método.</p>
          </div>

          <div className="space-y-4 my-6">
            {['efectivo', 'transferencia', 'tarjeta', 'otro'].map(method => {
              const data = distributionPercentages[method] || { pct: 0, total: 0, qty: 0 };
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 font-medium text-gray-700 capitalize">
                      {getMethodIcon(method)}
                      <span>{method}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{data.pct.toFixed(0)}%</span>
                      <span className="text-xs text-gray-400 ml-1">({data.qty} trans.)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${method === 'efectivo' ? 'bg-emerald-500' :
                          method === 'tarjeta' ? 'bg-indigo-500' :
                            method === 'transferencia' ? 'bg-sky-500' : 'bg-gray-400'
                        }`}
                      style={{ width: `${data.pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-right font-semibold text-gray-500">
                    Total: {formatCurrency(data.total)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-3 text-center">
            <span className="text-xs text-gray-400">Datos basados en cobros confirmados e históricos</span>
          </div>
        </div>
      </div>

      {/* Movements Table section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Table Header / Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center lg:justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Listado de Movimientos</h2>
          </div>

          {/* Search patient name */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </form>

          {/* Date range filters */}
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-400">Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="focus:outline-none text-xs"
              />
            </div>
            <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-400">Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="focus:outline-none text-xs"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                className="text-rose-500 hover:text-rose-700 font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* State Filter Tabs */}
        <div className="border-b border-gray-100 flex space-x-8 px-5">
          {(['todos', 'pendiente', 'parcial', 'pagado'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setEstadoFilter(tab)}
              className={`py-3 text-sm font-semibold border-b-2 capitalize transition-colors ${estadoFilter === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              {tab === 'todos' ? 'Todos los pagos' : `${tab}s`}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loadingList ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <ArrowPathIcon className="w-8 h-8 animate-spin mr-2" />
              <span>Cargando movimientos...</span>
            </div>
          ) : pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
              <ExclamationCircleIcon className="w-10 h-10 text-gray-300" />
              <span>No se encontraron movimientos.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Paciente</th>
                  <th className="px-6 py-3.5">Sesión</th>
                  <th className="px-6 py-3.5">Total Sesión</th>
                  <th className="px-6 py-3.5">Monto Pagado</th>
                  <th className="px-6 py-3.5">Saldo Pendiente</th>
                  <th className="px-6 py-3.5">Método de Pago</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagos.map(pago => {
                  const isPending = pago.estado_pago === 'pendiente';
                  const isPartial = pago.estado_pago === 'parcial';

                  // Highlight class for pending/partial payments
                  const rowBgClass = isPending
                    ? 'bg-rose-50/20 hover:bg-rose-50/40'
                    : isPartial
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-gray-50';

                  const detailNames = pago.sesion.detalles
                    .map(d => d.tratamiento_nombre || d.medicamento_nombre)
                    .filter(Boolean)
                    .join(', ') || 'Sin tratamientos';

                  return (
                    <tr key={pago.id} className={`transition-colors text-sm text-gray-700 ${rowBgClass}`}>
                      <td className="px-6 py-4 font-semibold whitespace-nowrap">
                        {new Date(pago.sesion.fecha + 'T' + pago.sesion.hora).toLocaleString('es-ES', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                        {pago.sesion.id_paciente.nombre} {pago.sesion.id_paciente.apellido}
                        <div className="text-xs text-gray-400 font-normal mt-0.5">Cedula: {pago.sesion.id_paciente.cedula}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={detailNames}>
                        {detailNames}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-900 whitespace-nowrap">
                        {formatCurrency(pago.sesion.total)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(pago.monto_pagado)}
                      </td>
                      <td className={`px-6 py-4 font-bold whitespace-nowrap ${parseFloat(pago.saldo_pendiente) > 0 ? 'text-rose-600' : 'text-gray-400'
                        }`}>
                        {formatCurrency(pago.saldo_pendiente)}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {pago.metodo_pago ? (
                            <>
                              {getMethodIcon(pago.metodo_pago)}
                              <span>{pago.metodo_pago}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Sin pago</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(pago.estado_pago)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isPending && (
                          <button
                            onClick={() => openPaymentModal(pago)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            Registrar pago
                          </button>
                        )}
                        {isPartial && (
                          <button
                            onClick={() => openPaymentModal(pago)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            Actualizar pago
                          </button>
                        )}
                        {pago.estado_pago === 'pagado' && (
                          <span className="text-gray-400 text-xs font-semibold italic">Cobrado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      <PaymentModal
        pago={selectedPago!}
        isOpen={!!selectedPago}
        onClose={closePaymentModal}
        onSuccess={() => {
          closePaymentModal();
          fetchPagos();
          fetchMetricas();
        }}
      />
    </div>
  );
};
export default ContabilidadPage;

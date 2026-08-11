import React, { useState, useEffect, useMemo } from 'react';
import { BanknotesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useApi } from '../../hooks/useApi';
import { contabilidadService } from '../../services/contabilidad.service';
import type { Pago } from '../../types/models';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  pago: Pago;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  pago,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'otro'>('efectivo');
  const [abono, setAbono] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  const { loading: loadingAction, request: requestAction } = useApi();

  useEffect(() => {
    if (isOpen && pago) {
      setMetodoPago(pago.metodo_pago || 'efectivo');
      setAbono(pago.saldo_pendiente);
      setObservaciones(pago.observaciones || '');
    }
  }, [isOpen, pago]);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pago) return;

    const montoAbono = parseFloat(abono);
    if (isNaN(montoAbono) || montoAbono <= 0) {
      toast.error('El monto a abonar debe ser un número mayor a 0');
      return;
    }

    const maxAbono = parseFloat(pago.saldo_pendiente);
    if (montoAbono > maxAbono) {
      toast.error(`El abono no puede superar el saldo pendiente ($${maxAbono.toFixed(2)})`);
      return;
    }

    await requestAction(
      contabilidadService.confirmar(pago.id, {
        metodo_pago: metodoPago,
        monto_pagado: montoAbono,
        observaciones: observaciones.trim() || undefined
      }),
      {
        successMessage: 'Pago registrado exitosamente',
        onSuccess: () => {
          onSuccess();
        }
      }
    );
  };

  const handleFullPaymentModal = async () => {
    if (!pago) return;
    await requestAction(
      contabilidadService.pagarCompleto(pago.id, { metodo_pago: metodoPago }),
      {
        successMessage: 'Pago completado al 100%',
        onSuccess: () => {
          onSuccess();
        }
      }
    );
  };

  const calculatedNewPendingBalance = useMemo(() => {
    if (!pago) return 0;
    const total = parseFloat(pago.sesion.total);
    const yaPagado = parseFloat(pago.monto_pagado);
    const abonoActual = parseFloat(abono) || 0;
    const res = total - (yaPagado + abonoActual);
    return res < 0 ? 0 : res;
  }, [pago, abono]);

  if (!isOpen || !pago) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <BanknotesIcon className="w-5 h-5 text-indigo-600" />
            <span>
              {pago.estado_pago === 'pendiente' ? 'Registrar Cobro' : 'Actualizar Abonos'}
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
          <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Paciente:</span>
              <span className="font-extrabold text-gray-900">
                {pago.sesion.id_paciente.nombre} {pago.sesion.id_paciente.apellido}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Total Sesión:</span>
              <span className="font-extrabold text-gray-900">{formatCurrency(pago.sesion.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Monto ya Pagado:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(pago.monto_pagado)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-100 pt-2 font-bold text-sm">
              <span className="text-indigo-800">Saldo Pendiente:</span>
              <span className="text-rose-600">{formatCurrency(pago.saldo_pendiente)}</span>
            </div>
          </div>

          {/* Method Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Método de Pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia Bancaria</option>
              <option value="tarjeta">💳 Tarjeta de Crédito/Débito</option>
              <option value="otro">⚙️ Otro</option>
            </select>
          </div>

          {/* Amount input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Monto del Abono</label>
              <button
                type="button"
                onClick={() => setAbono(pago.saldo_pendiente)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
              >
                Monto total
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={pago.saldo_pendiente}
                required
                value={abono}
                onChange={(e) => setAbono(e.target.value)}
                placeholder="Monto recibido"
                className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 font-extrabold focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-sm text-gray-400 font-semibold">$</span>
            </div>
          </div>

          {/* Calculated Remaining Balance */}
          <div className="flex items-center justify-between text-xs py-2 bg-gray-50 px-3 rounded-lg border border-gray-100">
            <span className="text-gray-500 font-medium">Nuevo Saldo Pendiente:</span>
            <span className={`font-black ${calculatedNewPendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(calculatedNewPendingBalance)}
            </span>
          </div>

          {/* Observations */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Observaciones (Opcional)</label>
            <textarea
              placeholder="Notas adicionales sobre el cobro..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleFullPaymentModal}
              disabled={loadingAction}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              Pagar Completo
            </button>
            <button
              type="submit"
              disabled={loadingAction}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              Confirmar Abono
            </button>
          </div>
          
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium underline"
            >
              Cobrar después
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

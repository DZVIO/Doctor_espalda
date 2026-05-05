import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CalendarDaysIcon, 
  ArchiveBoxIcon, 
  BeakerIcon 
} from '@heroicons/react/24/outline';
import { useApi } from '../hooks/useApi';
import { pacienteService } from '../services/pacientes.service';
import { agendamientoService } from '../services/agendamientos.service';
import { medicamentoService } from '../services/medicamentos.service';
import { tratamientoService } from '../services/tratamientos.service';
import type { Agendamiento } from '../types/models';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    pacientes: 0,
    bajoStock: 0,
    tratamientos: 0,
  });
  const [todayCitas, setTodayCitas] = useState<Agendamiento[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { request } = useApi();

  useEffect(() => {
    // Basic stats fetching
    request(pacienteService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setStats(prev => ({ ...prev, pacientes: data.length }))
    });
    
    const today = new Date().toISOString().split('T')[0];
    request(agendamientoService.getAll({ fecha: today }), {
      onSuccess: (data) => setTodayCitas(data)
    });

    request(medicamentoService.getAll(), {
      onSuccess: (data) => {
        const lowStock = data.filter((m: any) => m.cantidad < 5).length;
        setStats(prev => ({ ...prev, bajoStock: lowStock }));
      }
    });

    request(tratamientoService.getAll({ estado: 'activo' }), {
      onSuccess: (data) => setStats(prev => ({ ...prev, tratamientos: data.length }))
    });
  }, [request]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Check every 10 seconds for better precision
    return () => clearInterval(timer);
  }, []);

  const citasPendientesHoy = todayCitas.filter(cita => {
    const timeStr = currentTime.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS
    return cita.hora_ingreso >= timeStr;
  }).length;

  const cards = [
    { name: 'Pacientes Activos', value: stats.pacientes, icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Citas para Hoy', value: citasPendientesHoy, icon: CalendarDaysIcon, color: 'bg-green-500' },
    { name: 'Medicamentos Bajo Stock', value: stats.bajoStock, icon: ArchiveBoxIcon, color: 'bg-red-500' },
    { name: 'Tratamientos Disponibles', value: stats.tratamientos, icon: BeakerIcon, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumen General</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${item.color} text-white`}>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-lg font-bold text-gray-900">{item.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Bienvenido al Panel Administrativo</h2>
        <p className="text-gray-600">
          Utilice el menú lateral para gestionar pacientes, citas, inventario y tratamientos.
          Todas las operaciones se sincronizan en tiempo real con la base de datos.
        </p>
      </div>
    </div>
  );
};

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { InventarioPage } from '../pages/inventario/InventarioPage';
import { MedicamentoForm } from '../pages/inventario/MedicamentoForm';
import { TratamientosPage } from '../pages/tratamientos/TratamientosPage';
import { TratamientoForm } from '../pages/tratamientos/TratamientoForm';
import { PacientesPage } from '../pages/pacientes/PacientesPage';
import { PacienteForm } from '../pages/pacientes/PacienteForm';
import { PacienteDetalle } from '../pages/pacientes/PacienteDetalle';
import { CitasPage } from '../pages/citas/CitasPage';
import { CitaForm } from '../pages/citas/CitaForm';
import { SeguimientoForm } from '../pages/seguimientos/SeguimientoForm';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'pacientes',
            children: [
              { index: true, element: <PacientesPage /> },
              { path: 'nuevo', element: <PacienteForm /> },
              { path: ':id', element: <PacienteDetalle /> },
              { path: ':id/editar', element: <PacienteForm /> },
            ]
          },
          {
            path: 'inventario',
            children: [
              { index: true, element: <InventarioPage /> },
              { path: 'nuevo', element: <MedicamentoForm /> },
              { path: ':id/editar', element: <MedicamentoForm /> },
            ]
          },
          {
            path: 'tratamientos',
            children: [
              { index: true, element: <TratamientosPage /> },
              { path: 'nuevo', element: <TratamientoForm /> },
              { path: ':id/editar', element: <TratamientoForm /> },
            ]
          },
          {
            path: 'citas',
            children: [
              { index: true, element: <CitasPage /> },
              { path: 'nuevo', element: <CitaForm /> },
              { path: ':id/editar', element: <CitaForm /> },
            ]
          },
          {
            path: 'seguimientos/nuevo',
            element: <SeguimientoForm />
          }
        ],
      },
    ],
  },
]);

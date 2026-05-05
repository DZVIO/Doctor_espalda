import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarDaysIcon, 
  BeakerIcon, 
  ArchiveBoxIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/useAuthStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, exact: true },
  { name: 'Pacientes', href: '/pacientes', icon: UsersIcon, exact: false },
  { name: 'Citas', href: '/citas', icon: CalendarDaysIcon, exact: false },
  { name: 'Tratamientos', href: '/tratamientos', icon: BeakerIcon, exact: false },
  { name: 'Inventario', href: '/inventario', icon: ArchiveBoxIcon, exact: false },
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen fixed top-0 left-0">
      <div className="flex items-center justify-center h-16 bg-gray-900 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider">Dr. Espalda</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white group"
        >
          <ArrowLeftOnRectangleIcon 
            className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
            aria-hidden="true" 
          />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

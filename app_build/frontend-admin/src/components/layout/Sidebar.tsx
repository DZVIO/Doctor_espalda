import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarDaysIcon, 
  BeakerIcon, 
  ArchiveBoxIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/useAuthStore';

type NavItem = {
  name: string;
  href: string;
  icon?: React.ElementType;
  exact?: boolean;
  children?: NavItem[];
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, exact: true },
  { name: 'Pacientes', href: '/pacientes', icon: UsersIcon, exact: false },
  { name: 'Citas', href: '/citas', icon: CalendarDaysIcon, exact: false },
  { name: 'Tratamientos', href: '/tratamientos', icon: BeakerIcon, exact: false },
  { 
    name: 'Medicamentos', 
    href: '/inventario', 
    icon: ArchiveBoxIcon, 
    exact: true,
    children: [
      { name: 'Marcas', href: '/inventario/marcas', exact: true },
      { name: 'Categorías', href: '/inventario/categorias', exact: true },
      { 
        name: 'Presentaciones', 
        href: '/inventario/presentaciones', 
        exact: true,
        children: [
          { name: 'Formas Farmacéuticas', href: '/inventario/formas-farmaceuticas', exact: true },
          { name: 'Unidades de Medida', href: '/inventario/unidades-medida', exact: true },
        ]
      },
    ]
  },
];

const NavItemRenderer: React.FC<{ item: NavItem; depth?: number }> = ({ item, depth = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isPathActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isAnyChildActive = (children?: NavItem[]): boolean => {
    if (!children) return false;
    return children.some(child => 
      isPathActive(child.href, child.exact) || isAnyChildActive(child.children)
    );
  };

  const isActive = isPathActive(item.href, item.exact);
  const hasActiveChild = isAnyChildActive(item.children);
  const isModuleRoot = depth === 0 && location.pathname.startsWith(item.href) && item.href !== '/';
  const shouldBeOpen = isActive || hasActiveChild || isModuleRoot;

  // We maintain local open state but sync it if a child becomes active
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  // Sync state with URL only on mount or when navigating to a NEW module
  useEffect(() => {
    if (shouldBeOpen) {
      setIsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldBeOpen]);

  // Handle case when user navigates away from the module (e.g. click Dashboard)
  useEffect(() => {
    if (!shouldBeOpen && !isAnyChildActive(item.children)) {
        setIsOpen(false);
    }
  }, [location.pathname, shouldBeOpen, item.children]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.children) {
      // Toggle if already on the path or if it's a click on the same parent
      setIsOpen(!isOpen);
    }
    navigate(item.href);
  };

  const paddingLeft = depth === 0 ? 'pl-2' : depth === 1 ? 'pl-8' : 'pl-11';

  return (
    <div className="flex flex-col">
      <a
        href={item.href}
        onClick={handleClick}
        className={`group flex items-center pr-2 py-2 text-sm font-medium rounded-md ${paddingLeft} ${
          isActive
            ? 'bg-gray-800 text-white'
            : hasActiveChild && depth === 0 
              ? 'bg-gray-800 text-gray-200'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {item.icon && (
          <item.icon
            className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive || hasActiveChild ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}`}
            aria-hidden="true"
          />
        )}
        <span className="flex-1">{item.name}</span>
        
        {item.children && (
          isOpen ? (
            <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRightIcon className="ml-2 h-4 w-4 text-gray-400" />
          )
        )}
      </a>
      
      {item.children && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="mt-1 space-y-1">
            {item.children.map((child, index) => (
              <NavItemRenderer key={`${child.name}-${index}`} item={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen fixed top-0 left-0 z-10">
      <div className="flex items-center justify-center h-16 bg-gray-900 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider">Dr. Espalda</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => (
            <NavItemRenderer key={item.name} item={item} />
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

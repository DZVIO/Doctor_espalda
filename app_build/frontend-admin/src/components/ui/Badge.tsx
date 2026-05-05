import React from 'react';

interface BadgeProps {
  status: 'activo' | 'inactivo';
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const isActive = status === 'activo';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
};

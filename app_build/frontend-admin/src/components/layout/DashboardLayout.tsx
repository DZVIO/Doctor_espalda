import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden h-screen">
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

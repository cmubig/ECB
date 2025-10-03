'use client';

import React from 'react';
import { AdminProvider } from '../../contexts/AdminContext';
import { useAdmin } from '../../contexts/AdminContext';
import AdminLogin from '../../components/admin/AdminLogin';
import AdminDashboard from '../../components/admin/AdminDashboard';

const AdminPage: React.FC = () => {
  return (
    <AdminProvider>
      <AdminPageContent />
    </AdminProvider>
  );
};

const AdminPageContent: React.FC = () => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <AdminLogin />;
};

export default AdminPage;

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CafeProvider, useCafe } from './store/CafeContext';
import { Auth } from './views/Auth';
import { CustomerDashboard } from './views/Customer';
import { KitchenDashboard } from './views/Kitchen';
import { AdminDashboard } from './views/Admin';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { currentUser } = useCafe();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={[UserRole.KITCHEN]}>
          <KitchenDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <CafeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </CafeProvider>
  );
};

export default App;
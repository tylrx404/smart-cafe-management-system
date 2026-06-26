import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Coffee, ChefHat, LayoutDashboard, UserCircle } from 'lucide-react';
import { UserRole } from '../types';
import { useCafe } from '../store/CafeContext';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, role, title }) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useCafe();

  const handleLogout = () => {
    logout();
  };

  const getRoleIcon = () => {
    switch (role) {
      case UserRole.ADMIN: return <LayoutDashboard className="text-brand-orange" />;
      case UserRole.KITCHEN: return <ChefHat className="text-brand-orange" />;
      case UserRole.CUSTOMER: return <Coffee className="text-brand-orange" />;
    }
  };

  return (
    <div className="min-h-screen bg-cafe-50 text-cafe-900 font-sans selection:bg-brand-orange selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-cafe-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-cafe-100 p-2 rounded-lg border border-cafe-200">
                {getRoleIcon()}
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-cafe-800 leading-tight">CafeOS</h1>
                <p className="text-xs text-cafe-500 font-medium uppercase tracking-wider">{title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {/* User Profile Badge */}
               <div className="flex items-center gap-2 bg-cafe-50 py-1.5 px-3 rounded-full border border-cafe-100">
                  <UserCircle size={20} className="text-cafe-400" />
                  <span className="text-sm font-semibold text-cafe-700 truncate max-w-[120px]">
                    {currentUser?.name || role}
                  </span>
               </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-cafe-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>
    </div>
  );
};
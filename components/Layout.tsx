import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Recycle, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  children: React.ReactNode;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, children, onLogout, currentView, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (view: string) => {
      onNavigate(view);
      setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-plax-900 text-white flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-plax-800">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
                <Recycle className="h-6 w-6 text-plax-600" />
            </div>
            <span className="text-xl font-bold tracking-tight">PlaxRec</span>
          </div>
          {/* Close Button Mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-plax-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="mb-6 px-4">
             <p className="text-xs uppercase text-plax-400 font-semibold mb-2">Perfil</p>
             <div className="flex items-center space-x-3 bg-plax-800 p-3 rounded-lg">
                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-plax-500 flex items-center justify-center text-lg font-bold">
                    {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{currentUser.name}</p>
                    <p className="text-xs text-plax-300 truncate">{currentUser.role}</p>
                </div>
             </div>
          </div>

          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentView === 'DASHBOARD'} 
            onClick={() => handleNavigate('DASHBOARD')}
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Carteira Plax" 
            active={currentView === 'WALLET'} 
            onClick={() => handleNavigate('WALLET')}
          />
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Relatórios" 
            active={currentView === 'REPORTS'} 
            onClick={() => handleNavigate('REPORTS')}
          />
          {currentUser.role === UserRole.ADMIN && (
             <NavItem 
                icon={<Users size={20} />} 
                label="Usuários" 
                active={currentView === 'USERS'} 
                onClick={() => handleNavigate('USERS')}
             />
          )}
        </nav>

        <div className="p-4 border-t border-plax-800">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-plax-300 hover:text-white hover:bg-plax-800 w-full p-3 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Mobile Header Bar */}
        <div className="md:hidden bg-plax-900 text-white p-4 flex justify-between items-center z-10 shadow-md">
            <div className="flex items-center space-x-2">
                <Recycle className="h-6 w-6 text-plax-500" />
                <span className="font-bold text-lg">PlaxRec</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-1">
                <Menu size={28} />
            </button>
        </div>

        {/* Desktop Header / Info Bar */}
        <header className="bg-white shadow-sm min-h-[4rem] py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 z-10 gap-2 sm:gap-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
            {currentView === 'DASHBOARD' && 'Visão Geral'}
            {currentView === 'WALLET' && 'Minha Carteira'}
            {currentView === 'REPORTS' && 'Relatórios'}
            {currentView === 'USERS' && 'Gestão de Usuários'}
          </h1>
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
             <div className="flex flex-col items-end mr-2 sm:mr-4">
                 <span className="text-[10px] uppercase text-gray-500">Saldo Plax</span>
                 <span className="font-bold text-plax-700 text-sm sm:text-base">{currentUser.balancePlax.toFixed(2)}</span>
             </div>
             <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
             <div className="flex flex-col items-end">
                 <span className="text-[10px] uppercase text-gray-500">Saldo R$</span>
                 <span className="font-bold text-gray-800 text-sm sm:text-base">R$ {currentUser.balanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto pb-20">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-md transition-colors ${active ? 'bg-plax-700 text-white shadow-md' : 'text-plax-300 hover:bg-plax-800 hover:text-white'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

export default Layout;
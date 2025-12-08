import React from 'react';
import { User, UserRole } from '../types';
import { 
  Recycle, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  BarChart3, 
  LogOut
} from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  children: React.ReactNode;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, children, onLogout, currentView, onNavigate }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-plax-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center space-x-3 border-b border-plax-800">
          <div className="bg-white p-2 rounded-full">
            <Recycle className="h-6 w-6 text-plax-600" />
          </div>
          <span className="text-xl font-bold tracking-tight">PlaxRec</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="mb-6 px-4">
             <p className="text-xs uppercase text-plax-400 font-semibold mb-2">Perfil</p>
             <div className="flex items-center space-x-3 bg-plax-800 p-3 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-plax-500 flex items-center justify-center text-lg font-bold">
                    {currentUser.name.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-medium truncate w-32">{currentUser.name}</p>
                    <p className="text-xs text-plax-300">{currentUser.role}</p>
                </div>
             </div>
          </div>

          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentView === 'DASHBOARD'} 
            onClick={() => onNavigate('DASHBOARD')}
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Carteira Plax" 
            active={currentView === 'WALLET'} 
            onClick={() => onNavigate('WALLET')}
          />
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Relatórios" 
            active={currentView === 'REPORTS'} 
            onClick={() => onNavigate('REPORTS')}
          />
          {currentUser.role === UserRole.ADMIN && (
             <NavItem 
                icon={<Users size={20} />} 
                label="Usuários" 
                active={currentView === 'USERS'} 
                onClick={() => onNavigate('USERS')}
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
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-gray-800">
            {currentView === 'DASHBOARD' && 'Visão Geral'}
            {currentView === 'WALLET' && 'Minha Carteira'}
            {currentView === 'REPORTS' && 'Relatórios & Métricas'}
            {currentView === 'USERS' && 'Gestão de Usuários'}
          </h1>
          <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end mr-4">
                 <span className="text-xs text-gray-500">Saldo Atual</span>
                 <span className="font-bold text-plax-700">{currentUser.balancePlax.toFixed(2)} PLAX</span>
             </div>
             <div className="h-8 w-px bg-gray-200"></div>
             <div className="flex flex-col items-end">
                 <span className="text-xs text-gray-500">Disponível em R$</span>
                 <span className="font-bold text-gray-800">R$ {currentUser.balanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
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
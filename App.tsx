import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { CollectorView, RecyclerView, TransformerView, ESGView, AdminView } from './views/DashboardViews';
import WalletView from './views/WalletView';
import { ReportsView } from './views/ReportsView';
import SettingsView from './views/SettingsView';
import AuthView from './views/AuthView';
import RoleSelectionView from './views/RoleSelectionView';
import PlaxAssistant from './components/PlaxAssistant';
import { User, UserRole } from './types';
import { plaxService } from './services/mockState';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Fail-safe: Se a sessão não carregar em 6 segundos, libera a tela
    const safetyTimeout = setTimeout(() => {
        if (mounted && checkingSession) {
            console.warn("Timeout de sessão atingido. Liberando UI.");
            setCheckingSession(false);
        }
    }, 6000);

    const initSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                let user = await plaxService.getCurrentUser(session.user.id);
                if (user && mounted) {
                    setCurrentUser(user);
                }
            }
        } catch (error) {
            console.error("Erro ao inicializar sessão:", error);
        } finally {
            if (mounted) setCheckingSession(false);
        }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
             const user = await plaxService.getCurrentUser(session.user.id);
             if (user && mounted) setCurrentUser(user);
        } else if (event === 'SIGNED_OUT') {
            if (mounted) setCurrentUser(null);
        }
    });

    return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    if (currentUser) {
        const updated = await plaxService.getCurrentUser(currentUser.id);
        if (updated) setCurrentUser({...updated});
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
      if (!currentUser) return;
      
      const res = await plaxService.updateProfileRole(currentUser.id, role);
      if (res?.success) {
          const updatedUser = { ...currentUser, role };
          setCurrentUser(updatedUser);
      } else {
          alert("Erro ao atualizar perfil: " + (res?.message || "Erro desconhecido"));
      }
  };

  const renderContent = () => {
    if (!currentUser) return null;

    if (currentView === 'WALLET') {
        return <WalletView user={currentUser} refresh={handleRefresh} />;
    }
    
    if (currentView === 'REPORTS') {
        return <ReportsView user={currentUser} refresh={handleRefresh} />;
    }

    if (currentView === 'SETTINGS') {
        return <SettingsView user={currentUser} refresh={handleRefresh} onUpdateUser={handleRefresh} />;
    }

    // DASHBOARD View logic
    switch (currentUser.role) {
      case UserRole.COLLECTOR: return <CollectorView user={currentUser} refresh={handleRefresh} />;
      case UserRole.RECYCLER: return <RecyclerView user={currentUser} refresh={handleRefresh} />;
      case UserRole.TRANSFORMER: return <TransformerView user={currentUser} refresh={handleRefresh} />;
      case UserRole.ESG_BUYER: return <ESGView user={currentUser} refresh={handleRefresh} />;
      case UserRole.ADMIN: return <AdminView user={currentUser} refresh={handleRefresh} />;
      default: return <div>Carregando dashboard...</div>;
    }
  };

  if (checkingSession) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plax-600 mb-4"></div>
              <p className="text-gray-500 font-medium">Iniciando PlaxRec...</p>
              <p className="text-xs text-gray-400 mt-2">Conectando ao banco de dados...</p>
          </div>
      )
  }

  // Not logged in -> Show Auth View
  if (!currentUser) {
    return <AuthView onLogin={(user) => {
        setCurrentUser(user);
        setCurrentView('DASHBOARD');
    }} />;
  }

  // Logged in but Guest -> Show Role Selection
  if (currentUser.role === UserRole.GUEST) {
      return <RoleSelectionView userName={currentUser.name} onSelectRole={handleRoleSelection} />;
  }

  // Logged in and has Role -> Show Main App
  return (
    <Layout 
        currentUser={currentUser} 
        onLogout={() => setCurrentUser(null)}
        currentView={currentView}
        onNavigate={setCurrentView}
    >
      {renderContent()}
      <PlaxAssistant user={currentUser} />
    </Layout>
  );
};

export default App;
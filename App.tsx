import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { CollectorView, RecyclerView, TransformerView, ESGView, AdminView } from './views/DashboardViews';
import WalletView from './views/WalletView';
import { ReportsView } from './views/ReportsView';
import AuthView from './views/AuthView';
import PlaxAssistant from './components/PlaxAssistant';
import { User, UserRole } from './types';
import { plaxService } from './services/mockState';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Check active session on load (handles OAuth redirect)
    const initSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                let user = await plaxService.getCurrentUser(session.user.id);
                
                // Check for pending role preference from Google Login redirect
                const pendingRole = localStorage.getItem('plax_google_role_pref') as UserRole | null;
                if (pendingRole && user) {
                    // If the user's current role is the default 'COLETOR' but they asked for something else, update it.
                    // Or update it regardless if it was a fresh signup.
                    if (user.role !== pendingRole) {
                        await plaxService.updateProfileRole(user.id, pendingRole);
                        user.role = pendingRole; // Optimistic update
                    }
                    localStorage.removeItem('plax_google_role_pref');
                }

                if (user) {
                    setCurrentUser(user);
                }
            }
        } catch (error) {
            console.error("Erro ao inicializar sessão:", error);
        } finally {
            // Garante que o loading para, independente do sucesso ou falha
            setCheckingSession(false);
        }
    };
    initSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
             const user = await plaxService.getCurrentUser(session.user.id);
             if (user) setCurrentUser(user);
        } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRefresh = async () => {
    if (currentUser) {
        const updated = await plaxService.getCurrentUser(currentUser.id);
        if (updated) setCurrentUser({...updated});
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

    // DASHBOARD View logic
    switch (currentUser.role) {
      case UserRole.COLLECTOR: return <CollectorView user={currentUser} refresh={handleRefresh} />;
      case UserRole.RECYCLER: return <RecyclerView user={currentUser} refresh={handleRefresh} />;
      case UserRole.TRANSFORMER: return <TransformerView user={currentUser} refresh={handleRefresh} />;
      case UserRole.ESG_BUYER: return <ESGView user={currentUser} refresh={handleRefresh} />;
      case UserRole.ADMIN: return <AdminView user={currentUser} refresh={handleRefresh} />;
      default: return <div>Unknown Role</div>;
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

  if (!currentUser) {
    return <AuthView onLogin={(user) => {
        setCurrentUser(user);
        setCurrentView('DASHBOARD');
    }} />;
  }

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
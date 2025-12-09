import React, { useState } from 'react';
import Layout from './components/Layout';
import { CollectorView, RecyclerView, TransformerView, ESGView, AdminView } from './views/DashboardViews';
import WalletView from './views/WalletView';
import { ReportsView } from './views/ReportsView';
import AuthView from './views/AuthView';
import PlaxAssistant from './components/PlaxAssistant';
import { User, UserRole } from './types';
import { plaxService } from './services/mockState';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('DASHBOARD');

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
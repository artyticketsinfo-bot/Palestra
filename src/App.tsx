/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { GymProvider } from './contexts/GymContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Staff from './components/Staff';
import Memberships from './components/Memberships';
import Invoices from './components/Invoices';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import Login from './components/Login';
import AIAssistant from './components/AIAssistant';
import { testFirestoreConnection } from './hooks/useFirestore';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shouldOpenClientModal, setShouldOpenClientModal] = useState(false);
  const [shouldOpenInvoiceModal, setShouldOpenInvoiceModal] = useState(false);

  useEffect(() => {
    if (user) {
      testFirestoreConnection();
    }
  }, [user]);

  const handleAddClientFromDashboard = () => {
    setActiveTab('clients');
    setShouldOpenClientModal(true);
  };

  const handleAddInvoiceFromDashboard = () => {
    setActiveTab('invoices');
    setShouldOpenInvoiceModal(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onAddClient={handleAddClientFromDashboard} onAddInvoice={handleAddInvoiceFromDashboard} />;
      case 'clients': return <Clients initialOpenModal={shouldOpenClientModal} onModalClose={() => setShouldOpenClientModal(false)} />;
      case 'staff': return <Staff />;
      case 'memberships': return <Memberships />;
      case 'invoices': return <Invoices initialOpenModal={shouldOpenInvoiceModal} onModalClose={() => setShouldOpenInvoiceModal(false)} />;
      case 'calendar': return <Calendar />;
      case 'settings': return <Settings />;
      default: return <Dashboard onAddClient={handleAddClientFromDashboard} onAddInvoice={handleAddInvoiceFromDashboard} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      <AIAssistant />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GymProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </GymProvider>
    </AuthProvider>
  );
}

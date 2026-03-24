import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Dumbbell,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGym } from '../contexts/GymContext';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout } = useAuth();
  const { settings } = useGym();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'staff', label: 'Staff', icon: Briefcase },
    { id: 'memberships', label: 'Abbonamenti', icon: CreditCard },
    { id: 'invoices', label: 'Fatturazione', icon: FileText },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'settings', label: 'Impostazioni', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-stone-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-100 border-r border-stone-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500 p-1.5 rounded-xl shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Dumbbell className="w-6 h-6 text-stone-900" />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight truncate">{settings.name}</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-emerald-500 text-stone-900 font-medium shadow-lg shadow-emerald-500/20" 
                  : "hover:bg-stone-800 text-stone-400 hover:text-stone-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
              alt="User" 
              className="w-8 h-8 rounded-full border border-stone-700"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-stone-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 text-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 max-w-[70%]">
          <div className="bg-emerald-500 p-1 rounded-lg shrink-0 w-8 h-8 flex items-center justify-center overflow-hidden">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Dumbbell className="w-5 h-5 text-stone-900 shrink-0" />
            )}
          </div>
          <span className="font-bold truncate">{settings.name}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 bg-stone-900 z-40 pt-20 px-4 flex flex-col"
          >
            <nav className="space-y-2 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-4 rounded-xl text-lg font-bold transition-all active:scale-95",
                    activeTab === item.id ? "bg-emerald-500 text-stone-900 shadow-lg shadow-emerald-500/20" : "text-stone-400"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="pb-8 border-t border-stone-800 pt-6">
              <button 
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-red-400 font-bold text-lg active:scale-95"
              >
                <LogOut className="w-6 h-6" />
                Esci
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

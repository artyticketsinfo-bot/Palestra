import React from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useFirestore } from '../hooks/useFirestore';
import { Client, Membership, Invoice, Staff } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardProps {
  onAddClient: () => void;
  onAddInvoice: () => void;
}

export default function Dashboard({ onAddClient, onAddInvoice }: DashboardProps) {
  const { data: clients } = useFirestore<Client>('clients');
  const { data: memberships } = useFirestore<Membership>('memberships');
  const { data: invoices } = useFirestore<Invoice>('invoices');
  const { data: staffMembers } = useFirestore<Staff>('staff');

  const activeMemberships = memberships.filter(m => m.status === 'Active');
  const activeStaff = staffMembers.filter(s => s.active);
  const expiringSoon = memberships.filter(m => {
    const end = new Date(m.endDate);
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    return m.status === 'Active' && isAfter(end, now) && isBefore(end, sevenDaysFromNow);
  });

  const currentMonthInvoices = invoices.filter(inv => {
    const date = new Date(inv.date);
    return isWithinInterval(date, {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    }) && inv.status === 'Paid';
  });

  const monthlyIncome = currentMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Mock data for chart (in a real app, you'd aggregate this from invoices)
  const chartData = [
    { name: 'Gen', income: 4500 },
    { name: 'Feb', income: 5200 },
    { name: 'Mar', income: monthlyIncome || 4800 },
    { name: 'Apr', income: 6100 },
    { name: 'Mag', income: 5900 },
    { name: 'Giu', income: 7200 },
  ];

  const stats = [
    { label: 'Clienti Attivi', value: activeMemberships.length, icon: UserCheck, color: 'bg-emerald-500', trend: '+5%', help: 'Clienti con un abbonamento attualmente in corso.' },
    { label: 'Staff Attivo', value: activeStaff.length, icon: Users, color: 'bg-blue-500', trend: '0%', help: 'Numero di collaboratori attualmente attivi.' },
    { label: 'In Scadenza', value: expiringSoon.length, icon: Clock, color: 'bg-amber-500', trend: '-2%', help: 'Abbonamenti che scadranno nei prossimi 7 giorni.' },
    { label: 'Incasso Mese', value: formatCurrency(monthlyIncome), icon: TrendingUp, color: 'bg-purple-500', trend: '+18%', help: 'Totale delle fatture pagate nel mese corrente.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-stone-500 font-medium">Benvenuto, ecco una panoramica della tua palestra.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-3">
          <button 
            onClick={onAddInvoice}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-4 md:px-5 py-3.5 md:py-2.5 rounded-xl font-bold md:font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm md:text-base">Fattura</span>
          </button>
          <button 
            onClick={onAddClient}
            className="flex items-center justify-center gap-2 bg-stone-900 text-white px-4 md:px-5 py-3.5 md:py-2.5 rounded-xl font-bold md:font-medium hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm md:text-base">Cliente</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-stone-300 cursor-help hover:text-stone-400 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-stone-900 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none font-medium leading-relaxed">
                  {stat.help}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-stone-900" />
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold text-stone-900">Andamento Entrate</h2>
            <select className="bg-stone-50 border-none text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto">
              <option>Ultimi 6 mesi</option>
              <option>Ultimo anno</option>
            </select>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1917', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Clienti Recenti</h2>
          <div className="space-y-6">
            {clients.slice(0, 5).map((client, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-sm group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{client.firstName} {client.lastName}</p>
                  <p className="text-xs text-stone-500 truncate">Iscritto il {format(new Date(client.registrationDate), 'dd MMM yyyy', { locale: it })}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-stone-400 text-sm">Nessun cliente registrato.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors border-t border-stone-50">
            Visualizza tutti
          </button>
        </div>
      </div>
    </div>
  );
}

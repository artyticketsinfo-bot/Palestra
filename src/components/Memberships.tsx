import React, { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Membership, Client } from '../types';
import { 
  Plus, 
  Search, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X,
  FileDown,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { formatCurrency, cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';
import { generateMembershipPDF } from '../lib/pdfUtils';
import { GymSettings } from '../types';

export default function Memberships() {
  const { data: memberships, add, update, remove, loading } = useFirestore<Membership>('memberships');
  const { data: clients } = useFirestore<Client>('clients');
  const { data: settings } = useFirestore<GymSettings>('settings');
  const gymSettings = settings[0] || null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expired' | 'Cancelled'>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGeneratePDF = async (membership: Membership) => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      const client = clients.find(c => c.id === membership.clientId);
      generateMembershipPDF(membership, client, gymSettings);
      setIsGeneratingPDF(false);
    }, 500);
  };

  const getEffectiveStatus = (membership: Membership) => {
    if (membership.status === 'Cancelled') return 'Cancelled';
    const now = new Date();
    const endDate = new Date(membership.endDate);
    if (endDate < now) return 'Expired';
    return 'Active';
  };

  const filteredMemberships = memberships.filter(m => {
    const client = clients.find(c => c.id === m.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : '';
    const status = getEffectiveStatus(m);
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) || m.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Expired': return 'bg-red-50 text-red-600 border-red-100';
      case 'Cancelled': return 'bg-stone-100 text-stone-500 border-stone-200';
      default: return 'bg-stone-50 text-stone-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Expired': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'Cancelled': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;
    const startDate = formData.get('startDate') as string;
    const price = Number(formData.get('price'));
    
    let endDate = new Date(startDate);
    if (type === 'Mensile') endDate = addMonths(endDate, 1);
    else if (type === 'Trimestrale') endDate = addMonths(endDate, 3);
    else if (type === 'Semestrale') endDate = addMonths(endDate, 6);
    else if (type === 'Annuale') endDate = addYears(endDate, 1);

    const paymentStatus = formData.get('paymentStatus') as 'Paid' | 'Pending';
    const paymentMethod = formData.get('paymentMethod') as string;
    const paymentDate = formData.get('paymentDate') as string;
    const notes = formData.get('notes') as string;

    await add({
      clientId: formData.get('clientId') as string,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate.toISOString(),
      type,
      price,
      status: 'Active',
      paymentStatus,
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
      notes,
      createdBy: 'Admin', // Default for now
    } as any);
    
    setIsModalOpen(false);
  };

  React.useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Abbonamenti</h1>
          <p className="text-stone-500 font-medium">Gestisci le iscrizioni e le scadenze dei tuoi clienti.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-6 py-4 md:py-3 rounded-2xl font-black md:font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Nuovo Abbonamento
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Cerca per cliente o tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 md:py-3.5 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm text-base"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {(['All', 'Active', 'Expired', 'Cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border",
                statusFilter === status 
                  ? "bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-900/20" 
                  : "bg-white text-stone-500 border-stone-100 hover:bg-stone-50"
              )}
            >
              {status === 'All' ? 'Tutti' : status === 'Active' ? 'Attivi' : status === 'Expired' ? 'Scaduti' : 'Annullati'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50 border-b border-stone-100">
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest">Cliente</th>
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest">Tipo</th>
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest">Periodo</th>
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest text-center">Prezzo</th>
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest text-center">Stato Abbonamento</th>
              <th className="px-8 py-6 text-[11px] font-black text-stone-400 uppercase tracking-widest text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-stone-400">Caricamento...</td>
              </tr>
            ) : filteredMemberships.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-stone-400">Nessun abbonamento trovato.</td>
              </tr>
            ) : filteredMemberships.map((membership) => {
              const client = clients.find(c => c.id === membership.clientId);
              const status = getEffectiveStatus(membership);
              return (
                <tr key={membership.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                        {client?.firstName[0]}{client?.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{client?.firstName} {client?.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium text-stone-600">{membership.type}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-medium text-stone-900">
                      {format(new Date(membership.startDate), 'dd/MM/yy')} - {format(new Date(membership.endDate), 'dd/MM/yy')}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-bold text-stone-900">{formatCurrency(membership.price)}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      getStatusColor(status)
                    )}>
                      {getStatusIcon(status)}
                      {status === 'Active' ? 'Attivo' : status === 'Expired' ? 'Scaduto' : 'Annullato'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleGeneratePDF(membership)}
                        disabled={isGeneratingPDF}
                        className="p-2.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                        title="Esporta PDF"
                      >
                        <FileDown className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => update(membership.id, { status: status === 'Active' ? 'Cancelled' : 'Active' })}
                        className="p-2.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
                        title={status === 'Active' ? 'Annulla' : 'Riattiva'}
                      >
                        {status === 'Active' ? <XCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(membership.id)}
                        className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-stone-400">Caricamento...</div>
        ) : filteredMemberships.length === 0 ? (
          <div className="col-span-full text-center py-12 text-stone-400">Nessun abbonamento trovato.</div>
        ) : filteredMemberships.map((membership) => {
          const client = clients.find(c => c.id === membership.clientId);
          const status = getEffectiveStatus(membership);
          return (
            <div key={membership.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">{client?.firstName} {client?.lastName}</h3>
                    <p className="text-xs text-stone-500">{membership.type}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                  getStatusColor(status)
                )}>
                  {getStatusIcon(status)}
                  {status === 'Active' ? 'Attivo' : status === 'Expired' ? 'Scaduto' : 'Annullato'}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Inizio
                  </span>
                  <span className="font-medium text-stone-900">{format(new Date(membership.startDate), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Fine
                  </span>
                  <span className="font-medium text-stone-900">{format(new Date(membership.endDate), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-4 border-t border-stone-50">
                  <span className="text-stone-500">Prezzo</span>
                  <span className="text-lg font-bold text-stone-900">{formatCurrency(membership.price)}</span>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleGeneratePDF(membership)}
                  disabled={isGeneratingPDF}
                  className="flex-1 py-2.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Esporta PDF"
                >
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => update(membership.id, { status: status === 'Active' ? 'Cancelled' : 'Active' })}
                  className="flex-1 py-2.5 text-xs font-bold bg-stone-50 text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  {status === 'Active' ? 'Annulla' : 'Riattiva'}
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(membership.id)}
                  className="px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      </div>

      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-stone-100 flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-stone-900">Generazione PDF...</p>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md min-h-screen md:min-h-0 md:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 md:rounded-t-[2.5rem]">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Nuovo Abbonamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-stone-200 rounded-2xl transition-all active:scale-90 bg-stone-100 text-stone-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Cliente</label>
                <select name="clientId" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleziona un cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Tipo Abbonamento</label>
                <select name="type" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="Mensile">Mensile</option>
                  <option value="Trimestrale">Trimestrale</option>
                  <option value="Semestrale">Semestrale</option>
                  <option value="Annuale">Annuale</option>
                  <option value="Ingressi">10 Ingressi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Data Inizio</label>
                  <input name="startDate" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Prezzo (€)</label>
                  <input name="price" type="number" required defaultValue="50" className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Dettagli Pagamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Stato Pagamento</label>
                    <select name="paymentStatus" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="Paid">Pagato</option>
                      <option value="Pending">In Attesa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Metodo</label>
                    <select name="paymentMethod" className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="Contanti">Contanti</option>
                      <option value="Carta">Carta</option>
                      <option value="Bonifico">Bonifico</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Data Pagamento</label>
                  <input name="paymentDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Note</label>
                <textarea name="notes" rows={3} className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Eventuali annotazioni..." />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 md:pt-10 border-t border-stone-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 bg-stone-100 text-stone-600 rounded-[1.5rem] font-black text-lg hover:bg-stone-200 transition-all active:scale-95">
                  Annulla
                </button>
                <button type="submit" className="flex-1 px-8 py-5 bg-emerald-500 text-stone-900 rounded-[1.5rem] font-black text-lg hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95">
                  Crea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            remove(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Elimina Abbonamento"
        message="Sei sicuro di voler eliminare questo abbonamento? Questa azione non può essere annullata."
        confirmText="Sì, Elimina"
        cancelText="No, Annulla"
      />
    </>
  );
}

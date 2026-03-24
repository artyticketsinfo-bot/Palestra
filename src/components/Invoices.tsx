import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Invoice, Client, Membership, GymSettings, InvoiceItem } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  PlusCircle,
  MinusCircle,
  User,
  Building2,
  Calendar,
  CreditCard,
  Printer,
  FileDown,
  Info,
  RefreshCw
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatCurrency, cn } from '../lib/utils';
import { useGym } from '../contexts/GymContext';
import { generateInvoicePDF } from '../lib/pdfUtils';
import ConfirmDialog from './ConfirmDialog';

interface InvoicesProps {
  initialOpenModal?: boolean;
  onModalClose?: () => void;
}

export default function Invoices({ initialOpenModal, onModalClose }: InvoicesProps) {
  const { data: invoices, add, update, remove, loading } = useFirestore<Invoice>('invoices');
  const { data: clients } = useFirestore<Client>('clients');
  const { data: memberships } = useFirestore<Membership>('memberships');
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal || false);

  useEffect(() => {
    if (initialOpenModal) {
      setIsModalOpen(true);
    }
  }, [initialOpenModal]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onModalClose) onModalClose();
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceType, setInvoiceType] = useState<'Automatic' | 'Manual'>('Automatic');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', price: 0, quantity: 1, serviceType: 'Abbonamento' }]);
  const [manualClientData, setManualClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    taxCode: '',
    healthCard: '',
    address: '',
    civicNumber: '',
    zipCode: '',
    city: '',
  });
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { settings: gymSettings } = useGym();

  const handleGeneratePDF = async (invoice: Invoice, autoPrint = false) => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      generateInvoicePDF(invoice, gymSettings, autoPrint);
      setIsGeneratingPDF(false);
    }, 500);
  };

  const filteredInvoices = invoices.filter(inv => {
    const clientName = inv.clientData 
      ? `${inv.clientData.firstName} ${inv.clientData.lastName}`
      : clients.find(c => c.id === inv.clientId)?.firstName + ' ' + clients.find(c => c.id === inv.clientId)?.lastName;
    return clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600';
      case 'Pending': return 'bg-amber-50 text-amber-600';
      case 'Overdue': return 'bg-red-50 text-red-600';
      default: return 'bg-stone-50 text-stone-500';
    }
  };

  const addItem = () => setItems([...items, { description: '', price: 0, quantity: 1, serviceType: 'Servizio' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      // Find active membership for this client
      const activeMembership = memberships.find(m => m.clientId === clientId && m.status === 'Active');
      if (activeMembership) {
        setSelectedMembershipId(activeMembership.id);
        setItems([{
          description: `Abbonamento ${activeMembership.type} (${format(new Date(activeMembership.startDate), 'dd/MM/yy')} - ${format(new Date(activeMembership.endDate), 'dd/MM/yy')})`,
          price: activeMembership.price,
          quantity: 1,
          serviceType: 'Abbonamento'
        }]);
      } else {
        setSelectedMembershipId('');
        setItems([{ description: '', price: 0, quantity: 1, serviceType: 'Abbonamento' }]);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent, action?: 'save' | 'pdf' | 'print') => {
    if (e) e.preventDefault();
    
    if (isSaving) return;

    if (!gymSettings) {
      alert('Configura i dati della palestra nelle impostazioni prima di creare una fattura.');
      return;
    }

    // Validation
    if (items.length === 0) {
      alert('Aggiungi almeno un elemento alla fattura.');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      alert('Inserisci una descrizione per tutti gli elementi della fattura.');
      return;
    }

    if (items.some(item => item.price < 0)) {
      alert('Il prezzo degli elementi non può essere negativo.');
      return;
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let clientDataToSave;
    if (invoiceType === 'Automatic') {
      if (!selectedClientId) {
        alert('Seleziona un cliente.');
        return;
      }
      const client = clients.find(c => c.id === selectedClientId);
      if (!client) {
        alert('Cliente non trovato nell\'anagrafica.');
        return;
      }
      clientDataToSave = {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        taxCode: client.taxCode,
        address: client.address,
        civicNumber: client.civicNumber,
        zipCode: client.zipCode,
        city: client.city,
        clientCode: client.clientCode,
      };
    } else {
      if (!manualClientData.firstName || !manualClientData.lastName) {
        alert('Inserisci nome e cognome del cliente.');
        return;
      }
      clientDataToSave = manualClientData;
    }

    const cleanInvoiceData = {
      ...(invoiceType === 'Automatic' ? { clientId: selectedClientId } : {}),
      clientData: clientDataToSave,
      items: items.map(item => ({
        description: item.description,
        price: Number(item.price),
        quantity: Number(item.quantity),
        serviceType: item.serviceType
      })),
      date: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      status,
      total,
      type: invoiceType,
      notes: notes || '',
      issuerData: {
        name: gymSettings.name || '',
        email: gymSettings.email || '',
        phone: gymSettings.phone || '',
        address: gymSettings.address || '',
        vat: gymSettings.vat || '',
      },
    };

    try {
      setIsSaving(true);
      const newInvoiceId = await add(cleanInvoiceData as any);
      
      if (!newInvoiceId) {
        throw new Error('Errore durante il salvataggio: ID non generato');
      }

      if (action === 'pdf' || action === 'print') {
        setIsGeneratingPDF(true);
        const fullInvoice = { ...cleanInvoiceData, id: newInvoiceId } as Invoice;
        setTimeout(() => {
          generateInvoicePDF(fullInvoice, gymSettings, action === 'print');
          setIsGeneratingPDF(false);
        }, 500);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleCloseModal();
        resetForm();
        setIsSaving(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setIsSaving(false);
      alert('Errore durante il salvataggio della fattura. Riprova.');
    }
  };

  const resetForm = () => {
    setItems([{ description: '', price: 0, quantity: 1, serviceType: 'Abbonamento' }]);
    setSelectedClientId('');
    setSelectedMembershipId('');
    setManualClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      taxCode: '',
      healthCard: '',
      address: '',
      civicNumber: '',
      zipCode: '',
      city: '',
    });
    setNotes('');
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    setStatus('Pending');
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
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Fatturazione</h1>
            <p className="text-stone-500 font-medium">Gestisci i pagamenti e le fatture dei tuoi clienti.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-6 py-4 md:py-3 rounded-2xl font-black md:font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Nuova Fattura
          </button>
        </header>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Cerca per cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 md:py-3.5 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all text-base"
          />
        </div>

        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 border-bottom border-stone-100">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Importo</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400">Caricamento...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400">Nessuna fattura trovata.</td></tr>
                  ) : filteredInvoices.map((invoice) => {
                    const clientName = invoice.clientData 
                      ? `${invoice.clientData.firstName} ${invoice.clientData.lastName}`
                      : clients.find(c => c.id === invoice.clientId)?.firstName + ' ' + clients.find(c => c.id === invoice.clientId)?.lastName;
                    return (
                      <tr key={invoice.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{clientName}</p>
                              <p className="text-xs text-stone-500">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-stone-900">{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-stone-500">Scadenza: {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-stone-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                            getStatusColor(invoice.status)
                          )}>
                            {invoice.status === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : invoice.status === 'Pending' ? <Clock className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {invoice.status === 'Paid' ? 'Pagata' : invoice.status === 'Pending' ? 'In attesa' : 'Scaduta'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => update(invoice.id, { status: 'Paid' })}
                              className="p-2 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Segna come pagata"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleGeneratePDF(invoice, true)}
                              disabled={isGeneratingPDF}
                              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors disabled:opacity-50" 
                              title="Stampa"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleGeneratePDF(invoice)}
                              disabled={isGeneratingPDF}
                              className="p-2 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" 
                              title="Esporta PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(invoice.id)}
                              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-12 text-stone-400">Caricamento...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-stone-400">Nessuna fattura trovata.</div>
            ) : filteredInvoices.map((invoice) => {
              const clientName = invoice.clientData 
                ? `${invoice.clientData.firstName} ${invoice.clientData.lastName}`
                : clients.find(c => c.id === invoice.clientId)?.firstName + ' ' + clients.find(c => c.id === invoice.clientId)?.lastName;
              return (
                <div key={invoice.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-stone-900 text-lg">{clientName}</p>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                      getStatusColor(invoice.status)
                    )}>
                      {invoice.status === 'Paid' ? 'Pagata' : invoice.status === 'Pending' ? 'In attesa' : 'Scaduta'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-50">
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Data</p>
                      <p className="text-sm font-bold text-stone-900">{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Importo</p>
                      <p className="text-lg font-black text-emerald-600">{formatCurrency(invoice.total)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => update(invoice.id, { status: 'Paid' })}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Paga
                    </button>
                    <button 
                      onClick={() => handleGeneratePDF(invoice, true)}
                      disabled={isGeneratingPDF}
                      className="p-3 bg-stone-100 text-stone-600 rounded-xl disabled:opacity-50"
                      title="Stampa"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleGeneratePDF(invoice)}
                      disabled={isGeneratingPDF}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(invoice.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-stone-100 flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-stone-900">Generazione PDF...</p>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex justify-center p-0 md:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-6xl md:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 h-full md:h-[90vh] md:max-h-[950px] md:my-auto border border-stone-100 flex flex-col overflow-hidden relative">
            <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-none z-20 backdrop-blur-md">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Crea Nuova Fattura</h2>
                <p className="hidden md:block text-stone-500 font-medium mt-1">Gym Master - Sistema di Fatturazione Professionale</p>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-stone-200 rounded-2xl transition-all active:scale-90 bg-stone-100 text-stone-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col min-h-0 relative">
              {/* Success Message Overlay */}
              {showSuccess && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in duration-300">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900">Fattura Salvata!</h3>
                    <p className="text-stone-500 font-medium">I dati sono stati archiviati correttamente.</p>
                  </div>
                </div>
              )}

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {/* TOP SECTION: Client Data, Dates, Status */}
                <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                      {/* 1. Tipo Fattura & 4. Date e Stato (Compact Row) */}
                      <div className="flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 border-l-4 border-stone-900 pl-3">
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">1. Tipo Fattura</h3>
                          </div>
                          <div className="flex p-1 bg-stone-100 rounded-xl w-full">
                            <button
                              type="button"
                              onClick={() => setInvoiceType('Automatic')}
                              className={cn(
                                "flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest",
                                invoiceType === 'Automatic' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                              )}
                            >
                              Automatica
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceType('Manual')}
                              className={cn(
                                "flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest",
                                invoiceType === 'Manual' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                              )}
                            >
                              Manuale
                            </button>
                          </div>
                        </div>

                        <div className="flex-[2] space-y-3">
                          <div className="flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">4. Date e Stato</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Emissione</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                                <input 
                                  type="date" 
                                  value={issueDate}
                                  onChange={e => setIssueDate(e.target.value)}
                                  required 
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Scadenza</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                                <input 
                                  type="date" 
                                  value={dueDate}
                                  onChange={e => setDueDate(e.target.value)}
                                  required 
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Stato</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                                <select 
                                  value={status}
                                  onChange={e => setStatus(e.target.value as any)}
                                  className="w-full pl-9 pr-6 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs appearance-none cursor-pointer"
                                >
                                  <option value="Pending">In attesa</option>
                                  <option value="Paid">Pagata</option>
                                  <option value="Overdue">Scaduta</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Sezione Cliente */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                          <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">2. Dati Cliente</h3>
                        </div>

                        {invoiceType === 'Automatic' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Seleziona Cliente</label>
                              <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                                <select 
                                  value={selectedClientId}
                                  onChange={(e) => handleClientChange(e.target.value)}
                                  required 
                                  className="w-full pl-10 pr-6 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs appearance-none cursor-pointer"
                                >
                                  <option value="">Cerca cliente nell'anagrafica...</option>
                                  {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.clientCode})</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {selectedClientId && (
                              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Abbonamento Associato</label>
                                <select 
                                  value={selectedMembershipId}
                                  onChange={(e) => {
                                    setSelectedMembershipId(e.target.value);
                                    const m = memberships.find(mem => mem.id === e.target.value);
                                    if (m) {
                                      updateItem(0, 'description', `Abbonamento ${m.type} (${format(new Date(m.startDate), 'dd/MM/yy')} - ${format(new Date(m.endDate), 'dd/MM/yy')})`);
                                      updateItem(0, 'price', m.price);
                                    }
                                  }}
                                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs appearance-none cursor-pointer"
                                >
                                  <option value="">Nessun abbonamento collegato</option>
                                  {memberships.filter(m => m.clientId === selectedClientId && m.status === 'Active').map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.type} - {formatCurrency(m.price)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {selectedClientId && (
                              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-0.5">
                                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Cliente</p>
                                  <p className="text-xs font-black text-stone-900">
                                    {clients.find(c => c.id === selectedClientId)?.firstName} {clients.find(c => c.id === selectedClientId)?.lastName}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Codice</p>
                                  <p className="text-xs font-black text-stone-900">{clients.find(c => c.id === selectedClientId)?.clientCode}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Codice Fiscale</p>
                                  <p className="text-xs font-black text-stone-900">{clients.find(c => c.id === selectedClientId)?.taxCode}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Indirizzo</p>
                                  <p className="text-[10px] font-bold text-stone-600 truncate">
                                    {clients.find(c => c.id === selectedClientId)?.address}, {clients.find(c => c.id === selectedClientId)?.city}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-500">
                            <input 
                              value={manualClientData.firstName}
                              onChange={e => setManualClientData({...manualClientData, firstName: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                              placeholder="Nome" 
                            />
                            <input 
                              value={manualClientData.lastName}
                              onChange={e => setManualClientData({...manualClientData, lastName: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                              placeholder="Cognome" 
                            />
                            <input 
                              value={manualClientData.taxCode}
                              onChange={e => setManualClientData({...manualClientData, taxCode: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs uppercase" 
                              placeholder="Codice Fiscale" 
                            />
                            <input 
                              type="email"
                              value={manualClientData.email}
                              onChange={e => setManualClientData({...manualClientData, email: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                              placeholder="Email" 
                            />
                            <input 
                              value={manualClientData.phone}
                              onChange={e => setManualClientData({...manualClientData, phone: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                              placeholder="Telefono" 
                            />
                            <input 
                              value={manualClientData.address}
                              onChange={e => setManualClientData({...manualClientData, address: e.target.value})}
                              required 
                              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-xs" 
                              placeholder="Indirizzo" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                      {/* 5. Emittente (Compact) */}
                      {gymSettings && (
                        <div className="bg-stone-900 p-5 rounded-2xl text-white space-y-3 shadow-lg shadow-stone-900/10 h-fit">
                          <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                            <p className="text-[9px] font-black uppercase tracking-widest">Dati Palestra</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-sm tracking-tight">{gymSettings.name}</p>
                            <p className="text-[10px] opacity-60 truncate">{gymSettings.email}</p>
                            <p className="text-[10px] font-black text-emerald-500">{gymSettings.vat}</p>
                          </div>
                        </div>
                      )}

                      <div className="bg-stone-100 p-5 rounded-2xl border border-stone-200 space-y-3">
                        <div className="flex items-center gap-2 text-stone-500">
                          <Info className="w-4 h-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Info Fattura</p>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                          Assicurati che i dati del cliente siano corretti. Le fatture salvate verranno archiviate nell'anagrafica del cliente selezionato.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE SECTION: Invoice Items and Notes */}
                <div className="p-6 md:p-8 space-y-10">
                  {/* 3. Sezione Voci Fattura */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-black text-stone-900 uppercase tracking-wider">3. Voci Fattura</h3>
                      <button type="button" onClick={addItem} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-emerald-50 px-4 py-2 rounded-xl">
                        <PlusCircle className="w-4 h-4" /> Aggiungi Riga
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100 relative group animate-in slide-in-from-right-2 duration-300">
                          <div className="md:col-span-5 space-y-1.5">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Descrizione</label>
                            <input 
                              value={item.description} 
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              required 
                              placeholder="Es. Abbonamento Mensile"
                              className="w-full px-4 py-2.5 bg-white border-2 border-transparent rounded-xl focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-sm" 
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Prezzo (€)</label>
                            <input 
                              type="number" 
                              value={item.price} 
                              onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                              required 
                              step="0.01"
                              className="w-full px-4 py-2.5 bg-white border-2 border-transparent rounded-xl focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-sm" 
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Quantità</label>
                            <input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              required 
                              min="1"
                              className="w-full px-4 py-2.5 bg-white border-2 border-transparent rounded-xl focus:border-emerald-500 transition-all outline-none text-stone-900 font-bold text-sm" 
                            />
                          </div>
                          <div className="md:col-span-2 flex items-end justify-between gap-2">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Totale</label>
                              <div className="px-4 py-2.5 bg-stone-200/50 rounded-xl text-stone-900 font-black text-sm text-center">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeItem(index)} 
                              disabled={items.length === 1}
                              className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 mb-0.5"
                            >
                              <MinusCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6. Note */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                      <h3 className="text-lg font-black text-stone-900 uppercase tracking-wider">6. Note</h3>
                    </div>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-stone-900 font-medium text-sm resize-none"
                      placeholder="Inserisci note aggiuntive..."
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: Total and Actions */}
              <div className="flex-none p-6 md:p-8 border-t bg-stone-50/90 backdrop-blur-md md:rounded-b-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 z-20 mt-auto">
                <div className="flex items-center justify-between w-full md:w-auto gap-8 bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Totale Fattura</p>
                    <p className="text-[9px] font-bold text-stone-500 italic">IVA Inclusa</p>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter">
                    {formatCurrency(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleCloseModal} 
                      className="px-5 py-3 bg-stone-100 text-stone-600 rounded-xl font-black text-xs hover:bg-stone-200 transition-all active:scale-95"
                    >
                      Annulla
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleSubmit(e as any, 'print')}
                      className="p-3 bg-stone-100 text-stone-600 rounded-xl font-black hover:bg-stone-200 transition-all active:scale-95"
                      title="Salva e Stampa"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      disabled={isGeneratingPDF}
                      onClick={(e) => handleSubmit(e as any, 'pdf')}
                      className="p-3 bg-stone-100 text-stone-600 rounded-xl font-black hover:bg-stone-200 transition-all active:scale-95 disabled:opacity-50"
                      title="Salva e Scarica PDF"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit(undefined, 'save')}
                    className="px-8 py-3 bg-emerald-500 text-stone-900 rounded-xl font-black text-base hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Salva Fattura
                      </>
                    )}
                  </button>
                </div>
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
        title="Elimina Fattura"
        message="Sei sicuro di voler eliminare questa fattura? Questa azione non può essere annullata."
        confirmText="Sì, Elimina"
        cancelText="No, Annulla"
      />
    </>
  );
}

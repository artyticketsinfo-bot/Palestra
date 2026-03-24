import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Client, Membership, Invoice, GymSettings } from '../types';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  Trash2,
  Edit2,
  X,
  Users,
  FileDown,
  Venus,
  Mars
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';
import { generateClientPDF } from '../lib/pdfUtils';

interface ClientsProps {
  initialOpenModal?: boolean;
  onModalClose?: () => void;
}

export default function Clients({ initialOpenModal, onModalClose }: ClientsProps) {
  const { data: clients, add, update, remove, loading } = useFirestore<Client>('clients');
  const { data: memberships } = useFirestore<Membership>('memberships');
  const { data: invoices } = useFirestore<Invoice>('invoices');
  const { data: settings } = useFirestore<GymSettings>('settings');
  const gymSettings = settings[0] || null;

  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal || false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F' | 'Other'>('M');

  useEffect(() => {
    if (editingClient) {
      setSelectedGender(editingClient.gender);
    } else {
      setSelectedGender('M');
    }
  }, [editingClient, isModalOpen]);

  const handleGeneratePDF = async (client: Client) => {
    setIsGeneratingPDF(true);
    // Small delay to show the feedback
    setTimeout(() => {
      const clientMemberships = memberships.filter(m => m.clientId === client.id);
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
      generateClientPDF(client, clientMemberships, gymSettings, clientInvoices);
      setIsGeneratingPDF(false);
    }, 500);
  };

  React.useEffect(() => {
    if (initialOpenModal) {
      setIsModalOpen(true);
    }
  }, [initialOpenModal]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    if (onModalClose) onModalClose();
  };

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      gender: formData.get('gender') as 'M' | 'F' | 'Other',
      birthDate: formData.get('birthDate') as string,
      taxCode: formData.get('taxCode') as string,
      address: formData.get('address') as string,
      civicNumber: formData.get('civicNumber') as string,
      zipCode: formData.get('zipCode') as string,
      city: formData.get('city') as string,
      clientCode: formData.get('clientCode') as string || `CL-${Math.floor(1000 + Math.random() * 9000)}`,
      registrationDate: editingClient?.registrationDate || new Date().toISOString(),
    };

    if (editingClient) {
      await update(editingClient.id, clientData);
    } else {
      await add(clientData as any);
    }
    setIsModalOpen(false);
    setEditingClient(null);
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
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Gestione Clienti</h1>
          <p className="text-stone-500 font-medium">Visualizza e gestisci l'anagrafica dei tuoi iscritti.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-6 py-4 md:py-3 rounded-2xl font-black md:font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Nuovo Cliente
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Cerca per nome, email o codice..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 md:py-3.5 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all text-base"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-white border border-stone-100 rounded-2xl font-bold md:font-medium text-stone-600 hover:bg-stone-50 transition-all shadow-sm w-full md:w-auto">
          <Filter className="w-5 h-5" />
          Filtri
        </button>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-bottom border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Contatti</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Codice</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Iscrizione</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">Caricamento...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">Nessun cliente trovato.</td>
                </tr>
              ) : filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-stone-500 capitalize">{client.gender === 'M' ? 'Uomo' : client.gender === 'F' ? 'Donna' : 'Altro'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Mail className="w-3.5 h-3.5" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Phone className="w-3.5 h-3.5" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-bold rounded-lg">
                      {client.clientCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(client.registrationDate), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleGeneratePDF(client)}
                        disabled={isGeneratingPDF}
                        className="p-2 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Esporta PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingClient(client);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(client.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-stone-100">
          {loading ? (
            <div className="p-8 text-center text-stone-400">Caricamento...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-stone-400">Nessun cliente trovato.</div>
          ) : filteredClients.map((client) => (
            <div key={client.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 font-black text-lg">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div>
                    <p className="font-black text-stone-900 text-lg">{client.firstName} {client.lastName}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{client.clientCode}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGeneratePDF(client)}
                    disabled={isGeneratingPDF}
                    className="p-3 bg-stone-50 text-stone-400 rounded-xl active:bg-blue-50 active:text-blue-500 transition-colors disabled:opacity-50"
                    title="Esporta PDF"
                  >
                    <FileDown className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingClient(client);
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-stone-50 text-stone-400 rounded-xl active:bg-emerald-50 active:text-emerald-500 transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(client.id)}
                    className="p-3 bg-stone-50 text-stone-400 rounded-xl active:bg-red-50 active:text-red-500 transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-stone-600 truncate">{client.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Telefono</p>
                  <p className="text-sm font-bold text-stone-600">{client.phone}</p>
                </div>
              </div>
            </div>
          ))}
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
          <div className="bg-white w-full max-w-4xl md:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 h-full md:h-[90vh] md:max-h-[900px] md:my-auto border border-stone-100 flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-none sticky top-0 z-20 backdrop-blur-md">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                  {editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
                </h2>
                <p className="text-stone-500 font-medium mt-1 hidden md:block">Gym Master - Gestione Anagrafica</p>
              </div>
              <button 
                onClick={closeModal}
                className="p-3 hover:bg-stone-200 rounded-2xl transition-all active:scale-90 bg-stone-100 text-stone-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 p-6 md:p-8 space-y-8 md:space-y-10 bg-white">
                {/* Sezione Dati Anagrafici */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Dati Anagrafici</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Nome</label>
                      <input name="firstName" defaultValue={editingClient?.firstName} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Mario" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Cognome</label>
                      <input name="lastName" defaultValue={editingClient?.lastName} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Rossi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Data di Nascita</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                        <input 
                          name="birthDate" 
                          type="date" 
                          defaultValue={editingClient?.birthDate} 
                          className="w-full pl-12 pr-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" 
                          placeholder="gg/mm/aaaa"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Sesso</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedGender('F')}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-95",
                            selectedGender === 'F' 
                              ? "bg-pink-50 border-pink-500 shadow-xl shadow-pink-500/10" 
                              : "bg-white border-stone-100 hover:border-stone-200"
                          )}
                        >
                          <motion.div
                            animate={{ scale: selectedGender === 'F' ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Venus className={cn("w-14 h-14 transition-colors duration-300", selectedGender === 'F' ? "text-pink-500" : "text-stone-300")} />
                          </motion.div>
                          <span className={cn("text-xs font-black uppercase tracking-widest", selectedGender === 'F' ? "text-pink-600" : "text-stone-500")}>Donna</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedGender('M')}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-95",
                            selectedGender === 'M' 
                              ? "bg-blue-50 border-blue-500 shadow-xl shadow-blue-500/10" 
                              : "bg-white border-stone-100 hover:border-stone-200"
                          )}
                        >
                          <motion.div
                            animate={{ scale: selectedGender === 'M' ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Mars className={cn("w-14 h-14 transition-colors duration-300", selectedGender === 'M' ? "text-blue-500" : "text-stone-300")} />
                          </motion.div>
                          <span className={cn("text-xs font-black uppercase tracking-widest", selectedGender === 'M' ? "text-blue-600" : "text-stone-500")}>Uomo</span>
                        </button>
                      </div>
                      <input type="hidden" name="gender" value={selectedGender} />
                    </div>
                  </div>
                </div>

                {/* Sezione Contatti e Fiscali */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Contatti</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Email</label>
                        <input name="email" type="email" defaultValue={editingClient?.email} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="mario.rossi@email.it" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Telefono</label>
                        <input name="phone" defaultValue={editingClient?.phone} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="+39 333 1234567" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-purple-500 pl-4">
                      <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Dati Fiscali</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Codice Fiscale</label>
                        <input name="taxCode" defaultValue={editingClient?.taxCode} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base uppercase" placeholder="RSSMRA80A01H501Z" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sezione Indirizzo */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Indirizzo</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Via / Piazza</label>
                      <input name="address" defaultValue={editingClient?.address} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Via Roma" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Civico</label>
                      <input name="civicNumber" defaultValue={editingClient?.civicNumber} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="12/A" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">CAP</label>
                      <input name="zipCode" defaultValue={editingClient?.zipCode} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="00100" />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Città</label>
                      <input name="city" defaultValue={editingClient?.city} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Roma" />
                    </div>
                  </div>
                </div>

                {/* Sezione Dati Sistema */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-stone-400 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Dati Sistema</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Codice Cliente</label>
                      <input name="clientCode" defaultValue={editingClient?.clientCode} placeholder="Auto-generato se vuoto" className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Data Iscrizione</label>
                      <input type="text" disabled value={editingClient ? format(new Date(editingClient.registrationDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')} className="w-full px-5 py-4 bg-stone-100 border-2 border-transparent rounded-2xl text-stone-400 font-bold text-base cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-none p-6 md:p-8 border-t border-stone-100 bg-stone-50/90 backdrop-blur-md md:rounded-b-[2.5rem] flex flex-col sm:flex-row gap-4 sticky bottom-0 z-20 mt-auto">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-8 py-5 bg-stone-100 text-stone-600 rounded-[1.5rem] font-black text-lg hover:bg-stone-200 transition-all active:scale-95"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-5 bg-emerald-500 text-stone-900 rounded-[1.5rem] font-black text-lg hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Plus className="w-6 h-6" />
                  {editingClient ? 'Salva Modifiche' : 'Salva Cliente'}
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
        title="Elimina Cliente"
        message="Sei sicuro di voler eliminare questo cliente? Questa azione eliminerà anche tutti i dati associati e non può essere annullata."
        confirmText="Sì, Elimina"
        cancelText="No, Annulla"
      />
    </>
  );
}

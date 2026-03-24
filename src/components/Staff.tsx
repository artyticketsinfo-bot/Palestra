import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Staff } from '../types';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  Trash2,
  Edit2,
  X,
  UserCircle,
  Briefcase,
  Palette,
  Venus,
  Mars,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

export default function StaffManagement() {
  const { data: staffMembers, add, update, remove, loading } = useFirestore<Staff>('staff');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F' | 'Other'>('M');
  const [selectedColor, setSelectedColor] = useState('#10b981'); // Default emerald

  const roles = [
    'Personal Trainer',
    'Reception',
    'Istruttore Corsi',
    'Manutenzione',
    'Direzione',
    'Altro'
  ];

  const colors = [
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ];

  useEffect(() => {
    if (editingStaff) {
      setSelectedGender(editingStaff.gender);
      setSelectedColor(editingStaff.color);
    } else {
      setSelectedGender('M');
      setSelectedColor('#10b981');
    }
  }, [editingStaff, isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const filteredStaff = staffMembers.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const staffData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      gender: formData.get('gender') as 'M' | 'F' | 'Other',
      birthDate: formData.get('birthDate') as string,
      role: formData.get('role') as string,
      specialization: formData.get('specialization') as string,
      availability: formData.get('availability') as string,
      color: selectedColor,
      active: formData.get('active') === 'on',
      hiringDate: formData.get('hiringDate') as string,
      salary: Number(formData.get('salary')),
      photoUrl: formData.get('photoUrl') as string || '',
    };

    if (editingStaff) {
      await update(editingStaff.id, staffData);
    } else {
      await add(staffData as any);
    }
    closeModal();
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Gestione Staff</h1>
            <p className="text-stone-500 font-medium">Gestisci i collaboratori, i ruoli e le disponibilità.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-6 py-4 md:py-3 rounded-2xl font-black md:font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Nuovo Collaboratore
          </button>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cerca per nome, email o ruolo..." 
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

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-stone-400">Caricamento...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400">Nessun collaboratore trovato.</div>
          ) : filteredStaff.map((staff) => (
            <div 
              key={staff.id} 
              className="bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 font-black text-2xl overflow-hidden border-2 border-white shadow-inner">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-10 h-10 text-stone-300" />
                        )}
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: staff.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 text-xl leading-tight">{staff.firstName} {staff.lastName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{staff.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingStaff(staff);
                        setIsModalOpen(true);
                      }}
                      className="p-2.5 bg-stone-50 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(staff.id)}
                      className="p-2.5 bg-stone-50 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-stone-600">
                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-stone-400" />
                    </div>
                    <span className="text-sm font-medium truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-600">
                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-stone-400" />
                    </div>
                    <span className="text-sm font-medium">{staff.phone}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {staff.active ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" />
                        Attivo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <XCircle className="w-3 h-3" />
                        Inattivo
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Dal</p>
                    <p className="text-xs font-bold text-stone-600">{format(new Date(staff.hiringDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex justify-center p-0 md:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-4xl md:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 h-full md:h-[90vh] md:max-h-[900px] md:my-auto border border-stone-100 flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-none sticky top-0 z-20 backdrop-blur-md">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                  {editingStaff ? 'Modifica Collaboratore' : 'Nuovo Collaboratore'}
                </h2>
                <p className="text-stone-500 font-medium mt-1 hidden md:block">Gym Master - Gestione Staff</p>
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
                      <input name="firstName" defaultValue={editingStaff?.firstName} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Marco" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Cognome</label>
                      <input name="lastName" defaultValue={editingStaff?.lastName} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Bianchi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Data di Nascita</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                        <input 
                          name="birthDate" 
                          type="date" 
                          defaultValue={editingStaff?.birthDate} 
                          className="w-full pl-12 pr-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" 
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
                            "flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 active:scale-95",
                            selectedGender === 'F' 
                              ? "bg-pink-50 border-pink-500 shadow-xl shadow-pink-500/10" 
                              : "bg-white border-stone-100 hover:border-stone-200"
                          )}
                        >
                          <motion.div
                            animate={{ scale: selectedGender === 'F' ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Venus className={cn("w-10 h-10 transition-colors duration-300", selectedGender === 'F' ? "text-pink-500" : "text-stone-300")} />
                          </motion.div>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedGender === 'F' ? "text-pink-600" : "text-stone-500")}>Donna</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedGender('M')}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 active:scale-95",
                            selectedGender === 'M' 
                              ? "bg-blue-50 border-blue-500 shadow-xl shadow-blue-500/10" 
                              : "bg-white border-stone-100 hover:border-stone-200"
                          )}
                        >
                          <motion.div
                            animate={{ scale: selectedGender === 'M' ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Mars className={cn("w-10 h-10 transition-colors duration-300", selectedGender === 'M' ? "text-blue-500" : "text-stone-300")} />
                          </motion.div>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedGender === 'M' ? "text-blue-600" : "text-stone-500")}>Uomo</span>
                        </button>
                      </div>
                      <input type="hidden" name="gender" value={selectedGender} />
                    </div>
                  </div>
                </div>

                {/* Sezione Lavoro */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Ruolo e Lavoro</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Ruolo</label>
                      <select name="role" defaultValue={editingStaff?.role} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base appearance-none">
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Specializzazione</label>
                      <input name="specialization" defaultValue={editingStaff?.specialization} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="Es. Yoga, Crossfit, Pilates" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Data Assunzione</label>
                      <input name="hiringDate" type="date" defaultValue={editingStaff?.hiringDate || new Date().toISOString().split('T')[0]} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Paga / Stipendio (€)</label>
                      <input name="salary" type="number" step="0.01" defaultValue={editingStaff?.salary} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                {/* Sezione Calendario e Colore */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Calendario</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block flex items-center gap-2">
                        <Palette className="w-3 h-3" />
                        Colore Identificativo
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {colors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "w-10 h-10 rounded-xl transition-all active:scale-90 border-4",
                              selectedColor === color ? "border-stone-900 scale-110 shadow-lg" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Disponibilità Oraria</label>
                      <textarea name="availability" defaultValue={editingStaff?.availability} rows={3} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base resize-none" placeholder="Es. Lun-Ven 09:00-18:00" />
                    </div>
                  </div>
                </div>

                {/* Sezione Contatti */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">Contatti</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Email</label>
                      <input name="email" type="email" defaultValue={editingStaff?.email} required className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="email@esempio.it" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1 block">Telefono</label>
                      <input name="phone" defaultValue={editingStaff?.phone} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-bold text-base" placeholder="+39..." />
                    </div>
                  </div>
                </div>

                {/* Stato Attivo */}
                <div className="pt-6 border-t border-stone-100">
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className="relative">
                      <input type="checkbox" name="active" defaultChecked={editingStaff ? editingStaff.active : true} className="sr-only peer" />
                      <div className="w-14 h-8 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-inner"></div>
                    </div>
                    <span className="text-sm font-black text-stone-600 uppercase tracking-widest group-hover:text-stone-900 transition-colors">Collaboratore Attivo</span>
                  </label>
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
                  {editingStaff ? 'Salva Modifiche' : 'Salva Collaboratore'}
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
        title="Elimina Collaboratore"
        message="Sei sicuro di voler eliminare questo collaboratore? I dati storici rimarranno ma non sarà più visibile nel team attivo."
        confirmText="Sì, Elimina"
        cancelText="No, Annulla"
      />
    </>
  );
}

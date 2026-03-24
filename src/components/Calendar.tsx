import React, { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Appointment, Client, Staff } from '../types';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Calendar() {
  const { data: appointments, add, remove, loading } = useFirestore<Appointment>('appointments');
  const { data: clients } = useFirestore<Client>('clients');
  const { data: staffMembers } = useFirestore<Staff>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffFilter, setStaffFilter] = useState<string>('all');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredAppointments = appointments.filter(app => {
    const dateMatch = isSameDay(new Date(app.dateTime), selectedDate);
    const staffMatch = staffFilter === 'all' || app.staffId === staffFilter;
    return dateMatch && staffMatch;
  }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const staffId = formData.get('staffId') as string;
    const duration = Number(formData.get('duration'));
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Conflict check
    const hasConflict = appointments.some(app => {
      if (app.staffId !== staffId) return false;
      
      const appStart = new Date(app.dateTime);
      const appEnd = new Date(appStart.getTime() + app.duration * 60000);
      
      return (startDateTime < appEnd && endDateTime > appStart);
    });

    if (hasConflict) {
      alert('Attenzione: Il collaboratore selezionato ha già un appuntamento in questo orario.');
      return;
    }
    
    await add({
      clientId: formData.get('clientId') as string,
      staffId: staffId,
      dateTime: startDateTime.toISOString(),
      duration: duration,
      service: formData.get('service') as string,
      notes: formData.get('notes') as string,
    } as any);
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Calendario</h1>
          <p className="text-stone-500">Gestisci le sessioni e gli appuntamenti della giornata.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Nuovo Appuntamento
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-stone-900 capitalize">{format(selectedDate, 'MMMM yyyy', { locale: it })}</h2>
              <div className="flex gap-1">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => (
                <span key={d} className="text-[10px] font-bold text-stone-400">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-10 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all",
                    isSameDay(day, selectedDate) 
                      ? "bg-emerald-500 text-stone-900 font-bold shadow-lg shadow-emerald-500/20" 
                      : "hover:bg-stone-50 text-stone-600"
                  )}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 p-6 rounded-3xl text-stone-100 shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Prossime Sessioni
            </h3>
            <div className="space-y-4">
              {appointments.slice(0, 3).map((app, i) => {
                const client = clients.find(c => c.id === app.clientId);
                return (
                  <div key={i} className="bg-stone-800 p-3 rounded-xl border border-stone-700">
                    <p className="text-xs font-bold text-emerald-500 mb-1">{app.service}</p>
                    <p className="text-sm font-medium">{client?.firstName} {client?.lastName}</p>
                    <p className="text-[10px] text-stone-500 mt-1">{format(new Date(app.dateTime), 'HH:mm')} - {app.duration} min</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule View */}
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 capitalize">{format(selectedDate, 'EEEE d MMMM', { locale: it })}</h2>
              <p className="text-sm text-stone-500">{filteredAppointments.length} appuntamenti programmati</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select 
                  value={staffFilter} 
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-stone-600 focus:ring-0 p-0"
                >
                  <option value="all">Tutto lo Staff</option>
                  {staffMembers.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex bg-stone-50 p-1 rounded-xl">
                <button className="px-4 py-1.5 text-xs font-bold bg-white text-stone-900 rounded-lg shadow-sm">Giorno</button>
                <button className="px-4 py-1.5 text-xs font-bold text-stone-400 hover:text-stone-600">Settimana</button>
              </div>
            </div>
          </div>

          <div className="space-y-4 relative">
            {/* Time markers */}
            <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-stone-50 hidden md:block">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => (
                <div key={h} className="h-20 text-[10px] font-bold text-stone-300 pt-1">{h}:00</div>
              ))}
            </div>

            <div className="md:ml-20 space-y-4">
              {loading ? (
                <div className="text-center py-12 text-stone-400">Caricamento...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-stone-50 rounded-3xl">
                  <CalendarIcon className="w-12 h-12 text-stone-100 mx-auto mb-4" />
                  <p className="text-stone-400 font-medium">Nessun appuntamento per oggi.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 text-emerald-500 font-bold text-sm hover:underline">Aggiungi ora</button>
                </div>
              ) : filteredAppointments.map((app) => {
                const client = clients.find(c => c.id === app.clientId);
                const staff = staffMembers.find(s => s.id === app.staffId);
                const accentColor = staff?.color || '#10b981';

                return (
                  <div key={app.id} className="flex gap-4 group">
                    <div className="w-16 pt-1 text-sm font-bold text-stone-400 md:hidden">
                      {format(new Date(app.dateTime), 'HH:mm')}
                    </div>
                    <div 
                      className="flex-1 bg-stone-50 p-5 rounded-2xl border-l-4 hover:bg-stone-100/50 transition-all flex items-center justify-between"
                      style={{ borderLeftColor: accentColor }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white items-center justify-center text-stone-400 shadow-sm">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>{app.service}</p>
                          <h4 className="font-bold text-stone-900">{client?.firstName} {client?.lastName}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {format(new Date(app.dateTime), 'HH:mm')} ({app.duration} min)
                            </span>
                            {staff && (
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: staff.color }} />
                                {staff.firstName} {staff.lastName}
                              </span>
                            )}
                            {app.notes && (
                              <span className="text-xs text-stone-400 italic truncate max-w-[200px]">"{app.notes}"</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => remove(app.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-stone-400 hover:text-stone-900 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between flex-none">
              <h2 className="text-xl font-bold text-stone-900">Nuovo Appuntamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
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
                  <label className="text-sm font-bold text-stone-700">Collaboratore Staff</label>
                  <select name="staffId" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                    <option value="">Seleziona un collaboratore</option>
                    {staffMembers.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Servizio</label>
                  <select name="service" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                    <option value="Personal Training">Personal Training</option>
                    <option value="Lezione Privata">Lezione Privata</option>
                    <option value="Consulenza Nutrizionale">Consulenza Nutrizionale</option>
                    <option value="Valutazione Fisica">Valutazione Fisica</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Data</label>
                    <input name="date" type="date" required defaultValue={format(selectedDate, 'yyyy-MM-dd')} className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Ora</label>
                    <input name="time" type="time" required defaultValue="10:00" className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Durata (minuti)</label>
                  <input name="duration" type="number" required defaultValue="60" className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Note</label>
                  <textarea name="notes" className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none h-24" />
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex gap-4 flex-none">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all">
                  Annulla
                </button>
                <button type="submit" className="flex-1 px-6 py-4 bg-emerald-500 text-stone-900 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

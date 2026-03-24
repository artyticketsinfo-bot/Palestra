import React from 'react';
import { useGym } from '../contexts/GymContext';
import { 
  X, 
  Dumbbell, 
  Users, 
  CreditCard, 
  FileText, 
  Calendar, 
  Settings, 
  HelpCircle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpGuide({ isOpen, onClose }: HelpGuideProps) {
  const { settings } = useGym();
  const sections = [
    {
      id: 'intro',
      title: 'Introduzione',
      icon: Dumbbell,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      content: `${settings.name} è un gestionale completo per la tua palestra. Ti permette di gestire clienti, abbonamenti, fatturazione e appuntamenti in un unico posto, semplificando il tuo lavoro quotidiano.`
    },
    {
      id: 'clients',
      title: 'Gestione Clienti',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      content: 'Crea nuovi clienti inserendo i loro dati anagrafici e fiscali. Ogni cliente riceve un codice unico per una facile identificazione. Puoi modificare o eliminare i profili in qualsiasi momento.'
    },
    {
      id: 'memberships',
      title: 'Abbonamenti',
      icon: CreditCard,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      content: 'Assegna abbonamenti ai tuoi clienti definendo durata e prezzo. Il sistema monitora automaticamente lo stato (Attivo, Scaduto, Annullato) e ti avvisa quando un abbonamento sta per scadere.'
    },
    {
      id: 'invoices',
      title: 'Fatturazione',
      icon: FileText,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      content: 'Genera fatture professionali. Usa la "Fattura Automatica" per caricare i dati di un cliente esistente e il suo abbonamento, oppure la "Fattura Manuale" per servizi extra o clienti occasionali.'
    },
    {
      id: 'calendar',
      title: 'Calendario',
      icon: Calendar,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      content: 'Organizza le sessioni di allenamento e gli appuntamenti. Visualizza la tua agenda giornaliera o settimanale e gestisci la disponibilità dei personal trainer.'
    },
    {
      id: 'settings',
      title: 'Impostazioni',
      icon: Settings,
      color: 'text-stone-500',
      bg: 'bg-stone-50',
      content: 'Personalizza il gestionale con il nome della tua palestra, i contatti e il logo. Per il logo, è consigliabile caricarne uno preferibilmente in bianco e nero per una migliore resa estetica. Ricorda che dopo aver cliccato su "Carica logo", per rendere effettive le modifiche è necessario cliccare sul pulsante "Salva modifiche" in fondo alla pagina.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md hidden md:block"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-screen md:min-h-0 md:max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-stone-900 shadow-lg shadow-emerald-500/20 shrink-0">
                  <HelpCircle className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-stone-900 tracking-tight leading-tight">Come funziona il sistema</h2>
                  <p className="hidden md:block text-stone-500 font-medium mt-1">Guida completa all'utilizzo di {settings.name}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-stone-200 rounded-2xl transition-all active:scale-90 bg-stone-100 text-stone-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {sections.map((section) => (
                  <div 
                    key={section.id}
                    className="group p-6 md:p-8 rounded-[2rem] border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${section.bg} ${section.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                        <section.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-black text-stone-900 tracking-tight">{section.title}</h3>
                        <p className="text-stone-600 leading-relaxed font-medium text-sm md:text-base">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips Section */}
              <div className="mt-8 md:mt-12 p-6 md:p-8 bg-stone-900 rounded-[2rem] md:rounded-[2.5rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Info className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-xl md:text-2xl font-black tracking-tight">Consigli Rapidi</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                      <p className="text-stone-400 text-sm font-medium">Usa la barra di ricerca in ogni sezione per trovare velocemente ciò che cerchi.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                      <p className="text-stone-400 text-sm font-medium">Controlla la Dashboard ogni mattina per vedere le scadenze del giorno.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                      <p className="text-stone-400 text-sm font-medium">Personalizza il colore del tema per rendere il gestionale unico per la tua palestra.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-stone-100 bg-stone-50/50 flex justify-center sticky bottom-0 z-10">
              <button 
                onClick={onClose}
                className="w-full md:w-auto px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-lg hover:bg-stone-800 transition-all active:scale-95"
              >
                Ho capito, grazie!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

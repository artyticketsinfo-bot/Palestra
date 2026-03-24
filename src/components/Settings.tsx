import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteField } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GymSettings } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useGym } from '../contexts/GymContext';
import { 
  Save, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Palette,
  CheckCircle2,
  HelpCircle,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import HelpGuide from './HelpGuide';

export default function Settings() {
  const { setThemeColor } = useTheme();
  const { settings: initialSettings, loading: gymLoading } = useGym();
  const [settings, setSettings] = useState<GymSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      alert('Il logo è troppo grande. Massimo 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: undefined }));
  };

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      // Ensure we are sending a clean object to Firestore
      const dataToSave: any = { ...settings };
      
      // If logoUrl is undefined, we want to make sure it's removed from Firestore
      if (dataToSave.logoUrl === undefined) {
        dataToSave.logoUrl = deleteField();
      }
      
      // Use setDoc with merge: true to update fields without destroying other potential settings
      // or setDoc without merge to replace. Given the context, setDoc with merge: true is safer
      // but the user wants to "remove" things, so we use deleteField() with merge: true.
      await setDoc(doc(db, 'settings', auth.currentUser.uid), dataToSave, { merge: true });
      
      setThemeColor(settings.themeColor);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Errore durante il salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  if (gymLoading) return <div className="text-center py-12 text-stone-400">Caricamento...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Impostazioni</h1>
          <p className="text-stone-500 font-medium">Configura i dettagli della tua palestra e l'aspetto dell'app.</p>
        </div>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="flex items-center justify-center gap-2 bg-stone-100 text-stone-600 px-6 py-4 md:py-3 rounded-2xl font-black md:font-bold hover:bg-stone-200 transition-all active:scale-95 w-full md:w-auto"
        >
          <HelpCircle className="w-5 h-5" />
          Come funziona il sistema
        </button>
      </header>

      <HelpGuide isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Logo Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-wider">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
            Logo Palestra
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nessun Logo</p>
                  </div>
                )}
              </div>
              {settings.logoUrl && (
                <button 
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900">Personalizza il tuo brand</p>
                <p className="text-xs text-stone-500">Il logo verrà visualizzato nella barra laterale e in tutti i documenti PDF (Fatture, Ricevute, Schede). È consigliabile utilizzare un logo preferibilmente in bianco e nero.</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 bg-emerald-500 text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20">
                  <Upload className="w-5 h-5" />
                  Carica Logo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoUpload}
                  />
                </label>
                <p className="text-[10px] text-stone-400 font-medium flex flex-col gap-1">
                  <span>PNG, JPG o JPEG. Max 1MB.</span>
                  <span className="text-emerald-600 font-bold uppercase tracking-tighter">Ricorda di cliccare "Salva modifiche" in basso per confermare.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Gym Info */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-wider">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Dati Palestra
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Nome Palestra</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  value={settings.name}
                  onChange={e => setSettings({...settings, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="Es. FitLife Studio"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Email di Contatto</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({...settings, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="info@palestra.it"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Telefono</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  value={settings.phone}
                  onChange={e => setSettings({...settings, phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="+39 012 3456789"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Sito Web</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  value={settings.website}
                  onChange={e => setSettings({...settings, website: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="www.palestra.it"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Partita IVA</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  value={settings.vat || ''}
                  onChange={e => setSettings({...settings, vat: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="IT01234567890"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-stone-500 ml-1">Indirizzo Completo</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  value={settings.address}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-stone-900 font-medium text-base" 
                  placeholder="Via Roma 123, 00100 Roma (RM)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-stone-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-wider">
            <Palette className="w-5 h-5 text-emerald-500" />
            Aspetto
          </h2>
          
          <div className="space-y-4">
            <label className="text-sm font-bold text-stone-500 ml-1">Colore Principale</label>
            <div className="flex flex-wrap gap-3 md:gap-4">
              {['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#1c1917'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSettings({...settings, themeColor: color})}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all active:scale-90",
                    settings.themeColor === color ? "border-stone-900 scale-110 shadow-xl" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-3 bg-stone-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 disabled:opacity-50 active:scale-95 w-full md:w-auto"
          >
            {saving ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            Salva Modifiche
          </button>
          
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 font-black text-lg animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="w-6 h-6" />
              Impostazioni salvate!
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

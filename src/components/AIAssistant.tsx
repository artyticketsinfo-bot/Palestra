import React, { useState, useRef, useEffect } from 'react';
import { useGym } from '../contexts/GymContext';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

export default function AIAssistant() {
  const { settings } = useGym();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: `Ciao! Sono l'assistente di ${settings.name}. Come posso aiutarti oggi?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `Sei un assistente esperto per il software gestionale della palestra "${settings.name}". 
            Il software gestisce:
            - Clienti (creazione, modifica, ricerca)
            - Abbonamenti (assegnazione, scadenze, stati: Attivo, Scaduto, Annullato)
            - Fatturazione (Automatica per clienti esistenti, Manuale per extra)
            - Calendario (appuntamenti, personal trainer)
            - Impostazioni (dati palestra, colori tema)
            
            Rispondi in modo breve, chiaro e professionale in italiano. Se l'utente chiede come fare qualcosa, fornisci una guida passo-passo.
            
            User query: ${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: `Sei l'assistente ufficiale di ${settings.name}. Aiuta gli utenti a navigare e usare il software.`
        }
      });

      const response = await model;
      const text = response.text || "Mi dispiace, non sono riuscito a elaborare la tua richiesta.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Ops! Qualcosa è andato storto. Riprova più tardi." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Come creo un cliente?",
    "Come funziona la fattura?",
    "Come aggiungo un abbonamento?",
    "Dove vedo i pagamenti?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-stone-900">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">Assistente {settings.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-stone-800 rounded-xl transition-colors">
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-stone-900 text-white' : 'bg-emerald-500 text-stone-900'
                    }`}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white rounded-tr-none' 
                        : 'bg-white text-stone-800 shadow-sm border border-stone-100 rounded-tl-none'
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-stone-900 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-stone-100">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-6 py-4 bg-white border-t border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3" /> Domande frequenti
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(s)}
                      className="px-3 py-1.5 bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-600 border border-stone-100 hover:border-emerald-200 rounded-lg text-xs font-bold transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-6 bg-white border-t border-stone-100">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Scrivi un messaggio..."
                  className="w-full pl-5 pr-14 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-3 bg-emerald-500 text-stone-900 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-30 active:scale-90"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-stone-50 animate-bounce" />
        )}
      </button>
    </div>
  );
}

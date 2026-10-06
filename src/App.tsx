import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

function App() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', formData);
    alert('Grazie per averci contattato! Ti risponderemo al più presto.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans text-slate-100">
      {/* Animated gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

        {/* Left Side: Slogans and Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-8 lg:pr-8"
        >
          <div className="mb-2">
            <a href="https://www.finsubito.org" target="_blank" rel="noopener noreferrer" className="inline-block group">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:scale-105 transition-transform duration-300">
                #finsubito
              </h1>
            </a>
            <p className="text-sm font-bold text-blue-300 mt-4 tracking-widest uppercase flex items-center gap-2">
              <span className="w-8 h-px bg-blue-300"></span>
              ADERISCI ORA
            </p>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            Il valore dei tuoi clienti merita di tornare a te. 🚀
          </h2>

          <p className="text-lg text-slate-300 leading-relaxed">
            Lascia i tuoi dati: un consulente dedicato ti contatterà per attivare l'accordo e mostrarti quanto può valere il tuo portafoglio clienti.
          </p>

          <div className="flex flex-col gap-6 text-slate-300 mt-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex items-start gap-4 hover:bg-slate-900/50 p-4 rounded-2xl transition-colors duration-300 border border-transparent hover:border-slate-800"
            >
              <div className="mt-1 bg-blue-500/20 p-2.5 rounded-xl">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">Zero Costi Anticipati 💸</h3>
                <p className="text-slate-400">Nessuna spesa nascosta, valuta la fattibilità gratuitamente senza alcun impegno.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-start gap-4 hover:bg-slate-900/50 p-4 rounded-2xl transition-colors duration-300 border border-transparent hover:border-slate-800"
            >
              <div className="mt-1 bg-green-500/20 p-2.5 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">Massima Sicurezza 🔒</h3>
                <p className="text-slate-400">I tuoi dati sono al sicuro e la nostra consulenza è altamente confidenziale.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex items-start gap-4 hover:bg-slate-900/50 p-4 rounded-2xl transition-colors duration-300 border border-transparent hover:border-slate-800"
            >
              <div className="mt-1 bg-purple-500/20 p-2.5 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">Veloce e Semplice ⚡</h3>
                <p className="text-slate-400">Compila il modulo in 1 minuto, al resto pensiamo noi. Il tuo tempo è prezioso!</p>
              </div>
            </motion.div>
          </div>

          <motion.div
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
             className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-800/50 p-6 rounded-2xl backdrop-blur-md shadow-xl mt-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <p className="text-slate-200">
              Hai bisogno di maggiori informazioni o assistenza rapida? <br/>
              Contattaci direttamente su <a href="http://info.finsubito.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-400">info.finsubito.org</a>
            </p>
          </motion.div>
        </motion.div>

        {/* Right Side: Form Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:pl-8"
        >
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-2">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  placeholder="Inserisci il tuo nome completo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  placeholder="La tua email principale"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  placeholder="Il tuo numero di cellulare"
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-[#1e66f5] hover:bg-[#1a5bde] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  RICHIEDI ORA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-500 mt-6 px-4 leading-relaxed">
                I tuoi dati saranno usati solo per ricontattarti in merito ai servizi #finsubito. Cliccando su "Richiedi Ora" accetti la nostra Privacy Policy.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Power, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause,
  Timer,
  Settings,
  X,
  Pencil,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { auth, db, signIn, logOut } from './firebase';
import { cn } from './lib/utils';
import { format, isSameMinute, addMinutes, isAfter, set, addDays, isSameDay } from 'date-fns';

interface ScheduledLink {
  id: string;
  url: string;
  openTime: string; // HH:mm
  endTime?: string; // HH:mm
  endDate?: string; // YYYY-MM-DD
  duration: number; // minutes
  repeatInterval: number; // minutes (0 for no repeat)
  isActive: boolean;
  userId: string;
  lastOpened?: Timestamp;
}

interface AuthorizedUser {
  id: string;
  email: string;
}

interface ActiveWindow {
  id: string;
  windowRef: Window;
  closeAt: Date;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<ScheduledLink[]>([]);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(() => {
    const saved = localStorage.getItem('isSchedulerRunning');
    return saved === 'true';
  });
  const [activeWindows, setActiveWindows] = useState<ActiveWindow[]>([]);

  useEffect(() => {
    localStorage.setItem('isSchedulerRunning', String(isSchedulerRunning));
  }, [isSchedulerRunning]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ScheduledLink | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [authorizedUsersList, setAuthorizedUsersList] = useState<AuthorizedUser[]>([]);
  const [newAuthorizedEmail, setNewAuthorizedEmail] = useState('');
  const [newLink, setNewLink] = useState({
    url: '',
    openTime: '09:00',
    endTime: '',
    endDate: '',
    duration: 1,
    repeatInterval: 0,
    isActive: true
  });

  const activeWindowsRef = useRef<ActiveWindow[]>([]);

  const getNextActivityTime = (link: ScheduledLink): Date | null => {
    if (!link.isActive) return null;

    const now = new Date();
    const [hours, minutes] = link.openTime.split(':').map(Number);
    const todayOpenTime = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });
    
    let todayEndTime = set(now, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
    if (link.endTime) {
      const [endHours, endMinutes] = link.endTime.split(':').map(Number);
      todayEndTime = set(now, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });
    }

    if (link.endDate) {
      const endD = new Date(link.endDate);
      const endOfDay = set(endD, { hours: 23, minutes: 59, seconds: 59 });
      if (now > endOfDay) return null; // Expired
    }

    const lastOpenedDate = link.lastOpened?.toDate();
    const isOpenedToday = lastOpenedDate && isSameDay(lastOpenedDate, now);

    if (isOpenedToday) {
      if (link.repeatInterval > 0) {
        const nextTime = addMinutes(lastOpenedDate, link.repeatInterval);
        if (nextTime <= todayEndTime) {
          return nextTime;
        }
      }
      // If no repeat or next time is after end time, next activity is tomorrow's open time
      const tomorrowOpenTime = addDays(todayOpenTime, 1);
      if (link.endDate && tomorrowOpenTime > set(new Date(link.endDate), { hours: 23, minutes: 59, seconds: 59 })) {
        return null;
      }
      return tomorrowOpenTime;
    }

    if (now < todayOpenTime) {
      return todayOpenTime;
    }

    if (now <= todayEndTime) {
      return now; // Should open right now
    }

    const tomorrowOpenTime = addDays(todayOpenTime, 1);
    if (link.endDate && tomorrowOpenTime > set(new Date(link.endDate), { hours: 23, minutes: 59, seconds: 59 })) {
      return null;
    }
    return tomorrowOpenTime;
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.email === 'marcello.ranalli@gmail.com') {
          setIsAuthorized(true);
        } else {
          try {
            const q = query(collection(db, 'authorized_users'), where('email', '==', u.email));
            const snapshot = await getDocs(q);
            setIsAuthorized(!snapshot.empty);
          } catch (error) {
            console.error('Error checking authorization:', error);
            setIsAuthorized(false);
          }
        }
      } else {
        setIsAuthorized(null);
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user) {
      setLinks([]);
      return;
    }

    const q = query(
      collection(db, 'scheduled_links'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledLink[];
      setLinks(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Admin Listener
  useEffect(() => {
    if (user && user.email === 'marcello.ranalli@gmail.com') {
      const q = query(collection(db, 'authorized_users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AuthorizedUser[];
        setAuthorizedUsersList(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Window Closer Engine (Always runs)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const remainingWindows: ActiveWindow[] = [];
      let changed = false;

      activeWindowsRef.current.forEach(aw => {
        if (aw.windowRef.closed) {
          // Finestra già chiusa manualmente dall'utente
          changed = true;
        } else if (now >= aw.closeAt) {
          // Tempo scaduto, chiudiamo la finestra
          try {
            aw.windowRef.close();
            changed = true;
          } catch (e) {
            console.error('Failed to close window:', e);
            remainingWindows.push(aw);
          }
        } else {
          // Finestra ancora attiva
          remainingWindows.push(aw);
        }
      });

      if (changed || remainingWindows.length !== activeWindowsRef.current.length) {
        activeWindowsRef.current = remainingWindows;
        setActiveWindows(remainingWindows);
      }
    }, 5000); // Controlla ogni 5 secondi

    return () => clearInterval(interval);
  }, []);

  // Scheduler Engine (Only runs when active)
  useEffect(() => {
    if (!isSchedulerRunning || !user) return;

    const interval = setInterval(() => {
      const now = new Date();

      // 1. Check for links to open
      links.forEach(async (link) => {
        if (!link.isActive) return;

        const now = new Date();
        
        // Check end date
        if (link.endDate) {
          const endD = new Date(link.endDate);
          const endOfDay = set(endD, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
          if (now > endOfDay) {
            // Auto-disable expired links
            toggleLinkStatus(link.id, true);
            return;
          }
        }

        const [hours, minutes] = link.openTime.split(':').map(Number);
        const todayOpenTime = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });
        
        let todayEndTime = set(now, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        if (link.endTime) {
          const [endHours, endMinutes] = link.endTime.split(':').map(Number);
          todayEndTime = set(now, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });
        }

        const lastOpenedDate = link.lastOpened?.toDate();
        const isOpenedToday = lastOpenedDate && isSameDay(lastOpenedDate, now);

        let shouldOpen = false;

        // Only operate within the daily window
        if (now >= todayOpenTime && now <= todayEndTime) {
          if (!isOpenedToday) {
            // First time today
            shouldOpen = true;
          } else if (link.repeatInterval > 0) {
            // Already opened today, check repeat interval
            const nextOpenTime = addMinutes(lastOpenedDate, link.repeatInterval);
            if (now >= nextOpenTime) {
              shouldOpen = true;
            }
          }
        }

        if (shouldOpen) {
          // Open the link
          const win = window.open(link.url, '_blank');
          if (win) {
            const closeAt = addMinutes(now, link.duration);
            const newActiveWindow = { id: link.id, windowRef: win, closeAt };
            
            activeWindowsRef.current = [...activeWindowsRef.current, newActiveWindow];
            setActiveWindows([...activeWindowsRef.current]);

            // Update lastOpened in Firestore
            try {
              await updateDoc(doc(db, 'scheduled_links', link.id), {
                lastOpened: serverTimestamp()
              });
            } catch (err) {
              console.error('Failed to update lastOpened:', err);
            }
          } else {
            console.warn('Popup blocked for:', link.url);
          }
        }
      });

    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isSchedulerRunning, links, user]);

  const handleRunNow = async (link: ScheduledLink) => {
    const now = new Date();
    const win = window.open(link.url, '_blank');
    
    if (win) {
      const closeAt = addMinutes(now, link.duration);
      const newActiveWindow = { id: link.id, windowRef: win, closeAt };
      
      activeWindowsRef.current = [...activeWindowsRef.current, newActiveWindow];
      setActiveWindows([...activeWindowsRef.current]);

      try {
        await updateDoc(doc(db, 'scheduled_links', link.id), {
          lastOpened: serverTimestamp()
        });
      } catch (err) {
        console.error('Failed to update lastOpened:', err);
      }
    } else {
      alert('Popup bloccato! Consenti i popup per questo sito per avviare il link.');
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingLink) {
        // Update existing link
        await updateDoc(doc(db, 'scheduled_links', editingLink.id), {
          url: newLink.url,
          openTime: newLink.openTime,
          endTime: newLink.endTime,
          endDate: newLink.endDate,
          duration: newLink.duration,
          repeatInterval: newLink.repeatInterval,
          isActive: newLink.isActive
        });
      } else {
        // Add new link
        await addDoc(collection(db, 'scheduled_links'), {
          ...newLink,
          userId: user.uid,
          lastOpened: null
        });
      }
      closeModal();
    } catch (err) {
      console.error('Error saving link:', err);
    }
  };

  const openEditModal = (link: ScheduledLink) => {
    setEditingLink(link);
    setNewLink({
      url: link.url || '',
      openTime: link.openTime || '09:00',
      endTime: link.endTime || '',
      endDate: link.endDate || '',
      duration: link.duration ?? 1,
      repeatInterval: link.repeatInterval ?? 0,
      isActive: link.isActive ?? true
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingLink(null);
    setNewLink({ url: '', openTime: '09:00', endTime: '', endDate: '', duration: 1, repeatInterval: 0, isActive: true });
  };

  const toggleLinkStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'scheduled_links', id), {
        isActive: !currentStatus
      });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const deleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scheduled_links', id));
      setLinkToDelete(null);
    } catch (err) {
      console.error('Error deleting link:', err);
    }
  };

  const handleAddAuthorizedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorizedEmail.trim()) return;
    try {
      await addDoc(collection(db, 'authorized_users'), {
        email: newAuthorizedEmail.trim().toLowerCase()
      });
      setNewAuthorizedEmail('');
    } catch (err) {
      console.error('Error adding authorized user:', err);
    }
  };

  const handleRemoveAuthorizedUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authorized_users', id));
    } catch (err) {
      console.error('Error removing authorized user:', err);
    }
  };

  if (loading || (user && isAuthorized === null)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (user && isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-xl text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-100">
            Accesso Non Autorizzato
          </h1>
          <p className="text-slate-400 mb-8">
            Il tuo account ({user.email}) non è autorizzato ad utilizzare questa applicazione. Richiedi l'accesso all'amministratore.
          </p>
          <div className="flex flex-col gap-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe-gwBjKwn1WnYYVJmeo7vbgMl_oFudL6euRjbWgO3-KUupTw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Richiedi utilizzo dell'app
            </a>
            <button
              onClick={logOut}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 border border-slate-700"
            >
              <LogOut className="w-5 h-5" />
              Disconnetti
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-xl text-center"
        >
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Link Automator
          </h1>
          <p className="text-slate-400 mb-8">
            Accedi per gestire le tue programmazioni automatiche di apertura link.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={signIn}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <LogIn className="w-5 h-5" />
              Accedi con Google
            </button>
            
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe-gwBjKwn1WnYYVJmeo7vbgMl_oFudL6euRjbWgO3-KUupTw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 border border-slate-700"
            >
              Richiedi utilizzo dell'app
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block">Link Automator</span>
          </div>

          <div className="flex items-center gap-4">
            {user.email === 'marcello.ranalli@gmail.com' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-500/30"
                title="Pannello Admin"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:block">Gestione Utenti</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
              <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              <span className="text-sm font-medium hidden md:block">{user.displayName}</span>
            </div>
            <button
              onClick={logOut}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Scheduler Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            whileHover={{ y: -4 }}
            className={cn(
              "col-span-1 md:col-span-2 p-6 rounded-2xl border transition-all duration-500",
              isSchedulerRunning 
                ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
                : "bg-slate-900/50 border-slate-800"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Stato Automazione</h2>
                <p className="text-sm text-slate-400">
                  {isSchedulerRunning 
                    ? "L'automazione è attiva. I link verranno aperti agli orari stabiliti." 
                    : "L'automazione è in pausa. Clicca 'Avvia' per iniziare a monitorare i link."}
                </p>
              </div>
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isSchedulerRunning ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]" : "bg-slate-600"
              )} />
            </div>
            
            <button
              onClick={() => setIsSchedulerRunning(!isSchedulerRunning)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all active:scale-95",
                isSchedulerRunning 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              )}
            >
              {isSchedulerRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Sospendi Monitoraggio
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Avvia Monitoraggio
                </>
              )}
            </button>
            {!isSchedulerRunning && (
              <p className="text-[10px] text-center mt-2 text-slate-500 uppercase tracking-widest font-bold">
                Necessario per consentire l'apertura dei popup
              </p>
            )}
          </motion.div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-indigo-400" />
              Finestre Attive
            </h2>
            <div className="space-y-3">
              {activeWindows.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nessuna finestra aperta al momento.</p>
              ) : (
                activeWindows.map(aw => (
                  <div key={aw.id} className="flex items-center justify-between text-sm bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    <span className="truncate max-w-[120px] text-slate-300">
                      {links.find(l => l.id === aw.id)?.url.replace('https://', '')}
                    </span>
                    <span className="text-indigo-400 font-mono text-xs">
                      Chiude: {format(aw.closeAt, 'HH:mm:ss')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Links List Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Programmazioni</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuovo Link
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {links.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500">Non hai ancora aggiunto alcun link programmato.</p>
              </motion.div>
            ) : (
              links.map((link) => (
                <motion.div
                  layout
                  key={link.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group relative bg-slate-900 border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700",
                    !link.isActive && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      link.isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
                    )}>
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-[300px]">
                        {link.url}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {link.openTime}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Timer className="w-3 h-3" />
                          {link.duration} min
                        </span>
                        {link.repeatInterval > 0 && (
                          <span className="flex items-center gap-1 text-xs text-indigo-400">
                            <Settings className="w-3 h-3" />
                            Ogni {link.repeatInterval} min
                          </span>
                        )}
                        {link.endTime && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            Fino alle {link.endTime}
                          </span>
                        )}
                        {link.endDate && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            Scade il {format(new Date(link.endDate), 'dd/MM/yyyy')}
                          </span>
                        )}
                        {link.lastOpened && (
                          <span className="text-[10px] text-slate-500 font-medium uppercase">
                            Ultima: {format(link.lastOpened.toDate(), 'dd/MM HH:mm')}
                          </span>
                        )}
                        {link.isActive && (
                          <span className="text-[10px] text-indigo-400 font-bold uppercase">
                            Prossima: {getNextActivityTime(link) ? format(getNextActivityTime(link)!, 'dd/MM HH:mm') : '--:--'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                    <button
                      onClick={() => handleRunNow(link)}
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-transparent hover:border-green-400/20"
                      title="Avvia subito"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleLinkStatus(link.id, link.isActive)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        link.isActive 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20" 
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      )}
                      title={link.isActive ? "Disattiva programmazione" : "Attiva programmazione"}
                    >
                      <Power className="w-4 h-4" />
                      {link.isActive ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => openEditModal(link)}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all border border-transparent hover:border-indigo-400/20"
                      title="Modifica"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setLinkToDelete(link.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Utenti Autorizzati
                </h2>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAuthorizedUser} className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={newAuthorizedEmail}
                  onChange={(e) => setNewAuthorizedEmail(e.target.value)}
                  placeholder="Email utente..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Aggiungi
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {authorizedUsersList.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">Nessun utente autorizzato.</p>
                ) : (
                  authorizedUsersList.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                      <span className="text-sm text-slate-300">{u.email}</span>
                      <button
                        onClick={() => handleRemoveAuthorizedUser(u.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Rimuovi accesso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">
                  {editingLink ? 'Modifica Programmazione' : 'Nuova Programmazione'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">URL del sito</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      required
                      type="url"
                      placeholder="https://example.com"
                      value={newLink.url || ''}
                      onChange={e => setNewLink({...newLink, url: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Orario Apertura</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        required
                        type="time"
                        value={newLink.openTime || '09:00'}
                        onChange={e => setNewLink({...newLink, openTime: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Orario Fine (Opzionale)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="time"
                        value={newLink.endTime || ''}
                        onChange={e => setNewLink({...newLink, endTime: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Data Scadenza (Opzionale)</label>
                  <input
                    type="date"
                    value={newLink.endDate || ''}
                    onChange={e => setNewLink({...newLink, endDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200"
                  />
                  <p className="text-xs text-slate-500 mt-2">Se impostata, l'automazione per questo link verrà disattivata dopo questa data.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Durata Apertura (min)</label>
                    <div className="relative">
                      <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        required
                        type="number"
                        min="1"
                        max="1440"
                        value={newLink.duration ?? 1}
                        onChange={e => setNewLink({...newLink, duration: parseInt(e.target.value) || 1})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Tempo dopo il quale la scheda verrà chiusa automaticamente.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Ripeti ogni (minuti)</label>
                  <div className="relative">
                    <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="1440"
                      placeholder="0 per non ripetere"
                      value={newLink.repeatInterval ?? 0}
                      onChange={e => setNewLink({...newLink, repeatInterval: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Inserisci 0 se vuoi che il link si apra solo una volta al giorno all'orario stabilito.</p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Salva Programmazione
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {linkToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLinkToDelete(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Conferma Eliminazione</h2>
              <p className="text-slate-400 mb-8">Sei sicuro di voler eliminare questa programmazione? L'azione non è reversibile.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLinkToDelete(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={() => deleteLink(linkToDelete)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  Elimina
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Info */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-900 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Note Importanti
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Mantieni questa scheda aperta per far funzionare l'automazione.</li>
              <li>• Assicurati di aver consentito i popup per questo sito.</li>
              <li>• Se ricarichi la pagina, le finestre già aperte non verranno chiuse automaticamente.</li>
              <li>• **Ripetizione:** Se impostata, il link si aprirà ogni X minuti dopo la prima apertura giornaliera.</li>
            </ul>
          </div>
          <div className="flex flex-col justify-end items-end">
            <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">
              Securely powered by Firebase
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

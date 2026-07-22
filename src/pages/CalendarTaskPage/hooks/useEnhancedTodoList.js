// src/pages/CalendarTaskPage/hooks/useEnhancedTodoList.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGoogleCalendarApi } from '../../CalendarPage/hooks/useGoogleCalendarApi';
import { usePratiche } from '../../../contexts/PraticheContext';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getTaskState,
  setTaskState,
  syncPendingChanges,
  syncAllFromFirebase,
  setupAutoSync,
  getPendingCount,
  migrateFromOldService,
  subscribeTaskStates
} from '../../../services/taskStateFirebaseService';
import { startOfDay, addDays, startOfWeek, endOfWeek, parseISO, isValid, format, isPast, isToday } from 'date-fns';
import { calendarIds } from '../../CalendarPage/utils/calendarUtils';

// Le task "Da fare" vivono esclusivamente sul calendario De Antoni.
const TASK_CALENDAR_ID = calendarIds.ID_DE_ANTONI;

export const useEnhancedTodoList = () => {
  const { user } = useAuth();
  const {
    googleApiToken,
    gapiClientInitialized,
    calendarEvents,
    fetchGoogleEvents,
    isLoadingEvents: isLoadingCalendarEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
  } = useGoogleCalendarApi();
  const { pratiche: praticheStandard, loading: loadingPraticheStd } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePriv } = usePratichePrivato();

  const [allTodoItems, setAllTodoItems] = useState([]);
  const [isLoadingHook, setIsLoadingHook] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Filtri (default 'tutte': la lista raggruppa da sé per scadenza)
  const [activeFilter, setActiveFilter] = useState('tutte');
  const [dateFilter, setDateFilter] = useState('all');
  const [agenziaFilter, setAgenziaFilter] = useState('tutte');
  const [praticaFilter, setPraticaFilter] = useState('tutte');

  // Unisci tutte le pratiche
  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStd || loadingPratichePriv) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStd, loadingPratichePriv]);

  // Estrai agenzie disponibili
  const availableAgenzie = useMemo(() => {
    const agenzie = new Set();
    tutteLePratiche.forEach(p => {
      if (p.agenzia && p.agenzia !== 'PRIVATO') {
        agenzie.add(p.agenzia);
      }
    });
    return Array.from(agenzie).sort();
  }, [tutteLePratiche]);

  // Pratiche disponibili per filtro (solo in corso)
  const availablePratiche = useMemo(() => {
    return tutteLePratiche
      .filter(p => p.stato !== 'Completata')
      .map(p => ({
        id: p.id,
        indirizzo: p.indirizzo || 'N/D',
        cliente: p.cliente || 'N/D',
        agenzia: p.agenzia
      }))
      .sort((a, b) => a.indirizzo.localeCompare(b.indirizzo));
  }, [tutteLePratiche]);

  // Setup auto-sync (non richiede più user, usa UID hardcoded)
  useEffect(() => {
    // Migra dati vecchi al primo caricamento
    migrateFromOldService();

    // Sincronizza con Firebase
    syncAllFromFirebase().catch(err => {
      console.warn('Sync iniziale fallita, uso cache locale:', err);
    });

    // Setup auto-sync su ritorno online
    const cleanup = setupAutoSync();

    // Sincronizza modifiche in sospeso periodicamente (ogni 5 minuti)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingChanges().then(() => {
          setPendingSyncCount(getPendingCount());
        });
      }
    }, 5 * 60 * 1000);

    // Update pending count iniziale
    setPendingSyncCount(getPendingCount());

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  // Live sync: aggiorna lo stato "completata" in tempo reale quando cambia il doc
  // condiviso taskStates (es. spunta fatta dalla pagina Pratiche).
  useEffect(() => {
    const unsubscribe = subscribeTaskStates((tasksMap) => {
      setAllTodoItems((prev) =>
        prev.map((it) => {
          const remote = tasksMap[it.gCalEventId];
          const remoteCompleted = remote ? !!remote.isCompleted : false;
          return it.isCompleted === remoteCompleted ? it : { ...it, isCompleted: remoteCompleted };
        })
      );
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Carica e trasforma eventi del calendario in task
  useEffect(() => {
    console.log('🔍 Check condizioni caricamento task:', {
      isLoadingCalendarEvents,
      gapiClientInitialized,
      hasGoogleToken: !!googleApiToken,
      hasUserId: !!user?.uid,
      calendarEventsCount: calendarEvents.length
    });

    // MODIFICATO: funziona anche senza user (usa solo localStorage in quel caso)
    if (!isLoadingCalendarEvents && gapiClientInitialized && googleApiToken) {
      setIsLoadingHook(true);

      const loadTaskStates = async () => {
        try {
          console.log('📋 Caricamento task da calendario De Antoni...');

          const transformedItems = await Promise.all(
            calendarEvents
              .filter(event => event.sourceCalendarId === TASK_CALENDAR_ID) // SOLO calendario De Antoni
              .map(async (event) => {
                // Trova pratica correlata (mapEvent espone relatedPraticaId appiattito)
                let praticaInfo = null;
                const relatedPraticaId = event.relatedPraticaId;
                if (relatedPraticaId) {
                  const praticaTrovata = tutteLePratiche.find(p => p.id === relatedPraticaId);
                  if (praticaTrovata) {
                    praticaInfo = {
                      id: praticaTrovata.id,
                      codice: praticaTrovata.codice,
                      indirizzo: praticaTrovata.indirizzo,
                      cliente: praticaTrovata.cliente,
                      agenzia: praticaTrovata.agenzia,
                    };
                  }
                }

                // Task esplicitamente "senza scadenza": ignora la data placeholder
                const isNoDueDate = event.noDueDate === true;

                // Parse date
                let validDueDate, validEndDate;
                if (event.start?.dateTime) validDueDate = parseISO(event.start.dateTime);
                else if (event.start?.date) validDueDate = parseISO(event.start.date);
                else if (event.start instanceof Date) validDueDate = event.start;
                else validDueDate = new Date();

                if (event.end?.dateTime) validEndDate = parseISO(event.end.dateTime);
                else if (event.end?.date) validEndDate = parseISO(event.end.date);
                else if (event.end instanceof Date) validEndDate = event.end;

                // Carica stato da Firebase (con fallback localStorage)
                // Usa UID hardcoded internamente nel servizio
                let taskState = { isCompleted: false };
                try {
                  taskState = await getTaskState(event.id);
                } catch (error) {
                  console.warn(`Errore caricamento stato task ${event.id}, uso default:`, error.message);
                  // Fallback: usa stato di default
                  taskState = { isCompleted: false };
                }

                return {
                  gCalEventId: event.id,
                  gCalCalendarId: event.sourceCalendarId,
                  title: event.summary || event.title || '(Nessun titolo)',
                  dueDate: isNoDueDate ? null : (isValid(validDueDate) ? validDueDate : new Date()),
                  endDate: isValid(validEndDate) ? validEndDate : undefined,
                  isCompleted: taskState.isCompleted || false,
                  priority: event.priority || 'normale',
                  relatedPraticaId: event.relatedPraticaId || '',
                  praticaInfo,
                  originalGCalEventData: event,
                };
              })
          );

          console.log(`✓ Caricate ${transformedItems.length} task dal calendario De Antoni`);
          setAllTodoItems(transformedItems);

        } catch (error) {
          console.error('Errore nel caricamento task:', error);
          // In caso di errore, mostra almeno i calendari senza stati
          const fallbackItems = calendarEvents
            .filter(event => event.sourceCalendarId === TASK_CALENDAR_ID)
            .map((event) => ({
              gCalEventId: event.id,
              gCalCalendarId: event.sourceCalendarId,
              title: event.summary || event.title || '(Nessun titolo)',
              dueDate: event.noDueDate === true ? null : new Date(),
              isCompleted: false,
              priority: event.priority || 'normale',
              relatedPraticaId: event.relatedPraticaId || '',
              praticaInfo: null,
              originalGCalEventData: event,
            }));
          setAllTodoItems(fallbackItems);

        } finally {
          // IMPORTANTE: imposta sempre loading a false, anche in caso di errore
          setIsLoadingHook(false);
        }
      };

      loadTaskStates();

    } else if (!googleApiToken && gapiClientInitialized) {
      console.log('⚠️ Nessun token Google disponibile, lista vuota');
      setAllTodoItems([]);
      setIsLoadingHook(false);
    } else {
      console.log('⏳ In attesa delle condizioni per caricare le task...');
      // Se stiamo ancora caricando i calendari, mantieni loading
      // Altrimenti imposta loading a false
      if (!isLoadingCalendarEvents) {
        setIsLoadingHook(false);
      }
    }
  }, [calendarEvents, googleApiToken, gapiClientInitialized, isLoadingCalendarEvents, tutteLePratiche, user?.uid]);

  // Toggle completamento task con Firebase
  const toggleComplete = useCallback(async (gCalEventId) => {
    // Update ottimistico locale
    setAllTodoItems(prevItems =>
      prevItems.map(item =>
        item.gCalEventId === gCalEventId ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );

    // Salva su Firebase (con fallback localStorage)
    // Usa UID hardcoded internamente nel servizio
    const currentItem = allTodoItems.find(i => i.gCalEventId === gCalEventId);
    const newState = !currentItem?.isCompleted;

    try {
      const result = await setTaskState(gCalEventId, newState);

      if (result.queued) {
        // Salvato in coda, aggiorna contatore
        setPendingSyncCount(getPendingCount());
      }
    } catch (error) {
      console.error('Errore nel toggle task:', error);
      // L'update ottimistico è già fatto, quindi l'UI funziona comunque
    }
  }, [allTodoItems]);

  // Applica filtri
  const filteredAndSortedItems = useMemo(() => {
    let items = [...allTodoItems];

    // Filtro Stato
    if (activeFilter === 'inCorso') {
      items = items.filter(item => !item.isCompleted);
    } else if (activeFilter === 'completate') {
      items = items.filter(item => item.isCompleted);
    } else if (activeFilter === 'overdue') {
      items = items.filter(item => {
        const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
        return validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;
      });
    }
    // 'tutte' non filtra nulla

    // Filtro Data
    const today = startOfDay(new Date());
    if (dateFilter === 'today') {
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = startOfDay(addDays(today, 1));
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd'));
    } else if (dateFilter === 'week') {
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
      const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
      items = items.filter(item =>
        isValid(item.dueDate) &&
        item.dueDate >= startOfThisWeek &&
        item.dueDate <= endOfThisWeek
      );
    }

    // Filtro Agenzia
    if (agenziaFilter !== 'tutte') {
      items = items.filter(item => item.praticaInfo?.agenzia === agenziaFilter);
    }

    // Filtro Pratica
    if (praticaFilter !== 'tutte') {
      items = items.filter(item => item.praticaInfo?.id === praticaFilter);
    }

    // Ordinamento: scadenza più vicina prima; task senza scadenza in fondo
    items.sort((a, b) => {
      const aValid = a.dueDate && isValid(a.dueDate);
      const bValid = b.dueDate && isValid(b.dueDate);
      if (aValid && bValid) return a.dueDate.getTime() - b.dueDate.getTime();
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    });

    return items;
  }, [allTodoItems, activeFilter, dateFilter, agenziaFilter, praticaFilter]);

  // Refresh eventi + sincronizzazione
  const refreshCalendarEvents = useCallback(async () => {
    if (googleApiToken && gapiClientInitialized) {
      fetchGoogleEvents();

      // Sincronizza modifiche in sospeso
      if (user?.uid) {
        await syncPendingChanges(user.uid);
        setPendingSyncCount(getPendingCount());
      }
    }
  }, [googleApiToken, gapiClientInitialized, fetchGoogleEvents, user?.uid]);

  // Helper ottimistici: aggiornano subito la lista locale (feedback immediato),
  // in attesa che il fetch dal calendario riconcili lo stato reale.
  const updateLocalItem = useCallback((eventId, patch) => {
    setAllTodoItems((prev) => prev.map((it) => (it.gCalEventId === eventId ? { ...it, ...patch } : it)));
  }, []);

  const removeLocalItem = useCallback((eventId) => {
    setAllTodoItems((prev) => prev.filter((it) => it.gCalEventId !== eventId));
  }, []);

  return {
    todoItems: filteredAndSortedItems,
    isLoading: isLoadingHook || isLoadingCalendarEvents || loadingPraticheStd || loadingPratichePriv,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    agenziaFilter,
    setAgenziaFilter,
    praticaFilter,
    setPraticaFilter,
    refreshCalendarEvents,
    availableAgenzie,
    availablePratiche,
    pendingSyncCount,
    // CRUD calendario (stessa istanza della lista → un solo fetch)
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    // Helper ottimistici
    updateLocalItem,
    removeLocalItem,
  };
};

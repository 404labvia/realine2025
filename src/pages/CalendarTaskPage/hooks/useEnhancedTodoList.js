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
  migrateFromOldService
} from '../../../services/taskStateFirebaseService';
import { startOfDay, addDays, startOfWeek, endOfWeek, parseISO, isValid, format, isPast, isToday } from 'date-fns';

export const useEnhancedTodoList = () => {
  const { user } = useAuth();
  const { googleApiToken, gapiClientInitialized, calendarEvents, fetchGoogleEvents, isLoadingEvents: isLoadingCalendarEvents } = useGoogleCalendarApi();
  const { pratiche: praticheStandard, loading: loadingPraticheStd } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePriv } = usePratichePrivato();

  const [allTodoItems, setAllTodoItems] = useState([]);
  const [isLoadingHook, setIsLoadingHook] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Filtri
  const [activeFilter, setActiveFilter] = useState('inCorso');
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

  // Setup auto-sync quando user è autenticato
  useEffect(() => {
    if (!user?.uid) return;

    // Migra dati vecchi al primo caricamento
    migrateFromOldService(user.uid);

    // Sincronizza con Firebase
    syncAllFromFirebase(user.uid).catch(err => {
      console.warn('Sync iniziale fallita, uso cache locale:', err);
    });

    // Setup auto-sync su ritorno online
    const cleanup = setupAutoSync(user.uid);

    // Sincronizza modifiche in sospeso periodicamente (ogni 5 minuti)
    const interval = setInterval(() => {
      if (navigator.onLine && user?.uid) {
        syncPendingChanges(user.uid).then(() => {
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
  }, [user?.uid]);

  // Carica e trasforma eventi del calendario in task
  useEffect(() => {
    console.log('🔍 Check condizioni caricamento task:', {
      isLoadingCalendarEvents,
      gapiClientInitialized,
      hasGoogleToken: !!googleApiToken,
      hasUserId: !!user?.uid,
      calendarEventsCount: calendarEvents.length
    });

    if (!isLoadingCalendarEvents && gapiClientInitialized && googleApiToken && user?.uid) {
      setIsLoadingHook(true);

      const loadTaskStates = async () => {
        try {
          console.log('📋 Caricamento task da calendario primary...');

          const transformedItems = await Promise.all(
            calendarEvents
              .filter(event => event.sourceCalendarId === 'primary') // SOLO primary calendar
              .map(async (event) => {
                // Trova pratica correlata
                let praticaInfo = null;
                const relatedPraticaId = event.extendedProperties?.private?.relatedPraticaId;
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
                let taskState = { isCompleted: false };
                try {
                  taskState = await getTaskState(user.uid, event.id);
                } catch (error) {
                  console.warn(`Errore caricamento stato task ${event.id}, uso default:`, error.message);
                  // Fallback: usa solo localStorage
                  taskState = { isCompleted: false };
                }

                return {
                  gCalEventId: event.id,
                  gCalCalendarId: event.sourceCalendarId,
                  title: event.summary || event.title || '(Nessun titolo)',
                  dueDate: isValid(validDueDate) ? validDueDate : new Date(),
                  endDate: isValid(validEndDate) ? validEndDate : undefined,
                  isCompleted: taskState.isCompleted || false,
                  praticaInfo,
                  originalGCalEventData: event,
                };
              })
          );

          console.log(`✓ Caricate ${transformedItems.length} task da primary calendar`);
          setAllTodoItems(transformedItems);

        } catch (error) {
          console.error('Errore nel caricamento task:', error);
          // In caso di errore, mostra almeno i calendari senza stati
          const fallbackItems = calendarEvents
            .filter(event => event.sourceCalendarId === 'primary')
            .map((event) => ({
              gCalEventId: event.id,
              gCalCalendarId: event.sourceCalendarId,
              title: event.summary || event.title || '(Nessun titolo)',
              dueDate: new Date(),
              isCompleted: false,
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
    if (!user?.uid) {
      console.warn('User non autenticato');
      return;
    }

    // Update ottimistico locale
    setAllTodoItems(prevItems =>
      prevItems.map(item =>
        item.gCalEventId === gCalEventId ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );

    // Salva su Firebase (con fallback localStorage)
    const currentItem = allTodoItems.find(i => i.gCalEventId === gCalEventId);
    const newState = !currentItem?.isCompleted;

    const result = await setTaskState(user.uid, gCalEventId, newState);

    if (result.queued) {
      // Salvato in coda, aggiorna contatore
      setPendingSyncCount(getPendingCount());
    }
  }, [user?.uid, allTodoItems]);

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

    // Ordinamento: scadenza più vicina prima
    items.sort((a, b) => {
      if (isValid(a.dueDate) && isValid(b.dueDate)) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
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
  };
};

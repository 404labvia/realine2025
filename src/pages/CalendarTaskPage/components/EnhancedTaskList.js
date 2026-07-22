// src/pages/CalendarTaskPage/components/EnhancedTaskList.js
// Tabella "Da fare" (stile ClickUp/Monday List): righe raggruppate in "In ritardo" e
// "In corso", colonne Attività · Pratica · Scadenza · Priorità (pill editabile). Le task =
// eventi Google Calendar del calendario De Antoni (vedi useEnhancedTodoList). Completamento
// su Firebase; le task completate vengono nascoste (restano come storico sul calendario).
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  format,
  isValid,
  isToday,
  isYesterday,
  isTomorrow,
  startOfDay,
  differenceInCalendarDays,
} from 'date-fns';
import { it } from 'date-fns/locale';
import {
  FaSync,
  FaPlus,
  FaExclamationTriangle,
  FaRegClock,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { MdCheckCircleOutline, MdEdit } from 'react-icons/md';

// Rimuove il suffisso "(Pratica: ...)" che il salvataggio aggiunge al titolo dell'evento.
const cleanTitle = (t) =>
  t && t.includes('(Pratica:') ? t.substring(0, t.indexOf('(Pratica:')).trim() : t || '(Senza titolo)';

// Etichetta scadenza leggibile.
const formatDue = (date) => {
  if (!date || !isValid(date)) return null;
  const time = format(date, 'HH:mm');
  if (isToday(date)) return `Oggi ${time}`;
  if (isYesterday(date)) return `Ieri ${time}`;
  if (isTomorrow(date)) return `Domani ${time}`;
  return format(date, 'EEE d MMM, HH:mm', { locale: it });
};

// Metadati priorità.
const PRIORITIES = [
  { value: 'alta', label: 'Alta' },
  { value: 'normale', label: 'Normale' },
  { value: 'bassa', label: 'Bassa' },
];
const priorityStyle = (p) => {
  if (p === 'alta') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (p === 'bassa') return 'bg-gray-100 text-gray-600 dark:bg-dark-hover dark:text-dark-text-secondary';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'; // normale
};
const priorityLabel = (p) => PRIORITIES.find((x) => x.value === p)?.label || 'Normale';

// Solo due gruppi: in ritardo e in corso. Le completate non compaiono.
const GROUP_ORDER = [
  { key: 'overdue', label: 'In ritardo', tone: 'danger' },
  { key: 'inCorso', label: 'In corso', tone: 'accent' },
];

// Template di colonne condiviso da header e righe (Attività · Pratica · Scadenza · Priorità).
const GRID_COLS =
  'grid grid-cols-[24px_minmax(0,1fr)_104px_96px_40px] md:grid-cols-[24px_minmax(0,1.6fr)_minmax(0,1fr)_140px_112px_44px] gap-x-3 items-start';

function EnhancedTaskList({
  todoItems,
  isLoading,
  toggleComplete,
  refreshCalendarEvents,
  pendingSyncCount,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onChangePriority,
}) {
  const [collapsed, setCollapsed] = useState({});

  // Classifica le task: completate escluse; in ritardo vs in corso.
  const grouped = useMemo(() => {
    const today0 = startOfDay(new Date());
    const buckets = { overdue: [], inCorso: [] };
    todoItems.forEach((item) => {
      if (item.isCompleted) return; // nascoste
      const d = item.dueDate && isValid(item.dueDate) ? item.dueDate : null;
      const isOverdue = d && differenceInCalendarDays(startOfDay(d), today0) < 0;
      if (isOverdue) buckets.overdue.push(item);
      else buckets.inCorso.push(item);
    });
    return buckets;
  }, [todoItems]);

  // KPI: in corso, scadute, scadute da oltre 7 giorni.
  const stats = useMemo(() => {
    const today0 = startOfDay(new Date());
    const inProgress = todoItems.filter((t) => !t.isCompleted).length;
    const overdue = grouped.overdue.length;
    const urgentOverdue = grouped.overdue.filter(
      (t) => t.dueDate && isValid(t.dueDate) && differenceInCalendarDays(today0, startOfDay(t.dueDate)) > 7
    ).length;
    return { inProgress, overdue, urgentOverdue };
  }, [todoItems, grouped]);

  const toggleGroup = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  const hasVisible = grouped.overdue.length + grouped.inCorso.length > 0;

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm h-full flex flex-col transition-colors duration-200">
      {/* Header + azioni */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Da fare</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewTask}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Nuova task con dettagli"
          >
            <FaPlus size={12} /> <span className="hidden sm:inline">Nuova task</span>
          </button>
          <button
            onClick={refreshCalendarEvents}
            className="relative p-2 text-gray-500 dark:text-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
            title="Aggiorna"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
            {pendingSyncCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {pendingSyncCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Card KPI */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* In corso */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FaRegClock size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">In corso</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300 leading-none">{stats.inProgress}</div>
          <div className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">task da completare</div>
        </div>

        {/* Scadute */}
        <div
          className={`rounded-xl border p-4 ${
            stats.overdue > 0
              ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover'
          }`}
        >
          <div className={`flex items-center gap-2 ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
            <FaExclamationTriangle size={13} />
            <span className="text-xs font-medium uppercase tracking-wide">Scadute</span>
          </div>
          <div className={`mt-1 text-3xl font-bold leading-none ${stats.overdue > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-dark-text-primary'}`}>
            {stats.overdue}
          </div>
          <div className={`mt-1 text-xs ${stats.overdue > 0 ? 'text-red-600/70 dark:text-red-400/70' : 'text-gray-400 dark:text-dark-text-muted'}`}>
            oltre la data prevista
          </div>
        </div>

        {/* Urgenti: scadute da oltre 7 giorni */}
        <div
          className={`rounded-xl border p-4 ${
            stats.urgentOverdue > 0
              ? 'border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/40'
              : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover'
          }`}
        >
          <div className={`flex items-center gap-2 ${stats.urgentOverdue > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
            <FaExclamationTriangle size={13} />
            <span className="text-xs font-medium uppercase tracking-wide">Urgenti</span>
          </div>
          <div className={`mt-1 text-3xl font-bold leading-none ${stats.urgentOverdue > 0 ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-dark-text-primary'}`}>
            {stats.urgentOverdue}
          </div>
          <div className={`mt-1 text-xs ${stats.urgentOverdue > 0 ? 'text-red-700/70 dark:text-red-300/70' : 'text-gray-400 dark:text-dark-text-muted'}`}>
            scadute da oltre 7 giorni
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-dark-text-muted py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3" />
          Caricamento task…
        </div>
      ) : !hasVisible ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6 text-gray-500 dark:text-dark-text-muted">
          <MdCheckCircleOutline size={44} className="mb-2 text-gray-300 dark:text-dark-text-muted" />
          <p className="font-medium text-gray-700 dark:text-dark-text-secondary">Tutto in ordine</p>
          <p className="text-sm">Crea una task con il pulsante "Nuova task".</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mt-4">
          {/* Header colonne (sticky) */}
          <div
            className={`${GRID_COLS} sticky top-0 z-10 bg-gray-50 dark:bg-dark-hover border-y border-gray-200 dark:border-dark-border px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-dark-text-muted`}
          >
            <span />
            <span>Attività</span>
            <span className="hidden md:block">Pratica</span>
            <span>Scadenza</span>
            <span>Priorità</span>
            <span />
          </div>

          {GROUP_ORDER.map(({ key, label, tone }) => {
            const items = grouped[key];
            if (!items || items.length === 0) return null;
            const isCollapsed = !!collapsed[key];
            const barTone =
              tone === 'danger'
                ? 'bg-red-50 dark:bg-red-900/15 text-red-600 dark:text-red-400'
                : 'bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400';
            return (
              <div key={key}>
                {/* Barra gruppo */}
                <button
                  onClick={() => toggleGroup(key)}
                  className={`w-full flex items-center gap-2 px-5 py-1.5 text-xs font-semibold uppercase tracking-wide ${barTone} border-b border-gray-100 dark:border-dark-border`}
                >
                  {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronDown size={10} />}
                  <span>{label}</span>
                  <span className="font-medium bg-white/70 dark:bg-black/20 rounded-full px-2 py-0.5 text-[11px]">{items.length}</span>
                </button>

                {!isCollapsed &&
                  items.map((item) => (
                    <TaskRow
                      key={item.gCalEventId}
                      item={item}
                      isOverdue={key === 'overdue'}
                      toggleComplete={toggleComplete}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onChangePriority={onChangePriority}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pill priorità editabile inline (menu a tendina locale).
function PriorityPill({ item, onChangePriority }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = item.priority || 'normale';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${priorityStyle(current)} hover:brightness-95`}
        title="Cambia priorità"
      >
        {priorityLabel(current)}
        <FaChevronDown size={8} className="opacity-60" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-28 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-lg py-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (p.value !== current) onChangePriority && onChangePriority(item, p.value);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-hover ${
                p.value === current ? 'font-semibold' : 'text-gray-600 dark:text-dark-text-secondary'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${p.value === 'alta' ? 'bg-red-500' : p.value === 'bassa' ? 'bg-gray-400' : 'bg-blue-500'}`} />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ item, isOverdue, toggleComplete, onEditTask, onDeleteTask, onChangePriority }) {
  const dueLabel = formatDue(item.dueDate);
  const pratica = item.praticaInfo;
  const praticaLabel =
    pratica && (pratica.indirizzo || pratica.cliente)
      ? [pratica.indirizzo, pratica.cliente].filter(Boolean).join(' · ')
      : null;

  return (
    <div
      className={`group ${GRID_COLS} px-5 py-2.5 border-b border-gray-100 dark:border-dark-border transition-colors ${
        isOverdue
          ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-dark-hover'
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={item.isCompleted}
        onChange={() => toggleComplete(item.gCalEventId)}
        className="h-4 w-4 rounded cursor-pointer mt-0.5"
        style={{ accentColor: '#2563eb' }}
      />

      {/* Attività (testo a capo, intero) */}
      <button type="button" onClick={() => onEditTask && onEditTask(item.originalGCalEventData)} className="text-left min-w-0">
        <span className="block text-sm font-medium text-gray-900 dark:text-dark-text-primary whitespace-normal break-words">
          {cleanTitle(item.title)}
        </span>
        {/* Pratica su mobile (colonna nascosta): sotto il titolo */}
        {praticaLabel && (
          <span className="md:hidden block text-xs text-gray-500 dark:text-dark-text-muted whitespace-normal break-words">
            {praticaLabel}
          </span>
        )}
      </button>

      {/* Pratica (colonna, da md) — testo intero */}
      <span className="hidden md:block text-xs text-gray-500 dark:text-dark-text-muted whitespace-normal break-words">
        {praticaLabel || '—'}
      </span>

      {/* Scadenza */}
      <span className={`text-xs whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
        {dueLabel || '—'}
      </span>

      {/* Priorità */}
      <div>
        <PriorityPill item={item} onChangePriority={onChangePriority} />
      </div>

      {/* Azioni (hover) */}
      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEditTask && onEditTask(item.originalGCalEventData)}
          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-md"
          title="Modifica"
        >
          <MdEdit size={15} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteTask && onDeleteTask(item)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-md"
          title="Elimina"
        >
          <FaTrash size={12} />
        </button>
      </div>
    </div>
  );
}

export default EnhancedTaskList;

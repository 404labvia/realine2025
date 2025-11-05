// src/components/SidePeek.js
import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

const SidePeek = ({ isOpen, onClose, title, children }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Blocca lo scroll del body quando il side peek è aperto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Aggiungi listener dopo un piccolo delay per evitare chiusura immediata
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Side peek panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-[40%]
          bg-white dark:bg-dark-surface
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
        style={{
          borderLeft: '1px solid',
          borderColor: 'var(--border-color, #e5e7eb)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
            aria-label="Chiudi"
          >
            <FaTimes className="text-gray-600 dark:text-dark-text-secondary" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidePeek;

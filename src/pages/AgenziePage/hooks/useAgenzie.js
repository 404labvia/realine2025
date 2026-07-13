// src/pages/AgenziePage/hooks/useAgenzie.js
// Config digest per agenzia: collection `agenzie`, doc ID = nome esatto agenzia
// (match diretto con pratica.agenzia lato Cloud Function).
// La lista dei nomi resta quella hardcoded (praticheUtils / pratichePrivatoUtils):
// Firestore contiene solo email e flag attiva.
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { agenzieCollaboratori } from '../../PratichePage/utils';
import { agenzieCollaboratoriPrivato } from '../../PratichePrivatoPage/utils';

// Lista canonica: standard + private (con flag per il badge in UI)
const AGENZIE_CANONICHE = [
  ...agenzieCollaboratori.map((ac) => ({ nome: ac.agenzia, privato: false })),
  ...agenzieCollaboratoriPrivato.map((ac) => ({ nome: ac.agenzia, privato: true })),
];

export function useAgenzie() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'agenzie'),
      (snapshot) => {
        const byNome = {};
        snapshot.docs.forEach((d) => {
          byNome[d.id] = d.data();
        });
        setConfigs(byNome);
        setLoading(false);
      },
      (error) => {
        console.error('Errore lettura agenzie:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Vista merged: default attiva=false finché non configurata esplicitamente.
  const agenzie = AGENZIE_CANONICHE.map((a) => ({
    nome: a.nome,
    privato: a.privato,
    emails: [],
    attiva: false,
    ...(configs[a.nome] || {}),
  }));

  const saveAgenzia = useCallback(async (nome, { emails, attiva }) => {
    await setDoc(
      doc(db, 'agenzie', nome),
      {
        nome,
        emails,
        attiva,
        updatedAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || null,
      },
      { merge: true }
    );
  }, []);

  return { agenzie, loading, saveAgenzia };
}

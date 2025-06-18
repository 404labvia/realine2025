import React, { useContext } from 'react';
import { AccessoAttiContext } from '../contexts/AccessoAttiContext';
import useGoogleCalendarApi from '../../CalendarPage/hooks/useGoogleCalendarApi';

const AccessoAttiTableRow = ({ pratica }) => {
  const { updateAccesso } = useContext(AccessoAttiContext);
  const { createEvent, isSignedIn, handleAuthClick } = useGoogleCalendarApi();

  const handleStatusChange = async (statusName, isChecked) => {
    // Aggiorna lo stato della pratica su Firebase
    updateAccesso(pratica.id, { [statusName]: isChecked });

    // Se la checkbox è "Richiesta Inviata" ed è stata spuntata
    if (statusName === 'richiestaInviata' && isChecked) {
      if (!isSignedIn) {
        alert('Per creare un evento sul calendario, devi prima autorizzare l\'accesso a Google.');
        handleAuthClick();
        return;
      }

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 35);
        startDate.setHours(15, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + 15);

        const event = {
          summary: `Controllare arrivo licenze (${pratica.indirizzo})`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Europe/Rome',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Europe/Rome',
          },
        };

        // Crea l'evento sul calendario primario
        await createEvent(event);

      } catch (error) {
        console.error('Errore durante la creazione dell\'evento:', error);
        alert('Si è verificato un errore durante la creazione dell\'evento sul calendario.');
      }
    }
  };

  return (
    <tr className="border-b">
      <td className="px-4 py-2">{pratica.numero}</td>
      <td className="px-4 py-2">{pratica.data}</td>
      <td className="px-4 py-2">{pratica.indirizzo}</td>
      <td className="px-4 py-2">{pratica.citta}</td>
      <td className="px-4 py-2">{pratica.stato}</td>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={!!pratica.richiestaInviata}
          onChange={(e) => handleStatusChange('richiestaInviata', e.target.checked)}
        />
      </td>
       <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={!!pratica.documentiRicevuti}
          onChange={(e) => handleStatusChange('documentiRicevuti', e.target.checked)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={!!pratica.documentiInviati}
          onChange={(e) => handleStatusChange('documentiInviati', e.target.checked)}
        />
      </td>
      <td className="px-4 py-2">{pratica.dataInvio}</td>
      <td className="px-4 py-2">{pratica.note}</td>
    </tr>
  );
};

export default AccessoAttiTableRow;
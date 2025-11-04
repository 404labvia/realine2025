/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Abilita dark mode con classe 'dark'
  theme: {
    extend: {
      colors: {
        // Colori personalizzati per dark mode (scala di grigi professionale)
        dark: {
          bg: '#0f172a',      // Background principale
          surface: '#1e293b',  // Superfici (cards, modali)
          border: '#334155',   // Bordi
          hover: '#475569',    // Hover states
          text: {
            primary: '#f1f5f9',   // Testo principale
            secondary: '#cbd5e1', // Testo secondario
            muted: '#94a3b8',     // Testo disattivato
          }
        }
      }
    },
  },
  plugins: [],
}
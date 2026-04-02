// Cloudflare Worker - Proxy per Claude API
// Questo worker fa da intermediario tra il frontend e l'API Claude
// per mantenere sicura la chiave API

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// CORS headers per permettere chiamate dal frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In produzione, sostituisci con il tuo dominio
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Gestisci preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Solo POST è permesso
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();

      // Validazione base del payload
      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prepara la richiesta per Claude
      const claudeRequest = {
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 4096,
        messages: body.messages,
      };

      // Chiamata a Claude API
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(claudeRequest),
      });

      const data = await response.json();

      // Gestisci errori dall'API Claude
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: data.error?.message || 'Claude API error',
          type: data.error?.type || 'api_error',
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ritorna la risposta di Claude
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

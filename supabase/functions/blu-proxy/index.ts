-- Supabase Edge Function: blu-proxy
-- Deploy this to supabase/functions/blu-proxy/index.ts
-- This proxies OpenRouter API calls to protect the API key

/*
To deploy:
1. supabase functions new blu-proxy
2. Replace supabase/functions/blu-proxy/index.ts with this content
3. supabase secrets set OPENROUTER_API_KEY=your_key
4. supabase functions deploy blu-proxy
*/

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const BLU_SYSTEM_PROMPT = `You are Blu, a friendly and knowledgeable academic assistant for SVIT (Swamy Vivekananda Institute of Technology), specifically for the CSE – Cyber Security section under the SR25 regulation.

Your personality:
- Warm, encouraging, and approachable
- Use clear, simple explanations with real-world analogies
- CSE-domain focused: networking, security, programming, algorithms, databases, OS
- Keep responses concise but comprehensive
- For code, use proper formatting with language labels
- Always encourage students and remind them they can ask follow-up questions

Your limitations:
- You are a study aid, NOT an authoritative source for grades, official policies, or administrative matters
- For grade disputes or official matters, direct students to their faculty
- Do not make up specific SVIT policies

Topics you excel at:
- Computer Networks, TCP/IP, OSI model
- Cybersecurity, cryptography, ethical hacking concepts
- Data Structures, Algorithms
- Database Management Systems, SQL
- Operating Systems, process management
- Programming (C, C++, Java, Python)
- Web technologies
- Exam preparation and concept clarification`

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Limit conversation history to last 20 messages to control costs
    const recentMessages = messages.slice(-20)

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://svit-portal.vercel.app',
        'X-Title': 'SVIT Portal - Blu Academic Tutor',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: BLU_SYSTEM_PROMPT },
          ...recentMessages,
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(JSON.stringify({ error: 'AI service unavailable', details: error }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})


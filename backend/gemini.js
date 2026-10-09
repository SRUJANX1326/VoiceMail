const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Local model via Ollama (set LLM_PROVIDER=ollama in .env)
async function genOllama(prompt, temperature) {
  const base = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL;
  if (!model) throw new Error('Set OLLAMA_MODEL in .env (run "ollama list" to see your models).');
  let r;
  try {
    r = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature } }),
    });
  } catch {
    throw new Error('Cannot reach Ollama. Make sure Ollama is running on this PC.');
  }
  if (!r.ok) throw new Error(`Ollama error ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const raw = (await r.json()).response || '{}';
  return JSON.parse(raw.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '').trim());
}

// Any OpenAI-compatible API: Groq, Cerebras, OpenRouter, Mistral... (set LLM_PROVIDER=openai)
async function genOpenAI(prompt, temperature) {
  const base = (process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile';
  if (!process.env.OPENAI_API_KEY) throw new Error('Set OPENAI_API_KEY in .env.');
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (r.ok) {
      const raw = (await r.json()).choices?.[0]?.message?.content || '{}';
      return JSON.parse(raw.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '').trim());
    }
    console.warn(`LLM ${model} -> ${r.status} (attempt ${attempt + 1})`);
    if (r.status === 401) throw new Error('API key rejected. Check OPENAI_API_KEY in .env.');
    if (r.status === 404 || r.status === 400) throw new Error(`Model problem (${r.status}). Check OPENAI_MODEL in .env. ${(await r.text()).slice(0, 120)}`);
    if (r.status === 429) { if (attempt === 2) throw new Error('Free limit reached. Please wait a minute and try again.'); await sleep(2000 * (attempt + 1)); continue; }
    await sleep(1000 * (attempt + 1));
  }
  throw new Error('The AI service is busy. Please try again in a moment.');
}

// Retries on temporary Google errors (503/500/429) and falls back to a backup model.
async function gen(prompt, temperature = 0.4) {
  if (process.env.LLM_PROVIDER === 'ollama') return genOllama(prompt, temperature);
  if (process.env.LLM_PROVIDER === 'openai') return genOpenAI(prompt, temperature);
  const models = [
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    ...(process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-latest').split(',').map((m) => m.trim()).filter(Boolean),
  ];
  let lastErr = 'Gemini is busy. Please try again in a moment.';
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature },
          }),
        }
      );
      if (r.ok) {
        const data = await r.json();
        const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';
        return JSON.parse(raw.replace(/```json|```/g, '').trim());
      }
      console.warn(`Gemini ${model} -> ${r.status} (attempt ${attempt + 1})`);
      if (r.status === 404) { lastErr = `Model ${model} not found. Check GEMINI_MODEL in .env.`; break; }
      if (r.status === 429) { lastErr = 'Gemini free limit reached. Please wait a minute and try again.'; break; }
      if (r.status === 503 || r.status === 500) { lastErr = 'Gemini is very busy right now. Please try again in a moment.'; await sleep(1000 * (attempt + 1)); continue; }
      throw new Error(`Gemini error ${r.status}: ${(await r.text()).slice(0, 150)}`);
    }
  }
  throw new Error(lastErr);
}

const EMAIL_SYSTEM = `You are the email-writing engine for a voice assistant. Return ONLY JSON: {"to": string, "subject": string, "body": string}.
Rules:
- Write a complete email only from the user's actual instructions. Never use a template, predefined subject, canned body, or generic sick-leave/meeting assumptions.
- If the user gave a SUBJECT INSTRUCTION, turn it into a concise, natural subject line. If no separate subject was given, infer a concise subject strictly from the BODY INSTRUCTION. Never use a fixed or canned subject.
- The BODY INSTRUCTION is the source of the message. Expand it into an approximately 200-word email including greeting and sign-off, unless the user's instructions clearly request a different length. Match the requested tone. Use all relevant details already given; never ask the user to repeat them.
- Never invent names, dates, commitments, reasons, facts, or requests. If important information is missing, keep the wording general rather than guessing.
- Use the recipient name only if provided. Address is copied exactly if present; if no address was given, return an empty to field.
- If a CURRENT DRAFT has a non-empty subject and body, apply the new instruction to revise it while preserving unrelated details. If the current subject/body are empty, create a fresh email from the subject and body instructions below.
- Past email history is context for continuity only. Do not copy private details or add content unless the current request makes it relevant.`;

export async function draftEmail(text, current = {}) {
  const prompt = `${EMAIL_SYSTEM}\n\nRECIPIENT NAME: ${current.recipientName || '(not provided)'}\nRECIPIENT EMAIL: ${current.to || ''}\nSUBJECT INSTRUCTION: ${current.subjectInstruction || current.subject || '(not provided)'}\nBODY INSTRUCTION: ${current.bodyInstruction || text || '(not provided)'}\n${current.subject || current.body ? `CURRENT DRAFT TO REVISE: ${JSON.stringify({subject:current.subject,body:current.body})}\nNEW REVISION INSTRUCTION: ${text}` : ''}\nRELEVANT PAST EMAIL HISTORY: ${JSON.stringify((current.history || []).slice(0, 5).map(h => ({subject:h.subject,body:String(h.body || '').slice(0, 1200)})))}`;
  const j = await gen(prompt, 0.35);
  return { to: String(j.to || current.to || '').trim(), subject: String(j.subject || '').trim(), body: String(j.body || '').trim() };
}

export async function suggestAddition({ name, subject, bodyInstruction, history = [] }) {
  if (!history.length) return { suggestion: '' };
  const j = await gen(`You help improve a new email by using only relevant context from past emails with the same recipient. Return ONLY JSON: {"suggestion": string}. If there is no genuinely useful, clearly relevant addition, return an empty suggestion. Never invent facts or expose unrelated private details. Recipient: ${name || 'recipient'}. New subject: ${subject}. Current email instructions: ${bodyInstruction}. Past emails: ${JSON.stringify(history.slice(0,5).map(h => ({subject:h.subject,body:String(h.body || '').slice(0,1000)})))}. Suggest at most one short optional sentence.`, 0.2);
  return { suggestion: String(j.suggestion || '').trim() };
}

const CHAT_SYSTEM = `You are "Assistant", a friendly voice assistant. Return ONLY JSON: {"intent":"email"|"chat","reply":string}.
- intent "email" ONLY if the user asks to write, compose, draft or send an email/mail. Then reply must be "".
- Otherwise intent "chat": answer naturally in at most 2 short spoken sentences, like a friendly person on a phone call. Plain text only: no markdown, lists, emojis or special symbols. Be warm and conversational. If you don't know something, say so.`;

export async function chat(text, history = []) {
  const convo = history.slice(-12).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const j = await gen(`${CHAT_SYSTEM}\n\nCONVERSATION SO FAR:\n${convo || '(none)'}\n\nUser: ${text}`, 0.7);
  return { intent: j.intent === 'email' ? 'email' : 'chat', reply: String(j.reply || '').trim() || "Sorry, I didn't get that." };
}

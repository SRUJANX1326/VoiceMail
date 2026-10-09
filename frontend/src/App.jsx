import { useEffect, useRef, useState } from 'react';
import { listen, speak, interruptSpeech, abortListen, onVoiceError, native, voices, getVoiceId, setVoiceId } from './voice';
import { Dialog } from './dialog';
import * as api from './api';

const WAKE = /\b(?:hey|hi|hay|ok(?:ay)?)[,.\s]+(?:my[,.\s]+)?assist\w*/i; // "hey assistant" / "hey my assistant"
const BYE = /\b(goodbye|good bye|bye|stop listening|go to sleep|thank you|thanks)\b/i;
const LABEL = {
  stopped: 'Stopped', wake: 'Waiting for “Hey my assistant”', listening: 'Listening…', processing: 'Processing…',
  speaking: 'Speaking…', confirm: 'Waiting for confirmation', sent: 'Email sent ✓', uploaded: 'Uploaded to Drive ✓',
};
const STEPS = [['Recipient', ['need_recipient', 'confirm_recipient']], ['Review', ['review', 'adding']], ['Send', ['confirm_send', 'sending']]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('stopped');
  const [step, setStep] = useState('idle');
  const [log, setLog] = useState([]);
  const [liveLine, setLiveLine] = useState('');
  const liveTimer = useRef(null);
  const [draft, setDraft] = useState(null);
  const [upload, setUpload] = useState(null);
  const [wa, setWa] = useState(null);
  const [conn, setConn] = useState({ connected: false });
  const [barge, setBarge] = useState(localStorage.getItem('barge') !== '0');
  const [voiceId, setVoice] = useState(getVoiceId());
  const transcriptRef = useRef(null);
  const run = useRef(false);
  const bargeRef = useRef(barge);
  const dlg = useRef(new Dialog(api));

  const add = (who, text) => {
    setLog((l) => [...l.slice(-30), { who, text }]);
    if (who === 'you' || who === 'assistant') {
      setLiveLine(`${who === 'you' ? 'YOU' : 'APP'}: ${text}`);
      if (liveTimer.current) clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => setLiveLine(''), 4500);
    }
  };
  const refresh = () => api.status().then(setConn).catch(() => {});
  useEffect(() => { const el = transcriptRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [log]);
  const sync = () => { setWa(dlg.current.state === 'wa_confirm' && dlg.current.wa ? { ...dlg.current.wa } : null); setUpload(dlg.current.upload ? { ...dlg.current.upload } : null); setDraft(dlg.current.draft ? { ...dlg.current.draft } : null); setStep(dlg.current.state); };

  useEffect(() => {
    onVoiceError((code) => add('error', {
      unsupported: 'This browser has no speech recognition. Use Chrome or Edge.',
      'not-allowed': 'Microphone blocked. Click the lock icon in the address bar and allow the microphone.',
      'service-not-allowed': 'Microphone blocked. Click the lock icon in the address bar and allow the microphone.',
      'audio-capture': 'No microphone found.', network: 'Speech recognition needs internet.',
      'native-unavailable': 'Speech recognition is not available on this phone.', 'native-9': 'Microphone permission missing. Allow it in app settings.',
    }[code] || `Voice error: ${code}`));
    refresh();
    const onVis = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVis);
    if (native) start();
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  async function say(text, speech) {
    add('assistant', text);
    setPhase('speaking');
    await speak(speech || text, { bargeIn: bargeRef.current });
  }

  async function converse(first) {
    const d = dlg.current;
    let input = first ? { text: first, alts: [first] } : null;
    if (!input) await say('Yes?');
    let misses = 0;
    while (run.current) {
      if (!input) {
        setPhase(d.awaitingConfirmation ? 'confirm' : 'listening');
        input = await listen();
        if (!run.current) return;
        if (!input) {
          misses++;
          if (d.state === 'idle' && misses >= 3) { await say("I'll be here when you need me. Just say Hey my assistant."); return; }
          if (d.state !== 'idle' && misses >= 4) { d.reset(); sync(); await say("I didn't hear anything, so I cancelled. Nothing was sent."); return; }
          if (d.state !== 'idle' && misses % 2 === 0) await say(d.reprompt());
          await sleep(200);
          continue;
        }
        add('you', input.text);
      }
      misses = 0;
      if (d.state === 'idle' && BYE.test(input.text) && input.text.split(/\s+/).length <= 6) { await say('Goodbye! Say Hey my assistant whenever you need me.'); return; }
      setPhase('processing');
      let res;
      try { res = await d.handle(input); }
      catch (e) { add('error', e.message); refresh(); res = { say: `Sorry, that did not work. ${e.message}` }; }
      input = null;
      sync();
      if (res.sent) { setPhase('sent'); setLog((l) => [...l, { who: 'sent', text: `Email sent to ${res.to}` }]); }
      if (res.uploaded) { setPhase('uploaded'); setLog((l) => [...l, { who: 'sent', text: `Uploaded ${res.name} to Google Drive` }]); }
      await say(res.say, res.speech);
      if (res.openUrl) { setLog((l) => [...l, { who: 'sent', text: `Opened WhatsApp for ${res.to}. Tap Send in WhatsApp.` }]); native ? window.Android.openUrl(res.openUrl) : window.open(res.openUrl, '_blank'); }
    }
  }

  async function loop() {
    await say('Ready. Say Hey my assistant to begin.');
    while (run.current) {
      setPhase('wake');
      const t = await listen();
      if (!run.current) break;
      if (!t) { await sleep(200); continue; }
      let first = null, hit = false;
      for (const a of t.alts) { const m = a.match(WAKE); if (m) { hit = true; first = a.slice(m.index + m[0].length).replace(/^[,.\s]+/, ''); break; } }
      if (!hit) continue;
      add('you', t.text);
      dlg.current = new Dialog(api);
      sync();
      await converse(first);
    }
    setPhase('stopped');
  }

  function start() { if (run.current) return; run.current = true; setRunning(true); loop(); }
  function stop() { run.current = false; setRunning(false); interruptSpeech(); abortListen(); setPhase('stopped'); }
  const connect = () => { const u = api.connectUrl(); native ? window.Android.openUrl(u) : window.open(u, '_blank'); };
  const toggleBarge = () => { const v = !barge; setBarge(v); bargeRef.current = v; localStorage.setItem('barge', v ? '1' : '0'); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">v</span><span>voicemail<span className="brand-dot">.</span></span></div>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="nav-icon">⌂</span> Overview</button>
        <button className="nav-item" onClick={() => document.querySelector('.log')?.scrollIntoView({ behavior: 'smooth' })}><span className="nav-icon">▤</span> Conversation log</button>
        <button className="nav-item" onClick={() => document.querySelector('.opts')?.scrollIntoView({ behavior: 'smooth' })}><span className="nav-icon">⚙</span> Preferences</button>
        <div className="sidebar-bottom">
          <div className="connection-indicator"><span className={conn.connected ? 'status-dot good' : 'status-dot'} />
            <div><strong>{conn.connected ? 'Google connected' : 'Google not connected'}</strong><small>{conn.connected ? conn.email : 'Connect to send emails'}</small></div>
          </div>
          <div className="powered"><span className="bolt">ϟ</span><div><strong>Voice, made simple</strong><small>Hands-free email assistant</small></div></div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>Voice assistant</strong></div><div className="top-actions"><span className="secure-label"><span className="status-dot good"/> Private session</span><div className="avatar">VA</div></div></header>
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-line"/> YOUR PERSONAL VOICE ASSISTANT</div>
          <h1>Email, <span>without lifting a finger.</span></h1>
          <p className="subtitle">Compose, review, and send emails with just your voice.</p>
          <div className={`voice-panel ${phase}`}>
            <div className="voice-panel-top"><span className="live-tag"><span className={running ? 'status-dot good pulse' : 'status-dot'} /> {running ? 'ASSISTANT ACTIVE' : 'ASSISTANT STANDBY'}</span><span className="phase-label">{LABEL[phase]}</span></div>
            <div className="voice-visual" aria-label={LABEL[phase]}>
              <div className="wave wave-one"/><div className="wave wave-two"/><div className="wave wave-three"/>
              <div className="orb"><span className="orb-core">ϟ</span></div>
            </div>
            <div className="voice-status">{running ? (phase === 'wake' ? 'I’m listening for your cue' : phase === 'listening' ? 'Go ahead, I’m listening' : phase === 'processing' ? 'Working on your request' : phase === 'speaking' ? 'Your assistant is speaking' : phase === 'confirm' ? 'Waiting for your confirmation' : phase === 'sent' ? 'Your email has been sent' : 'Ready when you are') : 'Ready when you are'}</div>
            <div className="voice-hint">{running ? 'Say “Hey my assistant” to get started' : 'Start the assistant, then say “Hey my assistant”'}</div>
            <div className="primary-actions">
              <button className={`primary-btn ${running ? 'stop-btn' : ''}`} onClick={running ? stop : start}><span>{running ? '■' : '▶'}</span>{running ? 'Stop listening' : 'Start listening'}</button>
              <button className="secondary-btn" onClick={connect}><span className="google-g">G</span>{conn.connected ? `Connected · ${conn.email}` : 'Connect Google'}</button>
              {phase === 'speaking' && <button className="secondary-btn" onClick={interruptSpeech}>Interrupt voice</button>}
            </div>
          </div>
          <section className="activity-card conversation-near-orb live-conversation" aria-label="Live conversation">
            <div className="card-heading"><div className="mini-icon">≋</div><div><h3>Live conversation</h3><p>Latest words only</p></div></div>
            <div className={`live-line ${liveLine ? 'visible' : ''}`} aria-live="polite">{liveLine || 'Your latest words will appear here…'}</div>
          </section>
          <div className="workflow-heading"><div><h2>Your workflow</h2><p>Every email stays in your control before it’s sent.</p></div><span className="workflow-badge">3 simple steps</span></div>
          <div className="steps workflow-steps">
            {STEPS.map(([name, states], i) => <div key={name} className={`workflow-step ${states.includes(step) ? 'on' : ''}`}><div className="step-number">{i + 1}</div><div><strong>{name === 'Recipient' ? 'Choose recipient' : name === 'Review' ? 'Review your email' : 'Confirm & send'}</strong><small>{name === 'Recipient' ? 'Tell me who it’s for' : name === 'Review' ? 'Check the subject and message' : 'Nothing sends without approval'}</small></div></div>)}
          </div>
          {draft && (draft.subject || draft.body) && <section className="card draft-card"><div className="section-kicker">EMAIL DRAFT <span className="draft-status">Ready for review</span></div><div className="draft-field"><span>To</span><strong>{draft.to || '—'}</strong></div><div className="draft-field"><span>Subject</span><strong>{draft.subject}</strong></div><pre>{draft.body}</pre></section>}
          {wa && <section className="card draft-card"><div className="section-kicker">WHATSAPP MESSAGE <span className="draft-status">Waiting for confirmation</span></div><div className="draft-field"><span>To</span><strong>{wa.display} {wa.e164}</strong></div><pre>{wa.message}</pre></section>}
          {upload && <section className="card draft-card"><div className="section-kicker">GOOGLE DRIVE UPLOAD <span className="draft-status">Waiting for confirmation</span></div><div className="draft-field"><span>File</span><strong>{upload.name}</strong></div><div className="draft-field"><span>Size</span><strong>{upload.sizeLabel}</strong></div></section>}
          <section className="bottom-grid">
            <div className="settings-card opts"><div className="card-heading"><div className="mini-icon">⚙</div><div><h3>Preferences</h3><p>Make the assistant work your way.</p></div></div><label className="toggle-row"><span><strong>Interrupt by voice</strong><small>Speak over the assistant (headphones recommended)</small></span><input type="checkbox" checked={barge} onChange={toggleBarge} /></label>
              {!native && voices().length > 0 && <label className="voice-select-label">Assistant voice<select value={voiceId} onChange={(e) => { setVoiceId(e.target.value); setVoice(e.target.value); }}><option value="">Automatic (best available)</option>{voices().map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</select></label>}
            </div>
          </section>
          <footer className="footer"><span>Designed for calmer, hands-free communication.</span><span><span className="status-dot good"/> Your email is only sent after confirmation.</span></footer>
        </section>
      </main>
    </div>
  );
}

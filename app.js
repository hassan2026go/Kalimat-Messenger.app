/* كلمات ماسنجر — تطبيق مراسلة حقيقي: Firebase (Auth + Firestore) + تشفير طرف لطرف للمحادثات الفردية + مكالمات WebRTC */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment, arrayUnion, deleteField } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

/* ───────── Firebase ───────── */
const app = initializeApp(firebaseConfig, 'mx');
const auth = getAuth(app);
let db;
const fsOpts = { experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true };
try { db = initializeFirestore(app, { ...fsOpts, localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }) }); }
catch (e) { db = initializeFirestore(app, { ...fsOpts, localCache: memoryLocalCache() }); }

/* ───────── أدوات ───────── */
const $ = (s, r = document) => r.querySelector(s);
const h = (t, a, ...c) => {
  const e = document.createElement(t);
  for (const [k, v] of Object.entries(a || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const x of c.flat(9)) { if (x == null || x === false) continue; e.append(x.nodeType ? x : document.createTextNode(x)); }
  return e;
};
const ICONS = {
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  status: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  radar: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19a10 10 0 0 1 0-14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  back: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  video: '<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  dots: '<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  mutemic: '<path d="m2 2 20 20M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6M5 10v2a7 7 0 0 0 12 5M12 19v3"/>',
  camoff: '<path d="m2 2 20 20M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l6-4v10"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  reply: '<path d="m9 17-5-5 5-5M4 12h11a5 5 0 0 1 5 5v2"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  pmiss: '<path d="M16 2v6h6M22 2l-6 6"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3"/>',
};
const ico = (n, s = 22) => { const e = document.createElement('span'); e.className = 'ico'; e.innerHTML = `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`; return e; };
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtT = ms => new Date(ms).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
const fmtD = ms => new Date(ms).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const ago = ms => { const d = Date.now() - ms; if (d < 60e3) return 'الآن'; if (d < 3600e3) return `منذ ${Math.floor(d / 60e3)} دقيقة`; if (d < 86400e3) return `منذ ${Math.floor(d / 3600e3)} ساعة`; return fmtD(ms); };
const hash = s => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
const COLORS = ['#2563ff', '#7c3aed', '#db2777', '#ea580c', '#059669', '#0891b2', '#ca8a04', '#dc2626'];
const TTLS = [['إيقاف', 0], ['24 ساعة', 86400], ['7 أيام', 604800]];
const BGS = ['linear-gradient(135deg,#2563ff,#7c3aed)', 'linear-gradient(135deg,#059669,#0891b2)', 'linear-gradient(135deg,#ea580c,#db2777)', 'linear-gradient(135deg,#0f172a,#334155)', 'linear-gradient(135deg,#ca8a04,#ea580c)', 'linear-gradient(135deg,#7c3aed,#db2777)'];
const EMOJI = '😀 😁 😂 🤣 😊 😍 😘 😎 🤔 😢 😭 😡 👍 👎 👏 🙏 💪 🔥 ❤️ 💔 🎉 ✨ 🌹 ☕ 🌙 ⭐ ✅ ❌ 🤝 👋 🙌 😴 🤩 😇 🥰 😅 😉 🙄 😬 😱 🤗 👌 ✌️ 🤞 💯 🕌 📚 ✍️'.split(' ');
const REACTS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const ERR = {
  'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة', 'auth/invalid-email': 'البريد الإلكتروني غير صالح',
  'auth/user-not-found': 'لا يوجد حساب بهذا البريد', 'auth/wrong-password': 'كلمة المرور غير صحيحة',
  'auth/email-already-in-use': 'هذا البريد مسجّل مسبقاً', 'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل)',
  'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة', 'auth/network-request-failed': 'لا يوجد اتصال بالإنترنت',
};
function toast(t, ms = 3000) { const el = h('div', {}, t); $('#toast').append(el); setTimeout(() => el.remove(), ms); }

/* ───────── الحالة ───────── */
const S = {
  uid: null, me: null, keys: null, tab: 'chats', view: 'boot',
  chats: new Map(), users: new Map(), watched: new Set(), calls: [], st: new Map(), stUnsubs: [], stKey: '',
  chat: null, msgs: [], msgCache: new Map(), pv: new Map(), lastUnread: new Map(), booted: false,
  reply: null, q: '', unsubs: [],
  cfg: Object.assign({ theme: 'indigo', mode: 'dark', wp: 'dots', sound: true, heads: true, notif: false, callsSeen: 0, pin: null }, (() => { try { return JSON.parse(localStorage.getItem('kmx-cfg') || '{}'); } catch { return {}; } })()),
};
const saveCfg = () => { try { localStorage.setItem('kmx-cfg', JSON.stringify(S.cfg)); } catch {} applyCfg(); };
function applyCfg() { const r = document.documentElement; r.dataset.theme = S.cfg.theme; r.dataset.mode = S.cfg.mode; $('meta[name=theme-color]').content = S.cfg.mode === 'light' ? '#f2f5fc' : '#0a1020'; }
applyCfg();
const U = uid => S.users.get(uid) || { name: '…', _ph: true };
let rq = 0; const render = (force) => { if (rq) return; rq = setTimeout(() => { rq = 0; renderNow(force); }, 40); };
const peerOf = c => c.members.find(x => x !== S.uid);
const chatName = c => c.type === 'group' ? (c.name || 'مجموعة') : U(peerOf(c)).name;
const isOnline = u => u && u.ls && Date.now() - u.ls < 5 * 60e3 && u.pv?.ls !== false;
const unreadTotal = () => [...S.chats.values()].reduce((a, c) => a + (c.unread?.[S.uid] || 0), 0);

/* ───────── طبقات وزر الرجوع ───────── */
// كل طبقة (محادثة/نافذة) تدفع سجلاً في history ليعمل زر الرجوع في أندرويد. الإغلاق من الواجهة يترك سجلاً "قديماً"
// يُتخطّى تلقائياً عند الضغط على رجوع (بدون history.back() متزامن لتفادي السباق).
const stack = [];
window.addEventListener('popstate', () => { const e = stack.pop(); if (!e) return; if (e.close) e.close(true); else history.back(); });
function makeLayer(el, cls = '', onClose) {
  el.className = 'layer ' + cls; document.body.append(el); let closed = false; const entry = {};
  const close = () => { if (closed) return; closed = true; entry.close = null; el.remove(); onClose && onClose(); };
  entry.close = close; stack.push(entry); history.pushState({ l: stack.length }, ''); return close;
}
const closeAllLayers = () => [...stack].reverse().forEach(e => e.close && e.close());
function modal(title, ...content) {
  const el = h('div', {});
  let close;
  const sheet = h('div', { class: 'sheet', onclick: e => e.stopPropagation() }, h('div', { class: 'grab' }), title ? h('h2', {}, title) : null, ...content);
  el.append(sheet); el.addEventListener('click', () => close());
  close = makeLayer(el, 'modal'); return close;
}

/* ───────── التشفير (ECDH P-256 + AES-GCM) ───────── */
const kv = {
  open() { return this.p || (this.p = new Promise((res, rej) => { const r = indexedDB.open('kalimat-mx', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async get(k) { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction('k').objectStore('k').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async set(k, v) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); },
};
async function ensureKeys(uid) {
  let k = await kv.get('keys:' + uid);
  if (!k) {
    const p = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    const j = await crypto.subtle.exportKey('jwk', p.publicKey);
    k = { priv: p.privateKey, pub: { x: j.x, y: j.y } }; await kv.set('keys:' + uid, k);
  }
  S.keys = k; return k;
}
const dk = new Map();
async function aesFor(pk) {
  const id = pk.x + pk.y; if (dk.has(id)) return dk.get(id);
  const pub = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pk.x, y: pk.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  const k = await crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, S.keys.priv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  dk.set(id, k); return k;
}
async function seal(str, peerPk) {
  const k = await aesFor(peerPk), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(str)));
  return { iv: b64(iv), ct: b64(ct), sp: S.keys.pub, rp: peerPk };
}
async function unseal(body, fromMe) {
  const other = fromMe ? body.rp : body.sp, mine = fromMe ? body.sp : body.rp;
  if (mine.x !== S.keys.pub.x || mine.y !== S.keys.pub.y) throw new Error('foreign-key');
  const k = await aesFor(other);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(body.iv) }, k, unb64(body.ct)));
}
async function safetyNumber(a, b) {
  const s = [a.x + a.y, b.x + b.y].sort().join('');
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return Array.from({ length: 6 }, (_, i) => String(((d[2 * i] << 8) | d[2 * i + 1]) % 100000).padStart(5, '0')).join(' ');
}
const peerKeyCache = new Map();
async function peerKey(uid) {
  const c = peerKeyCache.get(uid); if (c && Date.now() - c.t < 10 * 60e3) return c.pk;
  const s = await getDoc(doc(db, 'mx_users', uid)); const pk = s.exists() ? s.data().pk : null;
  if (!pk) throw new Error('no-key'); peerKeyCache.set(uid, { pk, t: Date.now() }); return pk;
}
async function sealFor(chat, str) {
  if (chat.type === 'direct') return seal(str, await peerKey(peerOf(chat)));
  return { p: str };
}
async function openBody(body, fromMe) {
  if (!body) return null;
  if (body.p !== undefined) return JSON.parse(body.p);
  return JSON.parse(await unseal(body, fromMe));
}

/* ───────── صور وملفات ───────── */
async function shrink(file, max, q, cap) {
  const bmp = await createImageBitmap(file); let s = Math.min(1, max / Math.max(bmp.width, bmp.height)), out;
  for (let i = 0; i < 7; i++) {
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); out = c.toDataURL('image/jpeg', q);
    if (out.length <= cap) return out; s *= .8; q = Math.max(.5, q - .06);
  }
  return null;
}
const readURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
function pick(accept) { return new Promise(res => { const i = h('input', { type: 'file', accept, style: { display: 'none' } }); i.onchange = () => res(i.files[0] || null); document.body.append(i); i.click(); setTimeout(() => i.remove(), 60000); }); }

/* ───────── الصوت والإشعارات ───────── */
let actx;
function beep(freqs = [880, 1175], dur = .12) {
  if (!S.cfg.sound) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); freqs.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.connect(g); g.connect(actx.destination); const t = actx.currentTime + i * dur; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur + .02); }); } catch {}
}
async function notify(cid, c) {
  const name = chatName(c);
  beep();
  if (S.chat?.id === cid) return;
  if (!document.hidden) {
    toast('💬 رسالة جديدة من ' + name);
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const options = { body: 'لديك رسالة جديدة', icon: './icon-192.png', badge: './icon-192.png', tag: 'kalimat-' + cid, renotify: false, data: { url: './' } };
  try {
    // Prefer the service worker notification API where supported (including installed web apps).
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(name, options);
        return;
      }
    }
    new Notification(name, options);
  } catch (e) {
    console.warn('تعذّر عرض إشعار الرسالة:', e);
  }
}

/* ───────── مكونات واجهة ───────── */
function avatar(u, size = 48, dot = false, extra = '') {
  const st = { width: size + 'px', height: size + 'px', fontSize: size * .42 + 'px', background: u.av ? 'none' : COLORS[hash(u.name || '?') % COLORS.length] };
  return h('div', { class: 'av ' + extra, style: st }, u.av ? h('img', { src: u.av, alt: '' }) : (u.name || '؟').trim().charAt(0), dot ? h('i') : null);
}
const sw = (title, desc, on, fn) => { const s = h('span', { class: 'sw' + (on ? ' on' : '') }); const r = h('div', { class: 'set', onclick: () => { on = !on; s.classList.toggle('on', on); fn(on); } }, h('div', { class: 't' }, h('b', {}, title), desc ? h('small', {}, desc) : null), s); return r; };
const hdr = (title, sub, ...btns) => h('div', { class: 'hd' }, h('div', { style: { flex: 1 } }, h('h1', {}, title), sub ? h('div', { class: 'sub' }, sub) : null), ...btns);
function ticks(m, c) {
  if (m.from !== S.uid) return null;
  if (m.pending) return h('span', {}, '🕓');
  const others = c.members.filter(x => x !== S.uid); const read = others.some(o => (c.reads?.[o] || 0) >= m.t);
  return h('span', { class: read ? 'rd' : '' }, read ? '✓✓' : '✓');
}

/* ───────── التسجيل والدخول ───────── */
function authView(mode = 'login', msg = '') {
  S.view = 'auth'; $('#nav').hidden = true; $('#heads').style.display = 'none';
  const name = h('input', { placeholder: 'الاسم الظاهر', autocomplete: 'name' });
  const email = h('input', { type: 'email', placeholder: 'البريد الإلكتروني', autocomplete: 'email', dir: 'ltr' });
  const pass = h('input', { type: 'password', placeholder: 'كلمة المرور', autocomplete: mode === 'login' ? 'current-password' : 'new-password', dir: 'ltr' });
  const eye = h('button', { type: 'button', onclick: () => { pass.type = pass.type === 'password' ? 'text' : 'password'; } }, ico('eye', 20));
  const err = h('div', { class: 'err' }, msg);
  const go = h('button', { class: 'btn full' }, mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب');
  const run = async () => {
    err.textContent = ''; go.disabled = true;
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email.value.trim(), pass.value);
      else {
        if (name.value.trim().length < 2) throw { code: 'x', message: 'اكتب اسماً من حرفين على الأقل' };
        const cr = await createUserWithEmailAndPassword(auth, email.value.trim(), pass.value);
        await updateProfile(cr.user, { displayName: name.value.trim() }); await sendEmailVerification(cr.user);
      }
    } catch (e) { err.textContent = ERR[e.code] || e.message || 'حدث خطأ'; go.disabled = false; }
  };
  go.onclick = run; pass.onkeydown = e => { if (e.key === 'Enter') run(); };
  $('#main').replaceChildren(h('div', { class: 'auth' },
    h('img', { src: 'icon-512.png', alt: 'كلمات' }), h('h1', {}, 'كلمات ماسنجر'),
    h('p', {}, mode === 'login' ? 'سجّل دخولك لمتابعة محادثاتك' : 'أنشئ حسابك — سنرسل رابط تفعيل إلى بريدك'),
    mode === 'signup' ? name : null, email, h('div', { class: 'pw' }, pass, eye), err, go,
    mode === 'login' ? h('button', { class: 'link', onclick: async () => { if (!email.value.trim()) { err.textContent = 'اكتب بريدك أولاً'; return; } try { await sendPasswordResetEmail(auth, email.value.trim()); err.style.color = 'var(--ok)'; err.textContent = 'أرسلنا رابط استعادة كلمة المرور إلى بريدك'; } catch (e) { err.textContent = ERR[e.code] || 'تعذّر الإرسال'; } } }, 'نسيت كلمة المرور؟') : null,
    h('button', { class: 'link', onclick: () => authView(mode === 'login' ? 'signup' : 'login') }, mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجّل الدخول')));
}
function verifyView(user) {
  S.view = 'verify'; $('#nav').hidden = true; const msg = h('div', { class: 'err' });
  $('#main').replaceChildren(h('div', { class: 'auth' }, h('img', { src: 'icon-512.png' }), h('h1', {}, 'فعّل بريدك'),
    h('p', {}, 'أرسلنا رابط التفعيل إلى ', h('b', { dir: 'ltr' }, user.email), '. افتح الرابط ثم ارجع هنا (تحقق من مجلد الرسائل غير المرغوبة).'), msg,
    h('button', { class: 'btn full', onclick: async () => { await user.reload(); if (auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); location.reload(); } else msg.textContent = 'لم يتم التفعيل بعد'; } }, 'تحققت — تابع'),
    h('button', { class: 'btn ghost full', onclick: async () => { try { await sendEmailVerification(user); msg.style.color = 'var(--ok)'; msg.textContent = 'أعدنا إرسال الرابط'; } catch (e) { msg.textContent = ERR[e.code] || 'انتظر قليلاً قبل إعادة الإرسال'; } } }, 'إعادة إرسال الرابط'),
    h('button', { class: 'link', onclick: () => signOut(auth) }, 'تسجيل الخروج')));
}

/* ───────── الإقلاع ───────── */
onAuthStateChanged(auth, async user => {
  teardown();
  if (!user) { S.uid = null; return authView(); }
  if (!user.emailVerified) return verifyView(user);
  try { await boot(user); } catch (e) { console.error(e); $('#main').replaceChildren(h('div', { class: 'empty' }, 'تعذّر بدء التطبيق: ' + (e.code || e.message), h('br'), h('br'), h('button', { class: 'btn', onclick: () => location.reload() }, 'إعادة المحاولة'))); }
});
function teardown() { S.unsubs.forEach(f => f()); S.unsubs = []; S.stUnsubs.forEach(f => f()); S.stUnsubs = []; S.stKey = ''; S.chats.clear(); S.watched.clear(); S.booted = false; clearInterval(S.hb); }
async function boot(user) {
  S.uid = user.uid; S.view = 'boot';
  const ref = doc(db, 'mx_users', S.uid);
  const keys = await ensureKeys(S.uid);
  let snap = await getDoc(ref).catch(() => null);
  const base = { name: user.displayName || user.email.split('@')[0], pk: keys.pub, ls: Date.now() };
  if (!snap || !snap.exists()) {
    await setDoc(ref, { ...base, sk: base.name.toLowerCase(), bio: 'متاح على كلمات', av: '', code: 'KLM-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), x => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[x % 31]).join(''), pv: { rr: true, ty: true, ls: true, dc: true }, created: Date.now() });
  } else if (snap.data().pk?.x !== keys.pub.x || snap.data().pk?.y !== keys.pub.y) await updateDoc(ref, { pk: keys.pub });
  S.unsubs.push(onSnapshot(ref, s => { S.me = s.data(); S.users.set(S.uid, S.me); render(); }));
  while (!S.me) await sleep(50);
  $('#nav').hidden = false; S.view = 'app';
  S.hb = setInterval(() => { if (!document.hidden) updateDoc(ref, { ls: Date.now() }).catch(() => {}); }, 3 * 60e3);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDoc(ref, { ls: Date.now() }).catch(() => {}); });
  S.unsubs.push(onSnapshot(query(collection(db, 'mx_chats'), where('members', 'array-contains', S.uid)), onChats, e => toast('تعذّر تحميل المحادثات: ' + e.code)));
  S.unsubs.push(onSnapshot(query(collection(db, 'mx_calls'), where('parts', 'array-contains', S.uid)), onCalls, e => console.warn(e)));
  const bt = Date.now(); setTimeout(() => { S.booted = true; }, 1500); void bt;
  setupHeads(); lockCheck(true); render(true);
}

/* ───────── المحادثات ───────── */
function watchUser(uid) {
  if (S.watched.has(uid)) return; S.watched.add(uid);
  S.unsubs.push(onSnapshot(doc(db, 'mx_users', uid), s => { if (s.exists()) { S.users.set(uid, s.data()); render(); if (S.chat) paintHeader(); } }, () => {}));
}
function onChats(snap) {
  snap.docChanges().forEach(ch => {
    const d = { id: ch.doc.id, ...ch.doc.data() };
    if (ch.type === 'removed') { S.chats.delete(d.id); return; }
    S.chats.set(d.id, d);
    if (d.type === 'direct') watchUser(peerOf(d));
    else d.members.forEach(m => m !== S.uid && watchUser(m));
    const n = d.unread?.[S.uid] || 0, old = S.lastUnread.get(d.id) || 0; S.lastUnread.set(d.id, n);
    if (S.booted && n > old && (S.chat?.id !== d.id || document.hidden)) notify(d.id, d);
  });
  watchStatuses(); render(); if (S.chat) { const c = S.chats.get(S.chat.id); if (c) { S.chat = c; paintHeader(); } }
}
async function startDirect(uid) {
  const id = [S.uid, uid].sort().join('_'); let c = S.chats.get(id);
  if (!c) { c = { id, type: 'direct', members: [S.uid, uid] }; await setDoc(doc(db, 'mx_chats', id), { type: 'direct', members: c.members, created: Date.now() }, { merge: true }); S.chats.set(id, c); watchUser(uid); }
  openChat(id);
}
async function newChatModal() {
  const inp = h('input', { placeholder: 'ابحث بالاسم أو برمز الصديق KLM-XXXXXX', dir: 'auto' }); const res = h('div', {});
  let t; const close = modal('محادثة جديدة', inp, res, h('button', { class: 'btn ghost full', style: { marginTop: '12px' }, onclick: () => { close(); groupModal(); } }, ico('users', 18), 'مجموعة جديدة'));
  const run = async () => {
    const q = inp.value.trim(); res.replaceChildren(); if (q.length < 2) return;
    const out = new Map();
    try {
      if (/^klm-/i.test(q)) (await getDocs(query(collection(db, 'mx_users'), where('code', '==', q.toUpperCase())))).forEach(d => out.set(d.id, d.data()));
      else { const k = q.toLowerCase(); (await getDocs(query(collection(db, 'mx_users'), where('sk', '>=', k), where('sk', '<=', k + ''), limit(15)))).forEach(d => { if (d.data().pv?.dc !== false) out.set(d.id, d.data()); }); }
    } catch (e) { res.append(h('div', { class: 'empty' }, 'تعذّر البحث')); return; }
    out.delete(S.uid);
    if (!out.size) return res.append(h('div', { class: 'empty' }, 'لا نتائج'));
    out.forEach((u, id) => { S.users.set(id, u); res.append(h('div', { class: 'row', onclick: () => { close(); startDirect(id); } }, avatar(u, 44), h('div', { class: 'mid' }, h('div', { class: 'nm' }, u.name), h('div', { class: 'pv' }, h('span', {}, u.bio || ''))))); });
  };
  inp.oninput = () => { clearTimeout(t); t = setTimeout(run, 300); }; setTimeout(() => inp.focus(), 100);
}
function groupModal() {
  const peers = [...S.chats.values()].filter(c => c.type === 'direct').map(peerOf);
  const name = h('input', { placeholder: 'اسم المجموعة' }); const sel = new Set();
  const list = h('div', { class: 'chips' }, peers.map(p => h('label', {}, h('input', { type: 'checkbox', onchange: e => e.target.checked ? sel.add(p) : sel.delete(p) }), avatar(U(p), 30), U(p).name)));
  const close = modal('مجموعة جديدة', name, peers.length ? list : h('div', { class: 'empty' }, 'ابدأ محادثات فردية أولاً ثم أضفهم للمجموعة'),
    h('div', { class: 'notice warn' }, ico('lock', 18), 'المجموعات غير مشفّرة طرفاً لطرف في هذه النسخة (مشفّرة أثناء النقل فقط).'),
    h('button', { class: 'btn full', onclick: async () => { if (name.value.trim().length < 2 || !sel.size) return toast('اكتب اسماً واختر عضواً واحداً على الأقل'); const members = [S.uid, ...sel]; const r = await addDoc(collection(db, 'mx_chats'), { type: 'group', name: name.value.trim(), members, admins: [S.uid], created: Date.now() }); close(); S.chats.set(r.id, { id: r.id, type: 'group', name: name.value.trim(), members }); openChat(r.id); } }, 'إنشاء المجموعة'));
}
function prevText(c) {
  const l = c.last; if (!l) return 'ابدأ المحادثة';
  const K = { image: '📷 صورة', voice: '🎤 رسالة صوتية', file: '📎 ملف' }; if (l.kind !== 'text') return K[l.kind] || '';
  const k = c.id + ':' + l.ts; if (S.pv.has(k)) return S.pv.get(k); S.pv.set(k, '…');
  openBody(l.body, l.from === S.uid).then(p => S.pv.set(k, p?.text ?? ''), () => S.pv.set(k, '🔒 رسالة مشفّرة')).then(() => render());
  return '…';
}
function vChats() {
  const q = h('input', { placeholder: 'بحث في المحادثات', value: S.q, oninput: e => { S.q = e.target.value; paintChatList(); } });
  return h('div', {}, hdr('محادثات', null, h('button', { class: 'ib acc', onclick: newChatModal, 'aria-label': 'محادثة جديدة' }, ico('plus'))),
    h('div', { class: 'search' }, ico('search', 18), q), h('div', { id: 'clist' }, chatListItems()));
}
function paintChatList() { const l = $('#clist'); if (l) l.replaceChildren(...chatListItems()); }
function chatListItems() {
  const q = S.q.trim().toLowerCase();
  const arr = [...S.chats.values()].filter(c => c.last || c.type === 'group').filter(c => !q || chatName(c).toLowerCase().includes(q)).sort((a, b) => (b.last?.ts || b.created || 0) - (a.last?.ts || a.created || 0));
  if (!arr.length) return [h('div', { class: 'empty' }, q ? 'لا نتائج' : 'لا توجد محادثات بعد.\nاضغط + وابحث عن صديق بالاسم أو برمزه KLM-…')];
  return arr.map(c => {
    const peer = c.type === 'direct' ? U(peerOf(c)) : { name: c.name }, n = c.unread?.[S.uid] || 0;
    return h('div', { class: 'row', onclick: () => openChat(c.id) }, avatar(peer, 52, c.type === 'direct' && isOnline(peer)),
      h('div', { class: 'mid' }, h('div', { class: 'nm' }, h('span', {}, chatName(c)), h('small', {}, c.last ? fmtT(c.last.ts) : '')),
        h('div', { class: 'pv' }, h('span', {}, c.last?.from === S.uid ? ' ✓ ' : '', prevText(c)), n ? h('span', { class: 'pill' }, n) : null)));
  });
}

/* ───────── شاشة المحادثة ───────── */
let unsubMsgs, msgSeq = 0, typingT = 0, typingTimer;
function openChat(id, opts = {}) {
  const c = S.chats.get(id); if (!c) return; S.chat = c; S.reply = null; S.msgLimit = 60; S.msgs = [];
  const head = h('div', { class: 'chead' }); const msgs = h('div', { class: 'msgs wp-' + S.cfg.wp, id: 'msgs' });
  const comp = h('div', { id: 'comp' }); const rb = h('div', { id: 'replybar' });
  const el = h('div', {}, head, msgs, rb, comp);
  S.chatClose = makeLayer(el, '', () => { unsubMsgs && unsubMsgs(); unsubMsgs = null; S.chat = null; clearInterval(typingTimer); render(true); });
  paintHeader(); paintComposer(); subMsgs(); markRead();
  typingTimer = setInterval(paintHeader, 3000);
  if (opts.attach) setTimeout(() => attachMenu(), 300);
}
function paintHeader() {
  const head = $('.chead'); if (!head || !S.chat) return; const c = S.chat, direct = c.type === 'direct', p = direct ? U(peerOf(c)) : { name: c.name };
  let sub = '', on = false;
  if (direct) { const tp = c.typing?.[peerOf(c)]; if (tp && Date.now() - tp < 5000 && p.pv?.ty !== false) { sub = 'يكتب الآن…'; on = true; } else if (isOnline(p)) { sub = 'متصل الآن'; on = true; } else sub = p.pv?.ls === false ? '' : (p.ls ? 'آخر ظهور ' + ago(p.ls) : ''); }
  else sub = c.members.length + ' أعضاء';
  head.replaceChildren(h('button', { class: 'ib flat', onclick: () => S.chatClose(), 'aria-label': 'رجوع' }, ico('back')), avatar(p, 42, direct && isOnline(p)),
    h('div', { class: 'who', onclick: chatInfo }, h('b', {}, chatName(c)), h('small', { class: on ? 'on' : '' }, sub)),
    ...(direct ? [h('button', { class: 'ib flat', onclick: () => startCall(peerOf(c), false), 'aria-label': 'اتصال' }, ico('phone')), h('button', { class: 'ib flat', onclick: () => startCall(peerOf(c), true), 'aria-label': 'فيديو' }, ico('video'))] : []),
    h('button', { class: 'ib flat', onclick: chatInfo, 'aria-label': 'المزيد' }, ico('dots')));
}
async function chatInfo() {
  const c = S.chat, direct = c.type === 'direct'; const body = [];
  if (direct) {
    const pk = U(peerOf(c)).pk; let sn = '—'; if (pk && S.keys) sn = await safetyNumber(S.keys.pub, pk);
    body.push(h('div', { class: 'notice' }, ico('lock', 18), 'رسائل هذه المحادثة ونصوصها وصورها مشفّرة طرفاً لطرف على جهازيكما، ولا يستطيع الخادم قراءتها.'),
      h('div', { class: 'field' }, h('label', {}, 'رمز الأمان (قارنه مع صديقك وجهاً لوجه أو بمكالمة للتأكد أنه لا أحد يتنصّت)'), h('div', { dir: 'ltr', style: { fontFamily: 'monospace', fontSize: '18px', letterSpacing: '1px', textAlign: 'center', background: 'var(--panel)', padding: '12px', borderRadius: '14px' } }, sn)));
  } else {
    body.push(h('div', { class: 'notice warn' }, ico('lock', 18), 'المجموعات مشفّرة أثناء النقل فقط (غير طرف لطرف).'), h('h3', {}, 'الأعضاء'), ...c.members.map(m => h('div', { class: 'row', style: { padding: '8px 0' } }, avatar(U(m), 36), h('div', { class: 'mid' }, U(m).name))));
  }
  body.push(h('h3', {}, 'الرسائل ذاتية الاختفاء'), h('div', { class: 'sw-themes' }, TTLS.map(([t, v]) => h('button', { class: (c.ttl || 0) === v ? 'on' : '', onclick: async () => { await updateDoc(doc(db, 'mx_chats', c.id), { ttl: v }); toast(v ? 'تُحذف الرسائل الجديدة بعد ' + t : 'أُوقف الحذف التلقائي'); close(); } }, t))),
    h('small', { style: { color: 'var(--mut)', display: 'block', lineHeight: 1.6 } }, 'تختفي الرسائل من الشاشة عند انتهاء المدة، ويحذفها جهاز مرسلها عند فتحه للتطبيق.'));
  const close = modal(chatName(c), ...body);
}
function subMsgs() {
  const c = S.chat; const seq = ++msgSeq;
  unsubMsgs = onSnapshot(query(collection(db, 'mx_chats', c.id, 'msgs'), orderBy('ts', 'desc'), limit(S.msgLimit)), async snap => {
    const arr = snap.docs.map(d => { const x = d.data({ serverTimestamps: 'estimate' }); return { id: d.id, ...x, t: x.ts?.toMillis ? x.ts.toMillis() : Date.now(), pending: d.metadata.hasPendingWrites }; }).reverse();
    S.more = snap.size >= S.msgLimit;
    for (const m of arr) { if (m.exp && m.exp < Date.now() && m.from === S.uid) deleteDoc(doc(db, 'mx_chats', c.id, 'msgs', m.id)).catch(() => {}); const key = m.id + (m.deleted ? 'd' : ''); if (!S.msgCache.has(key) && !m.deleted) { try { S.msgCache.set(key, await openBody(m.body, m.from === S.uid)); } catch { S.msgCache.set(key, undefined); } } }
    if (seq !== msgSeq || S.chat?.id !== c.id) return;
    S.msgs = arr.filter(m => !(m.exp && m.exp < Date.now())); paintMsgs(); if (document.visibilityState === 'visible') markRead();
  }, e => toast('تعذّر تحميل الرسائل: ' + e.code));
}
function markRead() {
  const c = S.chat; if (!c) return; const upd = {};
  if ((c.unread?.[S.uid] || 0) > 0) upd['unread.' + S.uid] = 0;
  if (S.me.pv?.rr !== false && S.msgs.some(m => m.from !== S.uid && (c.reads?.[S.uid] || 0) < m.t)) upd['reads.' + S.uid] = Date.now();
  if (Object.keys(upd).length) updateDoc(doc(db, 'mx_chats', c.id), upd).catch(() => {});
}
function paintMsgs() {
  const box = $('#msgs'); if (!box) return; const c = S.chat, near = box.scrollHeight - box.scrollTop - box.clientHeight < 140 || !box.children.length;
  const out = []; let last = 0;
  if (S.more) out.push(h('button', { class: 'link', onclick: () => { S.msgLimit += 60; unsubMsgs(); subMsgs(); } }, 'تحميل رسائل أقدم'));
  out.push(h('div', { class: 'lock' }, ico('lock', 14), c.type === 'direct' ? 'الرسائل مشفّرة طرفاً لطرف. لا يستطيع أحد خارج هذه المحادثة قراءتها.' : 'محادثة جماعية — مشفّرة أثناء النقل فقط.'));
  for (const m of S.msgs) { if (!last || !sameDay(last, m.t)) out.push(h('div', { class: 'day' }, fmtD(m.t))); last = m.t; out.push(bubble(m, c)); }
  box.replaceChildren(...out); if (near) box.scrollTop = box.scrollHeight;
}
function bubble(m, c) {
  const mine = m.from === S.uid, p = S.msgCache.get(m.id + (m.deleted ? 'd' : '')); let content;
  if (m.deleted) content = '🚫 تم حذف هذه الرسالة';
  else if (!p) content = '🔒 تعذّر فك تشفير الرسالة (أُرسلت لمفتاح جهاز آخر)';
  else if (m.type === 'image') content = h('img', { class: 'pic', src: p.data, alt: 'صورة', onclick: () => viewImage(p.data) });
  else if (m.type === 'voice') content = h('audio', { controls: true, src: p.data, preload: 'metadata' });
  else if (m.type === 'file') content = h('a', { class: 'file', href: p.data, download: p.name || 'file' }, ico('file', 26), h('span', {}, p.name || 'ملف', h('br'), h('small', {}, Math.round((p.size || 0) / 1024) + ' ك.ب — اضغط للتنزيل')));
  else content = p.text;
  const rc = {}; Object.values(m.reactions || {}).forEach(e => rc[e] = (rc[e] || 0) + 1);
  const b = h('div', { class: 'bub' + (m.deleted ? ' del' : '') },
    !mine && c.type === 'group' ? h('span', { class: 'who' }, U(m.from).name) : null,
    m.reply ? h('div', { class: 'q' }, h('b', {}, m.reply.from === S.uid ? 'أنت' : U(m.reply.from).name), ' ', m.reply.prev) : null,
    content, h('div', { class: 'meta' }, m.exp ? '⏳' : null, fmtT(m.t), ticks(m, c)));
  b.onclick = () => msgMenu(m, p);
  return h('div', { class: 'mrow ' + (mine ? 'mine' : 'theirs') }, b, Object.keys(rc).length ? h('div', { class: 'reacts' }, Object.entries(rc).map(([e, n]) => h('span', {}, e + (n > 1 ? ' ' + n : '')))) : null);
}
function viewImage(src) { const el = h('div', { onclick: () => close(), style: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' } }, h('img', { src, style: { maxWidth: '100%', maxHeight: '100%' } })); const close = makeLayer(el, ''); el.style.zIndex = 55; }
function msgMenu(m, p) {
  if (m.deleted) return;
  const ref = doc(db, 'mx_chats', S.chat.id, 'msgs', m.id);
  const rr = h('div', { style: { display: 'flex', justifyContent: 'space-around', fontSize: '30px', padding: '4px 0 14px' } }, REACTS.map(e => h('button', { style: { fontSize: '30px' }, onclick: async () => { close(); const mine = m.reactions?.[S.uid] === e; await updateDoc(ref, { ['reactions.' + S.uid]: mine ? deleteField() : e }).catch(() => toast('تعذّر التفاعل')); } }, e)));
  const act = (icon, label, fn, cls = 'ghost') => h('button', { class: 'btn ' + cls + ' full', style: { marginBottom: '8px', justifyContent: 'flex-start' }, onclick: () => { close(); fn(); } }, ico(icon, 18), label);
  const prev = m.type === 'text' ? (p?.text || '').slice(0, 60) : ({ image: '📷 صورة', voice: '🎤 صوت', file: '📎 ملف' })[m.type];
  const close = modal('', rr, act('reply', 'رد', () => { S.reply = { id: m.id, from: m.from, prev: prev || '' }; paintReply(); $('#minput')?.focus(); }),
    m.type === 'text' && p ? act('copy', 'نسخ', () => navigator.clipboard?.writeText(p.text).then(() => toast('تم النسخ'))) : null,
    m.from === S.uid ? act('trash', 'حذف للجميع', async () => { await updateDoc(ref, { deleted: true, body: deleteField(), reactions: deleteField() }).catch(() => toast('تعذّر الحذف')); }, 'red') : null);
}
function paintReply() { const r = $('#replybar'); if (!r) return; r.replaceChildren(...(S.reply ? [h('div', { class: 'replybar', style: { padding: 0, border: 0, width: '100%' } }, ico('reply', 16), h('span', {}, 'رد على ', h('b', {}, S.reply.from === S.uid ? 'نفسك' : U(S.reply.from).name), ': ', S.reply.prev), h('button', { onclick: () => { S.reply = null; paintReply(); } }, ico('x', 18)))] : [])); r.className = S.reply ? 'replybar' : ''; }
let rec = null;
function paintComposer() {
  const comp = $('#comp'); if (!comp) return;
  const ta = h('textarea', { id: 'minput', rows: 1, placeholder: 'اكتب رسالتك…', oninput: () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; toggle(); sendTyping(); } });
  ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); doSend(); } };
  const sendBtn = h('button', { class: 'ib acc', onclick: doSend, 'aria-label': 'إرسال' }, ico('send'));
  const micBtn = h('button', { class: 'ib acc', onclick: recStart, 'aria-label': 'تسجيل صوتي' }, ico('mic'));
  const slot = h('span', {}, micBtn); const toggle = () => slot.replaceChildren(ta.value.trim() ? sendBtn : micBtn);
  async function doSend() { const t = ta.value.trim(); if (!t) return; ta.value = ''; ta.style.height = 'auto'; toggle(); await sendMsg('text', { text: t }); }
  comp.replaceChildren(h('div', { class: 'composer', id: 'compin' }, h('button', { class: 'ib flat', onclick: emojiMenu, 'aria-label': 'رموز' }, ico('smile')), h('button', { class: 'ib flat', onclick: attachMenu, 'aria-label': 'إرفاق' }, ico('clip')), ta, slot));
}
function sendTyping() { const c = S.chat; if (!c || S.me.pv?.ty === false || Date.now() - typingT < 2500) return; typingT = Date.now(); updateDoc(doc(db, 'mx_chats', c.id), { ['typing.' + S.uid]: Date.now() }).catch(() => {}); }
function emojiMenu() { const close = modal('', h('div', { class: 'emojis' }, EMOJI.map(e => h('button', { onclick: () => { const t = $('#minput'); if (t) { t.value += e; t.dispatchEvent(new Event('input')); } close(); } }, e)))); }
function attachMenu() {
  const close = modal('إرفاق', h('button', { class: 'btn ghost full', style: { marginBottom: '8px' }, onclick: async () => { close(); const f = await pick('image/*'); if (!f) return; const d = await shrink(f, 1280, .72, 420000); if (!d) return toast('الصورة كبيرة جداً'); sendMsg('image', { data: d }); } }, '📷 صورة'),
    h('button', { class: 'btn ghost full', onclick: async () => { close(); const f = await pick('*/*'); if (!f) return; if (f.size > 300 * 1024) return toast('الحد الأقصى للملف 300 ك.ب (الخطة المجانية بلا تخزين ملفات)'); sendMsg('file', { data: await readURL(f), name: f.name, size: f.size }); } }, '📎 ملف (حتى 300 ك.ب)'));
}
async function recStart() {
  let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast('لا توجد صلاحية الميكروفون'); }
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  let mr; try { mr = new MediaRecorder(st, { mimeType: mime, audioBitsPerSecond: 24000 }); } catch { st.getTracks().forEach(t => t.stop()); return toast('المتصفح لا يدعم التسجيل'); }
  const chunks = []; let cancel = false, t0 = Date.now(); mr.ondataavailable = e => chunks.push(e.data); mr.start();
  const timer = h('span', {}, '0:00'); const iv = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); timer.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (s >= 60) stop(); }, 500);
  const stop = () => { clearInterval(iv); mr.stop(); };
  mr.onstop = async () => { st.getTracks().forEach(t => t.stop()); paintComposer(); if (cancel) return; const blob = new Blob(chunks, { type: mr.mimeType }), d = await readURL(blob); if (d.length > 600000) return toast('التسجيل طويل جداً'); sendMsg('voice', { data: d, dur: Math.round((Date.now() - t0) / 1000) }); };
  $('#comp').replaceChildren(h('div', { class: 'composer' }, h('button', { class: 'ib flat', onclick: () => { cancel = true; stop(); } }, ico('trash')), h('div', { class: 'recbar' }, timer, 'جارٍ التسجيل…'), h('button', { class: 'ib acc', onclick: stop }, ico('send'))));
}
async function sendMsg(kind, payload) {
  const c = S.chat; if (!c) return;
  try {
    const body = await sealFor(c, JSON.stringify(payload)); const msg = { from: S.uid, ts: serverTimestamp(), type: kind, body };
    if (S.reply) msg.reply = S.reply; if (c.ttl) msg.exp = Date.now() + c.ttl * 1000; S.reply = null; paintReply();
    const last = { from: S.uid, ts: Date.now(), kind }; if (kind === 'text') last.body = await sealFor(c, JSON.stringify({ text: payload.text.slice(0, 80) }));
    const upd = { last, ['typing.' + S.uid]: 0 }; c.members.filter(x => x !== S.uid).forEach(o => upd['unread.' + o] = increment(1));
    await addDoc(collection(db, 'mx_chats', c.id, 'msgs'), msg); await updateDoc(doc(db, 'mx_chats', c.id), upd); beep([660], .08);
  } catch (e) { toast(e.message === 'no-key' ? 'هذا المستخدم لم يفتح كلمات ماسنجر بعد، لا يمكن تشفير الرسالة له' : 'تعذّر الإرسال: ' + (e.code || e.message)); }
}

/* ───────── الحالات ───────── */
function watchStatuses() {
  const peers = [...new Set([...S.chats.values()].filter(c => c.type === 'direct').map(peerOf))]; const key = peers.sort().join(',');
  if (key === S.stKey) return; S.stKey = key; S.stUnsubs.forEach(f => f()); S.stUnsubs = [];
  const groups = [[S.uid]]; for (let i = 0; i < peers.length; i += 10) groups.push(peers.slice(i, i + 10));
  groups.forEach(g => S.stUnsubs.push(onSnapshot(query(collection(db, 'mx_status'), where('uid', 'in', g)), snap => {
    snap.docChanges().forEach(ch => { if (ch.type === 'removed') S.st.delete(ch.doc.id); else S.st.set(ch.doc.id, { id: ch.doc.id, ...ch.doc.data() }); });
    S.st.forEach((s, id) => { if (s.exp < Date.now()) { S.st.delete(id); if (s.uid === S.uid) deleteDoc(doc(db, 'mx_status', id)).catch(() => {}); } }); render();
  }, () => {})));
}
const stByUser = () => { const m = new Map(); [...S.st.values()].filter(s => s.exp > Date.now()).sort((a, b) => a.ts - b.ts).forEach(s => { if (!m.has(s.uid)) m.set(s.uid, []); m.get(s.uid).push(s); }); return m; };
const unseenSt = () => [...stByUser()].filter(([u, l]) => u !== S.uid && l.some(s => !(s.views || []).includes(S.uid))).length;
function vStatus() {
  const g = stByUser(); const others = [...g].filter(([u]) => u !== S.uid).sort((a, b) => b[1].at(-1).ts - a[1].at(-1).ts), mine = g.get(S.uid), nu = unseenSt();
  const card = (uid, list) => { const u = U(uid), s = list.at(-1); return h('button', { class: 'stcard', style: { background: s.kind === 'image' ? `linear-gradient(transparent 40%,rgba(0,0,0,.7)),url(${s.img}) center/cover` : s.bg }, onclick: () => viewStatus(uid) }, h('div', { class: 'top' }, h('span', {}, ago(s.ts)), avatar(u, 34, false, 'ring')), h('p', {}, s.kind === 'text' ? s.text : (s.text || '📷')), h('b', {}, uid === S.uid ? 'حالتي' : u.name)); };
  return h('div', {}, hdr('الحالات', 'تختفي بعد 24 ساعة', nu ? h('span', { class: 'pill', style: { background: 'var(--panel2)', color: 'var(--acc)', height: '30px', padding: '0 12px', borderRadius: '10px' } }, nu + ' حالات جديدة') : null),
    h('div', { class: 'stcards' }, h('button', { class: 'stcard add', onclick: addStatus }, h('span', { class: 'ib acc' }, ico('plus')), h('b', {}, 'إضافة حالة'), h('small', { style: { color: 'var(--mut)' } }, 'شارك يومياتك')), mine ? card(S.uid, mine) : null, others.map(([u, l]) => card(u, l))),
    h('div', { class: 'hd', style: { paddingTop: 0 } }, h('div', { style: { color: 'var(--mut)', fontWeight: 700 } }, 'آخر تحديثات جهات الاتصال')),
    others.length ? others.map(([uid, l]) => { const seen = l.every(s => (s.views || []).includes(S.uid)); return h('div', { class: 'row', onclick: () => viewStatus(uid) }, avatar(U(uid), 54, false, 'ring' + (seen ? ' seen' : '')), h('div', { class: 'mid' }, h('div', { class: 'nm' }, U(uid).name), h('div', { class: 'pv' }, h('span', {}, ago(l.at(-1).ts)))), h('span', { style: { color: 'var(--acc)', fontSize: '14px' } }, 'عرض الحالة')); }) : h('div', { class: 'empty' }, 'لا توجد حالات من جهات اتصالك الآن'));
}
function addStatus() {
  let kind = 'text', bg = BGS[0], img = null; const ta = h('textarea', { rows: 4, maxlength: 200, placeholder: 'ماذا يدور في بالك؟', style: { background: BGS[0], color: '#fff', fontSize: '20px', textAlign: 'center', borderRadius: '18px', border: 0 } });
  const bgs = h('div', { class: 'bgs' }, BGS.map((b, i) => h('button', { class: i ? '' : 'on', style: { background: b }, onclick: e => { bg = b; ta.style.background = b; bgs.querySelectorAll('button').forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); } })));
  const prev = h('div', {}); const photo = h('button', { class: 'btn ghost full', style: { marginTop: '8px' }, onclick: async () => { const f = await pick('image/*'); if (!f) return; img = await shrink(f, 900, .7, 380000); if (!img) return toast('الصورة كبيرة'); kind = 'image'; prev.replaceChildren(h('img', { src: img, style: { width: '100%', borderRadius: '14px', marginTop: '8px' } })); ta.placeholder = 'أضف تعليقاً (اختياري)'; ta.style.cssText = 'margin-top:8px'; bgs.hidden = true; } }, '📷 أو اختر صورة');
  const close = modal('حالة جديدة', ta, bgs, photo, prev, h('button', { class: 'btn full', style: { marginTop: '12px' }, onclick: async () => { const text = ta.value.trim(); if (kind === 'text' && !text) return toast('اكتب نصاً أو اختر صورة'); await addDoc(collection(db, 'mx_status'), { uid: S.uid, ts: Date.now(), exp: Date.now() + 864e5, kind, text, bg, img: img || '', views: [] }).catch(e => toast('تعذّر النشر: ' + e.code)); close(); } }, 'نشر'));
}
function viewStatus(uid) {
  const list = stByUser().get(uid); if (!list) return; let i = 0, tm;
  const bars = h('div', { class: 'bars' }, list.map(() => h('i', {}, h('b')))); const body = h('div', { class: 'body' }); const foot = h('div', { style: { padding: '10px 16px calc(14px + env(safe-area-inset-bottom))', textAlign: 'center', color: '#fff', minHeight: '24px' } });
  const el = h('div', {}, bars, h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 14px', color: '#fff' } }, avatar(U(uid), 36), h('b', { style: { flex: 1 } }, uid === S.uid ? 'حالتي' : U(uid).name), h('button', { style: { color: '#fff' }, onclick: () => close() }, ico('x'))), body, foot);
  const close = makeLayer(el, 'sview', () => clearTimeout(tm)); el.style.zIndex = 50;
  const show = () => { clearTimeout(tm); if (i >= list.length) return close(); const s = list[i]; bars.querySelectorAll('i').forEach((x, k) => { const b = x.firstChild; b.style.transition = 'none'; b.style.width = k < i ? '100%' : '0'; });
    requestAnimationFrame(() => requestAnimationFrame(() => { const b = bars.children[i].firstChild; b.style.transition = 'width 5s linear'; b.style.width = '100%'; }));
    body.style.background = s.kind === 'text' ? s.bg : '#000'; body.replaceChildren(s.kind === 'image' ? h('img', { src: s.img }) : s.text); if (s.kind === 'image' && s.text) body.append(h('div', { style: { position: 'absolute', bottom: '90px', fontSize: '18px', textShadow: '0 2px 8px #000' } }, s.text));
    foot.replaceChildren(uid === S.uid ? h('span', {}, ico('eye', 18), ' ', (s.views || []).length + ' مشاهدة') : '', uid === S.uid ? h('button', { style: { color: '#fff', marginInlineStart: '20px' }, onclick: async () => { await deleteDoc(doc(db, 'mx_status', s.id)); S.st.delete(s.id); close(); render(); } }, ico('trash', 18)) : '');
    if (uid !== S.uid && !(s.views || []).includes(S.uid) && S.me.pv?.rr !== false) updateDoc(doc(db, 'mx_status', s.id), { views: arrayUnion(S.uid) }).catch(() => {});
    tm = setTimeout(() => { i++; show(); }, 5000); };
  body.onclick = () => { i++; show(); }; show();
}

/* ───────── المكالمات ───────── */
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
let CALL = null, ringT = null, inc = null;
function onCalls(snap) {
  snap.docChanges().forEach(ch => { const d = { id: ch.doc.id, ...ch.doc.data() }; if (ch.type === 'removed') { S.calls = S.calls.filter(x => x.id !== d.id); return; } const i = S.calls.findIndex(x => x.id === d.id); if (i >= 0) S.calls[i] = d; else S.calls.push(d);
    if (d.to === S.uid && d.state === 'ringing' && Date.now() - d.ts < 45000 && !CALL && !inc) showIncoming(d);
    if (inc && inc.id === d.id && d.state !== 'ringing') inc.close(); });
  render();
}
function newPC(stream, ref, role) {
  const pc = new RTCPeerConnection(ICE); stream.getTracks().forEach(t => pc.addTrack(t, stream)); const pending = [];
  pc.ontrack = e => { const v = $('video.rem'); if (v) { v.srcObject = e.streams[0]; v.play().catch(() => {}); } };
  pc.onicecandidate = e => { if (e.candidate) addDoc(collection(ref, role), e.candidate.toJSON()).catch(() => {}); };
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' && CALL) { toast('انقطع الاتصال'); endCall(true, 'ended'); } };
  pc.addCand = c => pc.remoteDescription ? pc.addIceCandidate(c).catch(() => {}) : pending.push(c); pc.flush = () => { pending.splice(0).forEach(c => pc.addIceCandidate(c).catch(() => {})); };
  return pc;
}
async function getMedia(video) { try { return await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: 'user' } : false }); } catch { toast('لا توجد صلاحية الميكروفون/الكاميرا'); return null; } }
function callUI(peer, video, status) {
  const rem = h('video', { class: 'rem', autoplay: true, playsinline: true }), loc = h('video', { class: 'loc', autoplay: true, playsinline: true, muted: true }); loc.muted = true; if (!video) loc.style.display = 'none';
  const st = h('div', { id: 'callst', style: { opacity: .85 } }, status); const u = U(peer);
  const el = h('div', {}, video ? rem : h('div', { style: { display: 'none' } }, rem), loc, h('div', { class: 'info' }, avatar(u, 110), h('h2', { style: { margin: '14px 0 4px' } }, u.name), st),
    h('div', { class: 'ctl' }, h('button', { id: 'bmute', onclick: e => { const t = CALL.stream.getAudioTracks()[0]; t.enabled = !t.enabled; e.currentTarget.classList.toggle('off', !t.enabled); } }, ico('mutemic')),
      video ? h('button', { onclick: e => { const t = CALL.stream.getVideoTracks()[0]; t.enabled = !t.enabled; e.currentTarget.classList.toggle('off', !t.enabled); } }, ico('camoff')) : null,
      h('button', { class: 'end', onclick: () => endCall(true, CALL?.t0 ? 'ended' : 'missed') }, ico('phone'))));
  CALL.close = makeLayer(el, 'callui'); el.style.zIndex = 60; loc.srcObject = CALL.stream; if (!video) { document.body.append(rem); rem.style.display = 'none'; CALL.remEl = rem; }
}
async function startCall(peer, video) {
  if (CALL) return toast('أنت في مكالمة حالياً'); if (!window.RTCPeerConnection) return toast('المتصفح لا يدعم المكالمات');
  const stream = await getMedia(video); if (!stream) return; const ref = doc(collection(db, 'mx_calls'));
  CALL = { stream, ref, role: 'caller', peer, video, unsubs: [] }; callUI(peer, video, 'جارٍ الاتصال…');
  const pc = CALL.pc = newPC(stream, ref, 'caller');
  try {
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    await setDoc(ref, { from: S.uid, to: peer, parts: [S.uid, peer], type: video ? 'video' : 'audio', state: 'ringing', offer: { type: offer.type, sdp: offer.sdp }, ts: Date.now() });
  } catch (e) { toast('تعذّر بدء المكالمة'); return endCall(false); }
  CALL.unsubs.push(onSnapshot(ref, async s => { const d = s.data(); if (!d || !CALL) return;
    if (d.answer && !pc.currentRemoteDescription) { await pc.setRemoteDescription(d.answer); pc.flush(); }
    if (d.state === 'active' && !CALL.t0) callActive();
    if (['ended', 'declined', 'missed'].includes(d.state)) { toast(d.state === 'declined' ? 'رفض المكالمة' : d.state === 'missed' ? 'لم يرد' : 'انتهت المكالمة'); endCall(false); } }));
  CALL.unsubs.push(onSnapshot(collection(ref, 'callee'), s => s.docChanges().forEach(c => c.type === 'added' && pc.addCand(c.doc.data()))));
  CALL.ring = setTimeout(() => { if (CALL && !CALL.t0) endCall(true, 'missed'); }, 45000);
}
function callActive() { CALL.t0 = Date.now(); clearTimeout(CALL.ring); const st = $('#callst'); CALL.iv = setInterval(() => { const s = Math.floor((Date.now() - CALL.t0) / 1000); if (st) st.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500); }
function showIncoming(d) {
  const u = U(d.from); ringT = setInterval(() => beep([700, 900, 700], .18), 1800); beep([700, 900, 700], .18);
  const el = h('div', {}, avatar(u, 110), h('h2', {}, u.name), h('div', {}, d.type === 'video' ? 'مكالمة فيديو واردة…' : 'مكالمة صوتية واردة…'),
    h('div', { class: 'ctl' }, h('button', { class: 'no', onclick: () => { updateDoc(doc(db, 'mx_calls', d.id), { state: 'declined' }); close(); } }, ico('phone')), h('button', { class: 'yes', onclick: () => { close(); acceptCall(d); } }, ico('phone'))));
  const close = makeLayer(el, 'callui', () => { clearInterval(ringT); inc = null; }); el.style.zIndex = 60; inc = { id: d.id, close };
}
async function acceptCall(d) {
  const video = d.type === 'video'; const stream = await getMedia(video); if (!stream) { updateDoc(doc(db, 'mx_calls', d.id), { state: 'declined' }); return; }
  const ref = doc(db, 'mx_calls', d.id); CALL = { stream, ref, role: 'callee', peer: d.from, video, unsubs: [] }; callUI(d.from, video, 'جارٍ التوصيل…');
  const pc = CALL.pc = newPC(stream, ref, 'callee');
  try { await pc.setRemoteDescription(d.offer); pc.flush(); const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); await updateDoc(ref, { answer: { type: ans.type, sdp: ans.sdp }, state: 'active' }); } catch { toast('تعذّر قبول المكالمة'); return endCall(true, 'ended'); }
  callActive();
  CALL.unsubs.push(onSnapshot(collection(ref, 'caller'), s => s.docChanges().forEach(c => c.type === 'added' && pc.addCand(c.doc.data()))));
  CALL.unsubs.push(onSnapshot(ref, s => { const x = s.data(); if (x && ['ended', 'missed'].includes(x.state)) { toast('انتهت المكالمة'); endCall(false); } }));
}
function endCall(notifyPeer, state = 'ended') {
  const c = CALL; if (!c) return; CALL = null; clearTimeout(c.ring); clearInterval(c.iv); c.unsubs.forEach(f => f());
  if (notifyPeer) updateDoc(c.ref, { state, dur: c.t0 ? Math.round((Date.now() - c.t0) / 1000) : 0 }).catch(() => {});
  try { c.stream.getTracks().forEach(t => t.stop()); c.pc.close(); } catch {} c.remEl && c.remEl.remove(); c.close && c.close();
}
function vCalls() {
  S.cfg.callsSeen = Date.now(); try { localStorage.setItem('kmx-cfg', JSON.stringify(S.cfg)); } catch {}
  const list = [...S.calls].sort((a, b) => b.ts - a.ts).slice(0, 60);
  return h('div', {}, hdr('سجل المكالمات', 'صوتية ومرئية عبر WebRTC', h('button', { class: 'btn', onclick: callPicker }, ico('plus', 18), 'جديدة')),
    h('div', { class: 'notice', style: { margin: '0 16px 8px' } }, ico('lock', 18), 'المكالمات مشفّرة أثناء النقل (DTLS-SRTP) وتتصل مباشرة بين الجهازين.'),
    list.length ? list.map(c => { const out = c.from === S.uid, peer = out ? c.to : c.from, missed = !out && c.state === 'missed', u = U(peer); watchUser(peer);
      return h('div', { class: 'row' }, avatar(u, 50), h('div', { class: 'mid' }, h('div', { class: 'nm', style: { color: missed ? 'var(--bad)' : '' } }, u.name), h('div', { class: 'pv' }, h('span', {}, (out ? '↗ ' : '↙ ') + (missed ? 'لم يُرد عليها' : c.state === 'declined' ? 'مرفوضة' : c.dur ? Math.floor(c.dur / 60) + ':' + String(c.dur % 60).padStart(2, '0') + ' د' : out ? 'صادرة' : 'واردة'), ' · ' + fmtT(c.ts) + ' ' + (sameDay(c.ts, Date.now()) ? 'اليوم' : fmtD(c.ts))))),
        h('button', { class: 'ib flat', onclick: () => startCall(peer, false) }, ico('phone', 20)), h('button', { class: 'ib flat', onclick: () => startCall(peer, true) }, ico('video', 20))); })
      : h('div', { class: 'empty' }, 'لا توجد مكالمات بعد'));
}
function callPicker() {
  const peers = [...S.chats.values()].filter(c => c.type === 'direct').map(peerOf);
  const close = modal('اتصال بـ…', peers.length ? peers.map(p => h('div', { class: 'row', style: { padding: '8px 0' } }, avatar(U(p), 42), h('div', { class: 'mid' }, U(p).name), h('button', { class: 'ib flat', onclick: () => { close(); startCall(p, false); } }, ico('phone', 20)), h('button', { class: 'ib flat', onclick: () => { close(); startCall(p, true); } }, ico('video', 20)))) : h('div', { class: 'empty' }, 'ابدأ محادثة مع شخص أولاً'));
}

/* ───────── الرادار ───────── */
function vRadar() {
  const peers = [...new Set([...S.chats.values()].filter(c => c.type === 'direct').map(peerOf))].map(p => [p, U(p)]), on = peers.filter(([, u]) => isOnline(u));
  const pts = on.slice(0, 8).map(([p, u]) => { const a = (hash(p) % 360) * Math.PI / 180, r = 22 + (hash(p + 'r') % 22); return h('div', { class: 'pt', style: { left: 50 + r * Math.cos(a) + '%', top: 50 + r * Math.sin(a) + '%' } }, avatar(u, 34, true)); });
  const inp = h('input', { placeholder: 'ابحث عن شخص بالاسم أو الرمز KLM-…' }); const out = h('div', {}); let t;
  inp.oninput = () => { clearTimeout(t); t = setTimeout(async () => { const q = inp.value.trim(); out.replaceChildren(); if (q.length < 2) return; try { const m = new Map(); if (/^klm-/i.test(q)) (await getDocs(query(collection(db, 'mx_users'), where('code', '==', q.toUpperCase())))).forEach(d => m.set(d.id, d.data())); else { const k = q.toLowerCase(); (await getDocs(query(collection(db, 'mx_users'), where('sk', '>=', k), where('sk', '<=', k + ''), limit(10)))).forEach(d => d.data().pv?.dc !== false && m.set(d.id, d.data())); } m.delete(S.uid); if (!m.size) out.append(h('div', { class: 'empty' }, 'لا نتائج')); m.forEach((u, id) => { S.users.set(id, u); out.append(h('div', { class: 'row', onclick: () => startDirect(id) }, avatar(u, 44), h('div', { class: 'mid' }, h('div', { class: 'nm' }, u.name), h('div', { class: 'pv' }, h('span', {}, u.bio || ''))), h('span', { class: 'btn', style: { padding: '8px 14px' } }, 'محادثة'))); }); } catch { out.append(h('div', { class: 'empty' }, 'تعذّر البحث')); } }, 300); };
  return h('div', {}, hdr('الرادار', 'المتصلون الآن من جهات اتصالك', h('span', { class: 'pill', style: { background: 'var(--panel2)', color: 'var(--acc)', height: '30px', padding: '0 12px', borderRadius: '10px' } }, on.length + ' متصل')),
    h('div', { class: 'radar' }, h('div', { class: 'sweep' }), h('div', { class: 'me' }, 'أنت'), pts),
    h('div', { class: 'hd', style: { paddingTop: 0 } }, h('div', { style: { color: 'var(--mut)', fontWeight: 700 } }, 'المتصلون الآن')),
    on.length ? on.map(([p, u]) => { const id = [S.uid, p].sort().join('_'); return h('div', { class: 'row' }, avatar(u, 48, true), h('div', { class: 'mid' }, h('div', { class: 'nm' }, u.name), h('div', { class: 'pv' }, h('span', {}, u.bio || ''))),
      h('button', { class: 'btn', style: { padding: '9px 14px' }, onclick: () => { openChat(id, { attach: true }); } }, 'إرسال ملف'), h('button', { class: 'ib flat', onclick: () => startCall(p, false) }, ico('phone', 20))); }) : h('div', { class: 'empty' }, 'لا أحد متصل من جهات اتصالك الآن'),
    h('div', { class: 'hd', style: { paddingTop: 8 } }, h('div', { style: { color: 'var(--mut)', fontWeight: 700 } }, 'اكتشف أشخاصاً')), h('div', { class: 'search' }, ico('search', 18), inp), out,
    h('div', { class: 'notice warn', style: { margin: '14px 16px' } }, 'الرادار يعتمد على الإنترنت، وليس Wi-Fi Direct. المتصفح لا يسمح بمشاركة الملفات القريبة بلا إنترنت.'));
}

/* ───────── الإعدادات ───────── */
function vSettings() {
  const u = S.me, user = auth.currentUser; const name = h('input', { value: u.name, maxlength: 40 }), bio = h('input', { value: u.bio || '', maxlength: 80 });
  const av = h('div', { style: { position: 'relative', cursor: 'pointer' }, onclick: async () => { const f = await pick('image/*'); if (!f) return; const d = await shrink(f, 256, .8, 40000); if (!d) return toast('الصورة كبيرة'); await updateDoc(doc(db, 'mx_users', S.uid), { av: d }); toast('تم تحديث الصورة'); render(true); } }, avatar(u, 84), h('span', { class: 'ib acc', style: { position: 'absolute', bottom: '-4px', insetInlineEnd: '-4px', width: '30px', height: '30px', borderRadius: '50%' } }, ico('plus', 16)));
  const pv = (k, t, d) => sw(t, d, u.pv?.[k] !== false, v => updateDoc(doc(db, 'mx_users', S.uid), { ['pv.' + k]: v }));
  const themes = [['indigo', 'نيلي سيراني', '#2563ff'], ['ocean', 'محيط سماوي', '#0ea5e9'], ['emerald', 'ماتريكس زمردي', '#10b981'], ['violet', 'بنفسجي ملكي', '#a855f7'], ['sunset', 'غروب', '#f97316']];
  const reRender = () => { saveCfg(); render(true); };
  return h('div', {}, hdr('الإعدادات', 'كلمات ماسنجر v1.0'),
    h('div', { class: 'card' }, h('h3', {}, 'الحساب'),
      h('div', { class: 'set' }, h('div', { class: 't' }, h('b', {}, 'البريد الإلكتروني'), h('small', { dir: 'ltr', style: { textAlign: 'start' } }, user?.email)), h('span', { class: 'pill', style: { background: 'var(--ok)' } }, 'موثّق ✓')),
      h('div', { class: 'set', onclick: () => navigator.clipboard?.writeText(u.code).then(() => toast('تم نسخ الرمز')) }, h('div', { class: 't' }, h('b', {}, 'رمزك للأصدقاء'), h('small', {}, 'شاركه ليجدك أصدقاؤك')), h('b', { dir: 'ltr', style: { color: 'var(--acc)' } }, u.code), ico('copy', 18)),
      h('div', { class: 'set' }, h('button', { class: 'btn ghost', onclick: () => signOut(auth) }, 'تسجيل الخروج'))),
    h('div', { class: 'card' }, h('h3', {}, 'الملف الشخصي'), h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', padding: '8px 0' } }, av, h('div', { style: { flex: 1 } }, h('div', { class: 'field', style: { margin: 0 } }, h('label', {}, 'اسم العرض'), name), h('div', { class: 'field' }, h('label', {}, 'النبذة'), bio))),
      h('div', { class: 'set' }, h('button', { class: 'btn full', onclick: async () => { const n = name.value.trim(); if (n.length < 2) return toast('الاسم قصير'); await updateDoc(doc(db, 'mx_users', S.uid), { name: n, sk: n.toLowerCase(), bio: bio.value.trim() }); toast('تم الحفظ'); } }, 'حفظ الملف الشخصي'))),
    h('div', { class: 'card' }, h('h3', {}, 'الخصوصية والأمان'),
      pv('rr', 'تأكيد القراءة (✓✓ الزرقاء)', 'إن أوقفتها لن ترى تأكيد قراءة الآخرين أيضاً'), pv('ty', 'مؤشر "يكتب الآن…"', null), pv('ls', 'آخر ظهور وحالة الاتصال', null), pv('dc', 'الظهور في نتائج البحث', 'يبقى بإمكان من يعرف رمزك العثور عليك'),
      sw('قفل التطبيق برقم سري', 'يُطلب الرقم عند فتح التطبيق بعد غيابه دقيقة', !!S.cfg.pin, async v => { if (!v) { S.cfg.pin = null; return reRender(); } const p = prompt('اختر رقماً سرياً من 4 أرقام أو أكثر'); if (!p || p.length < 4) { toast('رقم قصير'); return render(true); } S.cfg.pin = await sha(p); reRender(); }),
      h('div', { class: 'notice' }, ico('lock', 18), 'المحادثات الفردية مشفّرة طرفاً لطرف (ECDH P-256 + AES-GCM). مفاتيحك تُحفظ على هذا الجهاز فقط؛ إن سجّلت من جهاز آخر لن تقرأ رسائلك القديمة.')),
    h('div', { class: 'card' }, h('h3', {}, 'الإشعارات والأصوات'),
      sw('أصوات التطبيق', null, S.cfg.sound, v => { S.cfg.sound = v; saveCfg(); }),
      sw('فقاعة المحادثات العائمة', 'تظهر عليها عدد الرسائل غير المقروءة', S.cfg.heads, v => { S.cfg.heads = v; saveCfg(); setupHeads(); }),
      'Notification' in window ? sw('إشعارات المتصفح', 'تعمل والتطبيق مفتوح في الخلفية (بدون إشعارات دفع)', S.cfg.notif && Notification.permission === 'granted', async v => { if (v) { const r = await Notification.requestPermission(); S.cfg.notif = r === 'granted'; if (!S.cfg.notif) { toast('لم تُمنح الصلاحية'); render(true); } } else S.cfg.notif = false; saveCfg(); }) : null),
    h('div', { class: 'card' }, h('h3', {}, 'المظهر'),
      sw('الوضع الداكن', null, S.cfg.mode === 'dark', v => { S.cfg.mode = v ? 'dark' : 'light'; reRender(); }),
      h('div', { class: 'sw-themes' }, themes.map(([k, t, c]) => h('button', { class: S.cfg.theme === k ? 'on' : '', onclick: () => { S.cfg.theme = k; reRender(); } }, h('b', { style: { background: c } }), t))),
      h('div', { class: 'set', style: { flexDirection: 'column', alignItems: 'stretch' } }, h('b', {}, 'خلفية المحادثة'), h('div', { class: 'sw-themes' }, [['dots', 'نقاط'], ['plain', 'سادة'], ['grad', 'تدرّج']].map(([k, t]) => h('button', { class: S.cfg.wp === k ? 'on' : '', onclick: () => { S.cfg.wp = k; reRender(); } }, t))))),
    h('div', { class: 'card' }, h('h3', {}, 'التطبيق'),
      deferredInstall ? h('div', { class: 'set' }, h('button', { class: 'btn full', onclick: async () => { deferredInstall.prompt(); deferredInstall = null; render(true); } }, ico('down', 18), 'تثبيت التطبيق على الشاشة الرئيسية')) : null,
      h('div', { class: 'set' }, h('div', { class: 't' }, h('b', {}, 'مسح الذاكرة المؤقتة'), h('small', {}, 'لا يحذف حسابك ولا مفاتيح التشفير')), h('button', { class: 'btn ghost', onclick: async () => { S.msgCache.clear(); S.pv.clear(); if (window.caches) for (const k of await caches.keys()) await caches.delete(k); toast('تم المسح'); } }, 'مسح')),
      h('div', { class: 'notice warn' }, 'تنبيه: لا تمسح بيانات الموقع من إعدادات المتصفح، فهذا يحذف مفاتيح التشفير وتصبح رسائلك القديمة غير مقروءة.')));
}
const sha = async s => b64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kmx:' + s))));
let deferredInstall; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });

/* ───────── قفل التطبيق ───────── */
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (S.cfg.pin && Date.now() - hiddenAt > 60e3) lockCheck(true); });
function lockCheck(force) {
  if (!S.cfg.pin || !force || $('.lockscr')) return; const inp = h('input', { class: 'pin', type: 'password', inputmode: 'numeric', placeholder: '••••' }), err = h('div', { class: 'err' });
  const el = h('div', {}, h('img', { src: 'icon-192.png', style: { width: '80px', borderRadius: '20px' } }), h('h2', {}, 'كلمات مقفل'), inp, err, h('button', { class: 'btn', onclick: async () => { if (await sha(inp.value) === S.cfg.pin) { el.remove(); } else { err.textContent = 'رقم خاطئ'; inp.value = ''; } } }, 'فتح'));
  el.className = 'layer lockscr'; document.body.append(el); setTimeout(() => inp.focus(), 100);
}

/* ───────── الفقاعة العائمة ───────── */
function setupHeads() {
  const b = $('#heads'); b.replaceChildren(ico('chat', 26), h('span', { class: 'badge', hidden: true })); let mv = false, sx, sy, ox, oy;
  b.onpointerdown = e => { mv = false; sx = e.clientX; sy = e.clientY; const r = b.getBoundingClientRect(); ox = r.left; oy = r.top; b.setPointerCapture(e.pointerId); };
  b.onpointermove = e => { if (!b.hasPointerCapture(e.pointerId)) return; if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 8) mv = true; if (mv) { b.style.insetInlineStart = 'auto'; b.style.left = Math.max(0, Math.min(innerWidth - 56, ox + e.clientX - sx)) + 'px'; b.style.top = Math.max(0, Math.min(innerHeight - 56, oy + e.clientY - sy)) + 'px'; b.style.bottom = 'auto'; } };
  b.onpointerup = () => { if (!mv) { closeAllLayers(); S.tab = 'chats'; render(true); } };
}

/* ───────── العرض العام ───────── */
const TABS = [['chats', 'محادثات', 'chat'], ['status', 'الحالات', 'status'], ['calls', 'المكالمات', 'phone'], ['radar', 'الرادار', 'radar'], ['settings', 'الإعدادات', 'gear']];
function renderNav() {
  const un = unreadTotal(), missed = S.calls.filter(c => c.to === S.uid && c.state === 'missed' && c.ts > S.cfg.callsSeen).length, st = unseenSt();
  $('#nav').replaceChildren(...TABS.map(([k, t, i]) => h('button', { class: S.tab === k ? 'on' : '', onclick: () => { S.tab = k; render(true); } }, ico(i, 24), t, k === 'chats' && un ? h('span', { class: 'badge blue' }, un) : null, k === 'calls' && missed ? h('span', { class: 'badge' }, missed) : null, k === 'status' && st ? h('span', { class: 'dot' }) : null)));
  const hb = $('#heads'); const show = S.cfg.heads && un > 0 && S.tab !== 'chats' && !S.chat; hb.style.display = show ? 'flex' : 'none'; const bd = hb.querySelector('.badge'); if (bd) { bd.hidden = !un; bd.textContent = un; }
  document.title = (un ? `(${un}) ` : '') + 'كلمات ماسنجر';
}
function renderNow(force) {
  if (S.view !== 'app') return; renderNav();
  if (S.tab === 'settings' && !force) return;
  if (S.tab === 'chats' && $('#clist') && !force) return paintChatList();
  const m = $('#main'), y = m.scrollTop; m.replaceChildren(({ chats: vChats, status: vStatus, calls: vCalls, radar: vRadar, settings: vSettings })[S.tab]()); m.scrollTop = y;
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

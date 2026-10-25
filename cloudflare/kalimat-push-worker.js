/**
 * Kalimat push relay for Cloudflare Workers.
 *
 * Required Worker secrets/variables:
 *   FIREBASE_SERVICE_ACCOUNT (secret): full service-account JSON for project kalimat-2014
 *   FIREBASE_API_KEY (secret or variable): Firebase Web API key for ID-token lookup
 *
 * POST JSON:
 *   { "kind": "message", "chatId": "..." }
 *   { "kind": "call", "callId": "..." }
 * Authorization: Bearer <Firebase ID token>
 *
 * Never accept recipient IDs or notification text from the client. Recipients and
 * notification content are derived from Firestore after authenticating the sender.
 */
const PROJECT_ID = "kalimat-2014";
const ALLOWED_ORIGIN = "https://hassan2026go.github.io";

function response(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin || ALLOWED_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
      "vary": "Origin"
    }
  });
}
function b64url(bytes) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function enc(s) { return new TextEncoder().encode(s); }
async function oauthAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(enc(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })));
  const unsigned = header + "." + claim;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", keyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc(unsigned));
  const assertion = unsigned + "." + b64url(signature);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion })
  });
  if (!r.ok) throw new Error("Google OAuth token exchange failed");
  return (await r.json()).access_token;
}
async function authenticatedUid(idToken, apiKey) {
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const data = await r.json();
  const user = data.users && data.users[0];
  if (!user || user.localId == null || user.disabled) return null;
  return user.localId;
}
function fieldValue(v) {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fieldValue);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fieldValue(x)]));
  return undefined;
}
function decodeDoc(doc) {
  return Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, fieldValue(v)]));
}
async function firestoreDoc(accessToken, path) {
  const url = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/" + path.split("/").map(encodeURIComponent).join("/");
  const r = await fetch(url, { headers: { authorization: "Bearer " + accessToken } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Firestore read failed");
  return decodeDoc(await r.json());
}
async function sendFcm(accessToken, token, title, body, url, tag) {
  const r = await fetch("https://fcm.googleapis.com/v1/projects/" + PROJECT_ID + "/messages:send", {
    method: "POST",
    headers: { authorization: "Bearer " + accessToken, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { url, tag },
        android: { priority: "HIGH", notification: { channel_id: "kalimat_messages", sound: "default", tag } }
      }
    })
  });
  // A stale token should not fail the whole recipient fan-out.
  return r.ok;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-max-age": "86400",
      "vary": "Origin"
    }});
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405, origin);
    if (origin !== ALLOWED_ORIGIN && origin !== "capacitor://localhost" && origin !== "http://localhost") {
      return response({ error: "origin_not_allowed" }, 403, ALLOWED_ORIGIN);
    }
    if (!env.FIREBASE_SERVICE_ACCOUNT || !env.FIREBASE_API_KEY) return response({ error: "worker_secrets_missing" }, 503, origin);
    const auth = request.headers.get("Authorization") || "";
    const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!idToken) return response({ error: "unauthorized" }, 401, origin);
    let input;
    try { input = await request.json(); } catch { return response({ error: "invalid_json" }, 400, origin); }
    if (!input || !["message", "call"].includes(input.kind)) return response({ error: "invalid_kind" }, 400, origin);
    const id = input.kind === "message" ? input.chatId : input.callId;
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,180}$/.test(id)) return response({ error: "invalid_id" }, 400, origin);
    try {
      const uid = await authenticatedUid(idToken, env.FIREBASE_API_KEY);
      if (!uid) return response({ error: "unauthorized" }, 401, origin);
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.project_id !== PROJECT_ID || !sa.client_email || !sa.private_key) return response({ error: "service_account_invalid" }, 503, origin);
      const accessToken = await oauthAccessToken(sa);
      let recipients = [];
      let title = "كلمات";
      let body = "لديك رسالة جديدة";
      let url = "/#chats";
      let tag = "kalimat-message";
      if (input.kind === "message") {
        const chat = await firestoreDoc(accessToken, "mx_chats/" + id);
        if (!chat || !Array.isArray(chat.members) || !chat.members.includes(uid)) return response({ error: "forbidden" }, 403, origin);
        recipients = chat.members.filter(x => x !== uid);
      } else {
        const call = await firestoreDoc(accessToken, "mx_calls/" + id);
        if (!call || call.from !== uid || call.state !== "ringing" || !Array.isArray(call.parts) || !call.parts.includes(uid) || !call.to) return response({ error: "forbidden" }, 403, origin);
        recipients = [call.to];
        title = "مكالمة واردة — كلمات";
        body = call.type === "video" ? "مكالمة فيديو واردة" : "مكالمة صوتية واردة";
        url = "/#calls";
        tag = "kalimat-call-" + id;
      }
      let sent = 0;
      for (const recipient of [...new Set(recipients)].slice(0, 10)) {
        const user = await firestoreDoc(accessToken, "mx_users/" + recipient);
        const tokens = Array.isArray(user?.pushTokens) ? user.pushTokens.filter(t => typeof t === "string" && t.length > 20).slice(0, 10) : [];
        for (const token of tokens) if (await sendFcm(accessToken, token, title, body, url, tag)) sent++;
      }
      return response({ ok: true, sent }, 200, origin);
    } catch (e) {
      // Never return credentials, token contents, or upstream response bodies.
      return response({ error: "push_delivery_failed" }, 502, origin);
    }
  }
};

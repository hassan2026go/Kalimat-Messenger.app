const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

initializeApp();
const db = getFirestore();
const REGION = 'europe-west1';
const APP_URL = 'https://hassan2026go.github.io/Kalimat-Messenger.app/';

async function tokensFor(uid) {
  const snap = await db.collection('mx_users').doc(uid).collection('pushTokens').get();
  return snap.docs.map((d) => ({ id: d.id, token: d.get('token') })).filter((x) => typeof x.token === 'string' && x.token.length > 20);
}

async function sendToUser(uid, message) {
  const docs = await tokensFor(uid);
  if (!docs.length) return;
  const response = await getMessaging().sendEachForMulticast({
    tokens: docs.map((x) => x.token),
    ...message,
  });
  const stale = [];
  response.responses.forEach((result, i) => {
    if (!result.success && [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ].includes(result.error?.code)) stale.push(docs[i].id);
  });
  await Promise.all(stale.map((id) => db.collection('mx_users').doc(uid).collection('pushTokens').doc(id).delete().catch(() => {})));
}

exports.notifyNewMessage = onDocumentCreated({
  document: 'mx_chats/{chatId}/msgs/{messageId}',
  region: REGION,
  retry: true,
}, async (event) => {
  const msg = event.data?.data();
  if (!msg || typeof msg.from !== 'string') return;
  const chatSnap = await db.collection('mx_chats').doc(event.params.chatId).get();
  if (!chatSnap.exists) return;
  const chat = chatSnap.data();
  const recipients = (chat.members || []).filter((uid) => uid !== msg.from);
  await Promise.all(recipients.map(async (uid) => {
    const userSnap = await db.collection('mx_users').doc(uid).get();
    const muted = userSnap.exists && (userSnap.get('pushMutedChats') || []).includes(event.params.chatId);
    const enabled = userSnap.exists ? userSnap.get('pushEnabled') !== false : true;
    if (muted || !enabled) return;
    // Message bodies are end-to-end encrypted. Never include message text in a push payload.
    await sendToUser(uid, {
      notification: { title: 'كلمات — رسالة جديدة', body: 'لديك رسالة جديدة' },
      data: {
        kind: 'message',
        chatId: event.params.chatId,
        messageId: event.params.messageId,
        url: APP_URL,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'kalimat_messages', tag: 'chat-' + event.params.chatId },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: { title: 'كلمات — رسالة جديدة', body: 'لديك رسالة جديدة', tag: 'chat-' + event.params.chatId },
        fcmOptions: { link: APP_URL },
      },
    });
  }));
});

exports.notifyIncomingCall = onDocumentCreated({
  document: 'mx_calls/{callId}',
  region: REGION,
  retry: true,
}, async (event) => {
  const call = event.data?.data();
  if (!call || typeof call.from !== 'string' || typeof call.to !== 'string' || call.state !== 'ringing') return;
  const callerSnap = await db.collection('mx_users').doc(call.from).get();
  const callerName = callerSnap.exists ? (callerSnap.get('name') || 'جهة اتصال') : 'جهة اتصال';
  await sendToUser(call.to, {
    notification: {
      title: call.type === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة',
      body: 'مكالمة واردة من ' + callerName,
    },
    data: {
      kind: 'incoming_call',
      callId: event.params.callId,
      callType: call.type === 'video' ? 'video' : 'audio',
      from: call.from,
      url: APP_URL,
    },
    android: {
      priority: 'high',
      ttl: 45000,
      notification: {
        channelId: 'kalimat_calls',
        tag: 'call-' + event.params.callId,
        visibility: 'public',
        sticky: true,
      },
    },
    webpush: {
      headers: { Urgency: 'high', TTL: '45' },
      notification: {
        title: call.type === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة',
        body: 'مكالمة واردة من ' + callerName,
        tag: 'call-' + event.params.callId,
        requireInteraction: true,
      },
      fcmOptions: { link: APP_URL },
    },
  });
});

exports.notifyMissedCall = onDocumentUpdated({
  document: 'mx_calls/{callId}',
  region: REGION,
  retry: true,
}, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.state === after.state || !['missed', 'declined'].includes(after.state)) return;
  if (typeof after.from !== 'string' || typeof after.to !== 'string') return;
  if (after.state === 'declined') return;
  const calleeSnap = await db.collection('mx_users').doc(after.to).get();
  const calleeName = calleeSnap.exists ? (calleeSnap.get('name') || 'جهة اتصال') : 'جهة اتصال';
  await sendToUser(after.from, {
    notification: { title: 'مكالمة فائتة', body: 'لم يرد ' + calleeName + ' على مكالمتك' },
    data: { kind: 'missed_call', callId: event.params.callId, url: APP_URL },
    android: { priority: 'high', notification: { channelId: 'kalimat_messages', tag: 'missed-' + event.params.callId } },
    webpush: { notification: { title: 'مكالمة فائتة', body: 'لم يرد ' + calleeName + ' على مكالمتك' }, fcmOptions: { link: APP_URL } },
  });
});

exports.healthCheck = require('firebase-functions/v2/https').onRequest({ region: REGION }, (_req, res) => {
  logger.info('Kalimat notification service health check');
  res.status(200).json({ ok: true, service: 'kalimat-notifications' });
});

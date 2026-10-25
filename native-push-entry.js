import { PushNotifications } from '@capacitor/push-notifications';

const listeners = new Set();
let started = false;
let lastToken = null;

export async function startNativePush() {
  if (started) return null;
  started = true;

  PushNotifications.addListener('registration', token => {
    lastToken = token.value;
    for (const listener of listeners) listener(lastToken);
  });
  PushNotifications.addListener('registrationError', error => {
    console.error('[Kalimat native push] registration failed', error);
  });
  PushNotifications.addListener('pushNotificationReceived', notification => {
    window.dispatchEvent(new CustomEvent('kalimat-native-push', { detail: notification }));
  });
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    const url = action.notification?.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) {
      window.location.hash = url;
    }
  });

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== 'granted') {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== 'granted') {
    started = false;
    return null;
  }
  // Create the Android notification channel before registering for FCM.
  // This channel ID must match the ID used by the Cloudflare FCM sender.
  try {
    await PushNotifications.createChannel({
      id: 'kalimat_messages',
      name: 'رسائل ومكالمات Kalimat',
      description: 'تنبيهات الرسائل والمكالمات الواردة',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#2563ff'
    });
  } catch (error) {
    console.warn('[Kalimat native push] notification channel setup failed', error);
  }
  await PushNotifications.register();
  return true;
}

export function onNativePushToken(callback) {
  listeners.add(callback);
  if (lastToken) callback(lastToken);
  return () => listeners.delete(callback);
}

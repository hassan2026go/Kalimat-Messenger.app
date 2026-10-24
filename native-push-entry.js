import { PushNotifications } from '@capacitor/push-notifications';

const listeners = new Set();
let started = false;

export async function startNativePush() {
  if (started) return null;
  started = true;

  PushNotifications.addListener('registration', token => {
    for (const listener of listeners) listener(token.value);
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
  await PushNotifications.register();
  return true;
}

export function onNativePushToken(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

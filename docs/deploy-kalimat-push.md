# Deploy the Kalimat push relay

The app now calls `https://kalimat-push.hassan2026go.workers.dev` after a message is written and after an outgoing call is created. The Worker source is `cloudflare/kalimat-push-worker.js`.

## Deploy the source to the existing Cloudflare Worker

1. Open the existing Worker named `kalimat-push` in Cloudflare.
2. Open **Edit code** (or **Quick edit**), replace the Hello World code with the complete contents of `cloudflare/kalimat-push-worker.js`, then **Deploy**.
3. In the Worker settings, add these as **Secrets**, not plain text in source code:
   - `FIREBASE_API_KEY`: the Web API key from the Firebase project settings for `kalimat-2014`.
   - `FIREBASE_SERVICE_ACCOUNT`: the entire JSON contents of a Google Cloud service-account key for project `kalimat-2014`. Grant that service account only the minimum needed to read the Firestore documents used here and send Firebase Cloud Messaging (typically a narrowly scoped custom role with Firestore read permissions and Firebase Cloud Messaging API send permission; do not grant Owner/Editor). Enable Firebase Cloud Messaging API in the project.
4. Never paste the service-account JSON into chat, commit it, or include it in an APK. If a key is exposed, revoke it immediately.

## Request behavior

- The caller sends a Firebase ID token in the Authorization header.
- The Worker validates the token with Firebase Authentication.
- For message events, it verifies the caller is a member of the chat and derives recipients from `mx_chats/{chatId}.members`.
- For call events, it verifies that the caller owns a currently ringing call and derives the recipient from `mx_calls/{callId}`.
- Notification text is generic; encrypted message content is never sent to FCM.

## Important test notes

- A successful Android build alone does not prove push delivery.
- Test on two physical Android devices with the app fully closed on the recipient device.
- Android 13+ must have notification permission enabled for the app.
- The current source uses a generic notification channel id `kalimat_messages`; if the Android app has no channel with this id, Android may use fallback behavior. Verify the channel/sound on-device and adjust if needed.
- This initial implementation does not remove invalid/stale FCM tokens from `mx_users/{uid}.pushTokens`. Delivery is best-effort and should be tested before merging to `main`.

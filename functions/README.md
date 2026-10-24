# Kalimat push notification service

This Firebase Functions v2 service sends generic push notifications for new chat messages, incoming audio/video calls, and missed calls. It deliberately does **not** include encrypted message bodies in notifications.

## What this service expects

- Firebase project: `kalimat-2014`
- Existing Firestore collections: `mx_users`, `mx_chats/{chatId}/msgs`, and `mx_calls`
- Device tokens stored at `mx_users/{uid}/pushTokens/{tokenHash}` with a `token` string field.
- Optional user settings on `mx_users/{uid}`: `pushEnabled: false` disables push; `pushMutedChats: [chatId, ...]` suppresses a chat.
- FCM enabled for the Firebase project and Android app registered with package `com.kalimat.messenger`.

## Deploy

Use a trusted local environment with Firebase CLI authenticated to the intended project. Never commit service-account keys or FCM credentials.

```sh
cd functions
npm install
npm run lint
cd ..
firebase use kalimat-2014
firebase deploy --only functions
```

Cloud Functions deployment may require the Firebase project to be on the Blaze billing plan. Confirm current pricing and enable billing deliberately before deployment.

## Important: this backend is not the whole feature

The native Android app must register with FCM and securely write its current token to `mx_users/{uid}/pushTokens/{tokenHash}`, remove stale tokens on logout, request Android 13+ notification permission, and create notification channels `kalimat_messages` and `kalimat_calls`. The build must include Firebase's Android configuration and Google Services Gradle plugin. Incoming-call actions, full-screen call UI, native ringing/audio focus, runtime permissions, and behavior under force-stop still require native implementation and physical-device testing. Do not claim the system is production-ready until these are completed and tested.
